// Shared helpers for the IRFAN-GD admin APIs (Phase 3).
// Gate design (owner decision 2026-11-11, "Lock ke baghair chalu kar do"):
// - If the ACCESS_* secrets ARE set, every endpoint verifies the Cloudflare
//   Access JWT (signature vs the team JWKS, exp, aud, iss, owner email) =>
//   the lock is ON, owner-only, fail closed.
// - If the ACCESS_* secrets are NOT set, READ endpoints (overview) run in
//   PUBLIC MODE: anyone with the URL can view the dashboard numbers. This
//   was the owner's explicit, informed choice; setting the ACCESS_* secrets
//   later turns the lock back ON automatically with no code change.
// - WRITE endpoints (import, sync) use requireOwnerForWrite(): in public
//   mode they stay DISABLED (403) so nobody can alter data; with the lock
//   configured they require the verified owner JWT as before.
const enc = new TextEncoder();

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToJson(s) { return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))); }

let jwksCache = { at: 0, keys: null };
async function getJwks(teamDomain) {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.at < 10 * 60 * 1000) return jwksCache.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('jwks fetch failed');
  const data = await res.json();
  jwksCache = { at: now, keys: data.keys || [] };
  return jwksCache.keys;
}

// Returns { email } on success, or a Response (already-built error) on failure.
export async function requireOwner(context) {
  const { request, env } = context;
  const teamDomain = env.ACCESS_TEAM_DOMAIN; // e.g. irfangd.cloudflareaccess.com
  const aud = env.ACCESS_AUD;                 // Access application AUD tag
  const ownerEmail = (env.OWNER_EMAIL || '').toLowerCase();
  if (!teamDomain || !aud || !ownerEmail) {
    return { email: 'public', publicMode: true };
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { error: json({ error: 'Authentication required.' }, 401) };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('bad token');
    const header = b64urlToJson(parts[0]);
    const payload = b64urlToJson(parts[1]);
    const keys = await getJwks(teamDomain);
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) throw new Error('unknown kid');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
    if (!ok) throw new Error('bad signature');
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec) throw new Error('expired');
    if (payload.aud !== aud && !(Array.isArray(payload.aud) && payload.aud.includes(aud))) throw new Error('wrong audience');
    if (payload.iss !== `https://${teamDomain}`) throw new Error('wrong issuer');
    const email = String(payload.email || '').toLowerCase();
    if (!email || email !== ownerEmail) return { error: json({ error: 'Owner access only.' }, 403) };
    return { email };
  } catch (e) {
    return { error: json({ error: 'Invalid access token.' }, 401) };
  }
}

// Write-action gate: stricter than requireOwner(). In public mode (no
// ACCESS_* secrets) writes are refused outright, so view-only public access
// can never be used to import data or trigger a sync.
export async function requireOwnerForWrite(context) {
  const auth = await requireOwner(context);
  if (auth.error) return auth;
  if (auth.publicMode) {
    return { error: json({ connected: false, error: 'Write actions are disabled until the Access lock is configured.' }, 403) };
  }
  return auth;
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Records one durable admin-activity row (D1 `admin_log`). Best-effort:
// a logging failure must never break the owner's actual action.
export async function logActivity(env, actor, action, detail, result) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      'INSERT INTO admin_log (ts, actor, action, detail, result) VALUES (?1, ?2, ?3, ?4, ?5)'
    ).bind(new Date().toISOString(), actor || 'owner', action, String(detail || '').slice(0, 300), result || 'ok').run();
  } catch (e) { /* best effort */ }
}

// Records a session_start row once per Access session (keyed by the JWT's
// session id `sid` when present, else by JWT id) so the durable D1 log also
// covers logins, complementing Cloudflare's own 24h Access log retention.
export async function logSessionStart(context, email) {
  const { request, env } = context;
  if (!env.DB) return;
  try {
    const token = request.headers.get('Cf-Access-Jwt-Assertion') || '';
    const parts = token.split('.');
    if (parts.length !== 3) return;
    const payload = b64urlToJson(parts[1]);
    const sid = payload.sid || payload.jti || '';
    if (!sid) return;
    const existing = await env.DB.prepare('SELECT id FROM admin_log WHERE action = ?1 AND detail LIKE ?2 LIMIT 1')
      .bind('session_start', '%' + sid + '%').first();
    if (!existing) await logActivity(env, email, 'session_start', 'Access session ' + sid, 'ok');
  } catch (e) { /* best effort */ }
}
