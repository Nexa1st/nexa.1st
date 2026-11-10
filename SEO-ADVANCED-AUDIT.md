# NEXA — SEO Advanced Audit

Generated 2026-11-10 from local checks against the production build
(`npm run build` → `dist/`), using `node scripts/seo-check.mjs` plus manual
greps. **No rankings, indexing or traffic claims are made anywhere in this
audit or on the site — those cannot be known or guaranteed pre-deploy.**

## Completed features

- Auto metadata from frontmatter (title/description, `seoTitle`/`seoDescription`
  overrides), canonical on every page (per-article `canonicalUrl` override
  supported), OG/Twitter cards, default OG image (`/og-default.svg`) +
  per-article `ogImage`/featured image support.
- Keyword architecture in schema + Decap CMS: `focusKeyword`,
  `secondaryKeywords`, `longTailKeywords`, `searchIntent`
  (informational/navigational/commercial/transactional), `targetCountry`
  (default US). Backfilled for all 8 sample articles from their real topics.
  Workflow documented in `KEYWORD-RESEARCH.md` (free tools only).
- Topical authority: 7 clusters (Artificial Intelligence, AI Tools &
  Tutorials, Technology, Gaming, Digital Marketing, Online Business, Product
  Reviews) mapped to categories; category pages are pillar hubs with real
  editorial intros + sibling-cluster links; `pillar: true` articles render a
  cluster block; every article auto-links UP to its hub and sideways to
  supporting guides in its cluster (verified present in dist HTML).
- FAQ support: `faqs` frontmatter renders a FAQ section + FAQPage JSON-LD
  only when present — added to 2 articles; FAQPage verified in dist.
- Structured data: Article + Breadcrumb JSON-LD on articles, Breadcrumb on
  tools/categories, Product on product pages, WebSite on all pages.
  **100 JSON-LD blocks extracted from dist — 100 parsed valid, 0 errors.**
- Sitemap (`@astrojs/sitemap`), `robots.txt` referencing the sitemap with the
  site base, RSS feed, internal linking (related articles, category links,
  breadcrumbs, cluster blocks, prev/next "read next" navigation).
- Image SEO: site visuals are CSS/SVG (tiny); `<img>` usage carries
  descriptive `alt`, `width`/`height`, `loading="lazy"`; CMS requires alt
  text guidance whenever an image is set; WebP/AVIF + Astro `<Image>`
  documented in `CMS-GUIDE.md` for future raster uploads.
- Exactly **one H1 per page** on all 63 dist HTML files (template renders the
  title; article bodies start at H2; sample Markdown linted — 0 body H1s).
- Slugs: lowercase-hyphen, no dates (an `.md`-extension leak in Astro legacy
  `entry.id` URLs was found in the first build and fixed via `entry.slug`).

## Failed checks

- **None outstanding.** Two findings were fixed during the audit:
  1. Article/product URLs initially contained `.md` (see above) — fixed and
     rebuilt; final dist routes are clean.
  2. Canonical missing on `/admin/` — **by design**: admin is a static
     noindex placeholder page, not a public page.

## Missing metadata

- `/admin/` has no canonical/OG — intentional (noindex placeholder).
- No page is missing a title or meta description (duplicate scan also clean:
  **0 duplicate titles, 0 duplicate descriptions** across dist).

## Technical errors

- Broken internal links: **0** (66 unique internal targets checked against dist).
- Accidental noindex scan: only `/admin/` carries noindex — correct.
- Canonical: present + absolute (`https://…`) on all public pages.
- Sitemap: XML parsed/validated OK; **61 URLs** for 62 public routes — the
  single gap is `/404/`, which sitemaps correctly exclude.
- Redirect chains: **N/A pre-deploy** — a static site with no legacy URLs;
  `public/_redirects` contains comments only, no rules. Revisit only if real
  URLs ever move after launch.
- Ad/analytics leakage scan: `invoke.js` 0, `googletagmanager` 0,
  `google-site-verification` 0 in dist (all integrations env/config-gated and
  off). The word "Adsterra" appears 3 times — in Privacy/Disclosure copy
  stating ads are **not** active; there are zero ad scripts.

## Content SEO recommendations

- After deploy, mine GSC's real query data monthly (see KEYWORD-RESEARCH.md)
  and improve page-2 content before adding new topics.
- Grow each cluster toward 1 pillar + 4–6 supporting guides; two clusters
  (Technology, Digital Marketing) currently have a pillar but few supports.
- Add FAQs only where readers genuinely ask the questions (PAA research);
  two articles have them today — resist templating them everywhere.
- Keep author bios factual; add real author pages only if the team grows.

## Pending Google integrations

- **Search Console:** not verified (no property, no code). Support built
  (env-gated meta tag) + steps in `GSC-GUIDE.md`; sitemap submission is a
  post-deploy action.
- **Google Analytics 4:** not connected. This site needs its OWN GA4 property;
  `PUBLIC_GA_MEASUREMENT_ID` is empty, so no GA script ships. (Reusing another
  NEXA page's measurement ID would corrupt both properties' data.)
- **Indexing status:** unknown and unknowable pre-deploy — intentionally not
  claimed anywhere.
