// irfan-ga4-sync — standalone Cloudflare Worker (Phase 3, staging package).
// Purpose: the AUTOMATIC daily GA4 sync. Pages Functions cannot run Cron
// Triggers, so this tiny Worker exists for scheduling only.
//
// Deploy (OWNER step, after approval): create a Worker with this code, bind
// the SAME D1 database (binding name DB), add secrets GA4_PROPERTY_ID and
// GA4_SA_KEY, paste _ga4.js contents where marked, and add ONE Cron Trigger:
//     0 6 * * *        (daily 06:00 UTC)
// Free plan: Cron Triggers are included; this uses 1 trigger and 1 run/day.
//
// Security: this Worker exposes NO HTTP endpoint (fetch returns 404) and
// holds no public URL of value. Its only capability is: read GA4 aggregates
// with a read-only service account and write aggregates into D1. Failed runs
// are not retried on the free plan (known limit) — the dashboard shows the
// last successful sync time and has a manual "Sync now" backup.
//
// Shared GA4 -> D1 sync logic (Phase 3). Used by:
//   - POST /api/admin/sync          (manual "Sync now", owner-authenticated)
//   - the irfan-ga4-sync Worker     (daily Cron Trigger; separate file,
//                                    deployed by the owner as its own Worker)
// The GA4 service-account key lives ONLY in the GA4_SA_KEY secret
// (Cloudflare encrypted env var) — never in code, repo or browser.
// Data API is free; one sync costs a few quota tokens and pulls the last
// 30 days of `affiliate_click` counts grouped by (date, product).
// Aggregates only: no user-level data is ever requested or stored.

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  };
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = b64(header) + '.' + b64(claim);
  const pemBody = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const raw = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', raw.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + '.' + btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt,
  });
  if (!res.ok) throw new Error('Google token exchange failed (' + res.status + ')');
  const data = await res.json();
  return data.access_token;
}

const ymd = (d) => d.toISOString().slice(0, 10);
const gaDate = (s) => (s && s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

export async function runGa4Sync(env) {
  if (!env.DB) throw new Error('D1 database is not bound.');
  if (!env.GA4_PROPERTY_ID || !env.GA4_SA_KEY) throw new Error('GA4 sync is not configured yet (owner step pending).');
  let sa;
  try { sa = JSON.parse(env.GA4_SA_KEY); } catch (e) { throw new Error('GA4 service-account secret is not valid JSON.'); }

  const token = await accessToken(sa);
  const end = new Date();
  const start = new Date(Date.now() - 29 * 86400000);
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: ymd(start), endDate: ymd(end) }],
      dimensions: [{ name: 'date' }, { name: 'eventName' }, { name: 'customEvent:product' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'affiliate_click' } },
      },
      limit: 10000,
    }),
  });
  if (!res.ok) {
    // Most likely cause on first run: the `product` event parameter is not
    // yet registered as a custom dimension in GA4 (owner step, GA4 Admin →
    // Custom definitions). The error is surfaced, never silently swallowed.
    throw new Error('GA4 Data API error (' + res.status + '). If this mentions a custom dimension, register the "product" event parameter in GA4 Admin → Custom definitions first.');
  }
  const report = await res.json();
  const rows = (report.rows || []).map((r) => {
    const date = gaDate(r.dimensionValues[0].value);
    const product = r.dimensionValues[2] ? r.dimensionValues[2].value : '';
    const clicks = Number(r.metricValues[0].value) || 0;
    return [date, product, clicks];
  }).filter(([d, p]) => d && p);

  if (rows.length) {
    const stmts = rows.map(([d, p, c]) =>
      env.DB.prepare('INSERT INTO daily_clicks (date, product, clicks) VALUES (?1, ?2, ?3) ON CONFLICT(date, product) DO UPDATE SET clicks = excluded.clicks')
        .bind(d, p, c));
    await env.DB.batch(stmts);
  }
  const ts = new Date().toISOString();
  await env.DB.prepare('INSERT INTO sync_state (id, last_sync) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET last_sync = excluded.last_sync').bind(ts).run();
  return { syncedAt: ts, rows: rows.length };
}


export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runGa4Sync(env).catch(async (e) => {
        // Best-effort failure note in the durable log; never throws.
        try {
          await env.DB.prepare(
            'INSERT INTO admin_log (ts, actor, action, detail, result) VALUES (?1, ?2, ?3, ?4, ?5)'
          ).bind(new Date().toISOString(), 'cron:irfan-ga4-sync', 'auto_sync', String(e.message || e).slice(0, 200), 'fail').run();
        } catch (_) {}
      })
    );
  },
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
