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
// === BEGIN: paste the full contents of functions/api/admin/_ga4.js here ===
// (runGa4Sync must be defined in this file — Workers are single-module
//  unless deployed with a bundler; keeping one file keeps the owner step
//  copy-paste simple and auditable.)
// === END paste ===

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
