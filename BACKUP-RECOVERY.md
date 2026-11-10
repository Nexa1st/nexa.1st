# NEXA — Backup & Recovery

## Source of truth

The GitHub repository **`Nexa1st/nexa.1st`** (to be created manually by the
owner — it does not exist yet) is the single source of truth once this project
is pushed. The local workspace copy at `~/workspace/nexa-ultra-hybrid/` is a
secondary backup. Content lives as Markdown/JSON files in git — there is no
database to back up.

## Version preservation

- Tag releases in git, e.g. `git tag v1.0 && git push origin v1.0` for this
  1.0 build, and create a matching **GitHub Release** noting what changed.
- Never force-push over published history; never overwrite the owner's content
  changes without approval.

## Restore (from zero)

```bash
git clone https://github.com/Nexa1st/nexa.1st.git
cd nexa.1st
npm ci
npm run build      # static site in dist/
npm run preview    # optional local check
```

Then redeploy `dist/` via Cloudflare Pages (connect the repo, or re-upload).

## Cloudflare Pages rollback

Cloudflare Pages keeps previous deployments: Pages project → Deployments →
pick a known-good deployment → **Rollback**. This restores the earlier build
without touching the repo. (Project for this site is proposed as `nexa1st` —
NOT the existing `nexa-1st` NEXA Link project, which must never be reused.)

## Rules

- The repo wins on conflict; reconcile local changes by committing them, not
  by overwriting.
- No content file is deleted or rewritten without the owner's approval.
- Secrets never enter the repo: `.env` is gitignored; only `.env.example`
  (empty placeholders) is committed.
