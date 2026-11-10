// POST /api/admin/import — owner-only AliExpress Portals CSV import (Phase 3).
// Security controls (per approved plan, §C):
//  1. Owner-only: requireOwner() runs before the body is even read.
//  2. Type validation: .csv name + CSV text structure sniff (no binary).
//  3. Size validation: max 2 MB and max 5,000 data rows.
//  4. Schema validation: flexible-but-strict header mapping (see below).
//  5. Malformed => the WHOLE file is rejected; only line numbers reported.
//  6. Duplicates, two layers: SHA-256 file hash (identical file rejected)
//     + UNIQUE(row_date, item, amount) row constraint (rows skipped+counted).
//  7. Privacy: rows go only into D1; the file itself is never stored.
// Every attempt (success or failure) is written to admin_log.
//
// Expected CSV columns (AliExpress Portals report layouts vary; the importer
// maps headers flexibly but strictly):
//   date     <- a header containing "date" or "time"     (YYYY-MM-DD or DD/MM/YYYY)
//   item     <- a header containing "product", "item", "order" or "title"
//   amount   <- a header containing "commission", "earning" or "amount" (USD)
// If the real Portals export differs, adjust HEADER_MATCH below after seeing
// one genuine sample file — do NOT loosen row validation to make it fit.
import { requireOwner, json, logActivity } from './_auth.js';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;

const HEADER_MATCH = [
  { key: 'date', test: (h) => /date|time/.test(h) },
  { key: 'item', test: (h) => /product|item|order|title/.test(h) },
  { key: 'amount', test: (h) => /commission|earning|amount|income/.test(h) },
];

async function sha256Hex(buf) {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Minimal strict CSV parser: handles quoted fields, "" escapes, commas and
// newlines inside quotes. Throws on unbalanced quotes (=> malformed file).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += ch;
    } else if (ch === '"') {
      if (field.length) throw new Error('unexpected quote');
      inQ = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += ch;
  }
  if (inQ) throw new Error('unbalanced quotes');
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function normDate(raw) {
  const s = String(raw || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}
function normAmount(raw) {
  const s = String(raw || '').replace(/[^0-9.\-]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export async function onRequestPost(context) {
  const auth = await requireOwner(context);
  if (auth.error) return auth.error;
  const { request, env } = context;
  if (!env.DB) return json({ connected: false, error: 'D1 database is not bound yet (owner step pending).' }, 503);

  const fail = async (msg, status = 400, detail = '') => {
    await logActivity(env, auth.email, 'csv_import', detail || msg, 'fail');
    return json({ ok: false, error: msg }, status);
  };

  let form;
  try { form = await request.formData(); } catch (e) { return fail('Expected a multipart form upload.'); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return fail('No file was uploaded.');
  if (!/\.csv$/i.test(file.name || '')) return fail('Only .csv files are accepted.');
  if (file.size > MAX_BYTES) return fail('File is larger than 2 MB.');

  const buf = await file.arrayBuffer();
  const hash = await sha256Hex(buf);

  // Duplicate layer 1: identical file already imported?
  const dupe = await env.DB.prepare('SELECT id FROM import_files WHERE file_hash = ?1').bind(hash).first();
  if (dupe) return fail('This exact file was already imported (duplicate file rejected).', 409, 'hash ' + hash.slice(0, 12));

  // Type sniff: must decode as text and must not contain NUL bytes.
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return fail('File is not valid UTF-8 text.'); }
  if (text.includes('\u0000')) return fail('File does not look like a CSV (binary content detected).');
  text = text.replace(/^\uFEFF/, '');

  let rows;
  try { rows = parseCsv(text); } catch (e) { return fail('Malformed CSV: ' + e.message + '. File rejected — nothing was imported.'); }
  if (rows.length < 2) return fail('CSV has no data rows.');
  if (rows.length - 1 > MAX_ROWS) return fail('More than 5,000 data rows — split the report and import in parts.');

  // Header mapping (strict: all three columns must be found).
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const col = {};
  for (const rule of HEADER_MATCH) {
    const idx = header.findIndex((h) => rule.test(h));
    if (idx === -1) return fail('Required column missing: ' + rule.key + '. File rejected — nothing was imported.');
    col[rule.key] = idx;
  }

  // Row validation: collect EVERY bad line; any bad line rejects the file.
  const badLines = [];
  const clean = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const date = normDate(r[col.date]);
    const item = String(r[col.item] || '').trim().slice(0, 200);
    const amount = normAmount(r[col.amount]);
    if (!date || !item || amount === null) { badLines.push(i + 1); continue; }
    clean.push([date, item, amount]);
  }
  if (badLines.length) {
    return fail('Malformed rows at line(s): ' + badLines.slice(0, 20).join(', ') + (badLines.length > 20 ? '…' : '') + '. File rejected — nothing was imported.', 400, 'bad lines ' + badLines.length);
  }

  // Record the file, then insert rows; UNIQUE constraint skips duplicates.
  const fileRes = await env.DB.prepare(
    'INSERT INTO import_files (file_hash, file_name, imported_at, rows_ok, rows_skip) VALUES (?1, ?2, ?3, 0, 0)'
  ).bind(hash, String(file.name).slice(0, 120), new Date().toISOString()).run();
  const fileId = fileRes.meta.last_row_id;

  let imported = 0, skipped = 0;
  const stmts = clean.map(([d, item, amt]) =>
    env.DB.prepare('INSERT OR IGNORE INTO earnings (row_date, item, amount, currency, file_id) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(d, item, amt, 'USD', fileId));
  const results = await env.DB.batch(stmts);
  for (const r of results) {
    const changed = r.meta && typeof r.meta.changes === 'number' ? r.meta.changes : 0;
    if (changed > 0) imported++; else skipped++;
  }
  await env.DB.prepare('UPDATE import_files SET rows_ok = ?1, rows_skip = ?2 WHERE id = ?3').bind(imported, skipped, fileId).run();
  await logActivity(env, auth.email, 'csv_import', `${file.name} · ${imported} rows in, ${skipped} duplicates skipped · hash ${hash.slice(0, 12)}`, 'ok');

  return json({ ok: true, imported, skippedDuplicates: skipped, fileHash: hash });
}
