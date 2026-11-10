# NEXA — CMS Guide (Decap CMS, Git-Based)

## Honest status

The CMS is **Decap CMS**, configured in `public/admin/config.yml`, editing
files in the GitHub repository **`Nexa1st/nexa.1st`** (branch `main`) — the
repo the site owner creates manually (GitHub → New repository → name
`nexa.1st`, no template). **The admin is NOT live-secured yet.** It activates
only when BOTH exist:

1. The repo `Nexa1st/nexa.1st` with this project pushed to `main`, and
2. An auth route: **Netlify Identity + Git Gateway** (switch the backend in
   `config.yml` to `git-gateway` as commented there) **or** a GitHub OAuth
   app/proxy for Decap's `github` backend.

Until then `/admin/` shows a noindexed placeholder explaining this, and the
Decap script tag stays commented out. **GitHub repository permissions are the
auth gate**: only people with write access to the repo can publish. Never
share repo access casually.

## Daily workflows

- **Create an article:** Admin → Articles → New. Fill title, description,
  category, tags, author, publish date, body. Or locally: add a Markdown file
  to `src/content/blog/` with the same frontmatter and push.
- **Edit / delete:** Open the entry in the CMS (editorial workflow creates a
  pull request you can review), or edit the file directly. Deleting the file
  deletes the page on the next build.
- **Drafts:** Set **Draft = true** (or use the editorial workflow's Draft
  status). Drafts are excluded from the build — verified in QA with a test
  draft that produced no page, no sitemap entry, no search-index entry.
- **Scheduling (real, build-level):** Set a **future Publish Date**. The build
  filters out future-dated posts (`pubDate <= now` in `src/lib/content.ts`),
  so the post appears automatically on the first build/deploy after its date.
  Verified in QA with a test post dated 2027 (absent everywhere), then removed.
  Note: a new build must actually run after the date — on Cloudflare Pages,
  redeploy or push any commit to trigger it.
- **Publish:** Set Draft = false, date today or past, save/merge. The next
  build/deploy makes it live.
- **Images:** Uploads go to `public/images/uploads/` (site path
  `/images/uploads/...`). Use descriptive filenames
  (`ai-video-reference-image-example.jpg`), prefer WebP/AVIF for raster
  uploads, and ALWAYS fill **Image Alt Text** — it is required whenever an
  image is set.
- **Categories & tags:** Categories are a fixed list (they map to topic
  clusters — see KEYWORD-RESEARCH.md). Tags are free-form; reuse existing tags
  instead of inventing near-duplicates.
- **SEO fields:** Focus keyword, secondary/long-tail keywords (metadata only —
  never stuff them into copy), search intent, target country (default US),
  topic cluster, pillar flag, FAQs (rendered + FAQ schema), SEO title /
  description overrides, canonical override, OG/social image. Related
  articles are automatic (category/tags/cluster) unless future tooling adds a
  manual relation.
- **Products:** Price field is OPTIONAL and only for a verified price —
  leave empty for "Check price". Affiliate URL is manual-only, per product.
  Ratings are editorial and labelled as such on the site.
- **Preview:** Locally: `npm run dev` (live) or `npm run build && npm run
  preview`. In the CMS, editorial workflow + deploy previews (if enabled on
  the host) are the review path.

## Writing rules

- **Exactly one H1 per page:** the template renders the title as the H1, so
  article bodies must start at `##` (H2). The sample articles are linted for
  this (0 body H1s).
- Original, human-reviewed content. No stuffed keywords, no fabricated facts,
  prices, ratings or credentials.
- Slugs: lowercase-hyphen, no dates, from the title — Decap is configured to
  generate them that way.
