// GET /api/admin/overview — owner-only dashboard data (Phase 3, staging).
// Returns real aggregates ONLY: GA4 clicks from D1 (synced server-side),
// earnings summed from the owner's own imported Portals report rows, and
// the durable admin activity log. Nothing is estimated or fabricated.
import { requireOwner, json, logSessionStart } from './_auth.js';

export async function onRequestGet(context) {
  const auth = await requireOwner(context);
  if (auth.error) return auth.error;
  const { env } = context;
  if (!env.DB) return json({ connected: false, error: 'D1 database is not bound yet (owner step pending).' }, 503);

  await logSessionStart(context, auth.email);

  const since = (days) => {
    const d = new Date(Date.now() - days * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const [c7, c30, top, daily, earn, lastImp, sync, log] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(clicks),0) AS n FROM daily_clicks WHERE date >= ?1').bind(since(7)).first(),
    env.DB.prepare('SELECT COALESCE(SUM(clicks),0) AS n FROM daily_clicks WHERE date >= ?1').bind(since(30)).first(),
    env.DB.prepare('SELECT product, SUM(clicks) AS clicks FROM daily_clicks WHERE date >= ?1 GROUP BY product ORDER BY clicks DESC LIMIT 10').bind(since(30)).all(),
    env.DB.prepare('SELECT date, SUM(clicks) AS clicks FROM daily_clicks WHERE date >= ?1 GROUP BY date ORDER BY date ASC').bind(since(30)).all(),
    env.DB.prepare('SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS rows FROM earnings').first(),
    env.DB.prepare('SELECT imported_at FROM import_files ORDER BY id DESC LIMIT 1').first(),
    env.DB.prepare('SELECT last_sync FROM sync_state WHERE id = 1').first(),
    env.DB.prepare('SELECT ts, actor, action, detail, result FROM admin_log ORDER BY id DESC LIMIT 25').all(),
  ]);

  return json({
    connected: true,
    email: auth.email,
    lastSync: sync ? sync.last_sync : null,
    clicks7d: c7 ? c7.n : 0,
    clicks30d: c30 ? c30.n : 0,
    topProducts: (top && top.results) || [],
    dailySeries: (daily && daily.results) || [],
    earnings: {
      total: earn ? earn.total : 0,
      rows: earn ? earn.rows : 0,
      lastImport: lastImp ? lastImp.imported_at : null,
    },
    log: (log && log.results) || [],
  });
}
