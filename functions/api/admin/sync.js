// POST /api/admin/sync — manual "Sync now" (owner-only). The AUTOMATIC daily
// sync runs in the separate irfan-ga4-sync Worker on a Cron Trigger, which
// imports the same runGa4Sync() logic; this endpoint is the manual backup
// the approved plan required. There is NO public sync endpoint.
import { requireOwnerForWrite, json, logActivity } from './_auth.js';
import { runGa4Sync } from './_ga4.js';

export async function onRequestPost(context) {
  const auth = await requireOwnerForWrite(context);
  if (auth.error) return auth.error;
  const { env } = context;
  try {
    const out = await runGa4Sync(env);
    await logActivity(env, auth.email, 'manual_sync', out.rows + ' daily rows', 'ok');
    return json({ ok: true, syncedAt: out.syncedAt, rows: out.rows });
  } catch (e) {
    await logActivity(env, auth.email, 'manual_sync', String(e.message || e).slice(0, 200), 'fail');
    return json({ ok: false, error: String(e.message || e) }, 502);
  }
}
