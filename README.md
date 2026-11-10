# NEXA — Ultra Hybrid v1.0

A complete, functional, static website + blog: **Astro + React + Tailwind CSS
v4 + Framer Motion + GSAP**, 100% free stack, macOS Tahoe–inspired Liquid
Glass design (inspiration only — not an Apple product, no Apple assets).

- **Local folder:** `~/workspace/nexa-ultra-hybrid/` · **npm package name:** `nexa-1st`
- **GitHub repo (owner creates manually):** `Nexa1st/nexa.1st` →
  https://github.com/Nexa1st/nexa.1st (does not exist yet; Muse's GitHub App
  cannot create repos — known 403 limit)
- **Brand:** display name **NEXA**, publisher handle **NEXA.1ST**
- **Status: LOCAL BUILD ONLY. Not deployed. Nothing public.**

## Run it

```bash
npm install
npm run dev       # local development
npm run build     # production build -> dist/
npm run preview   # preview the production build
node scripts/seo-check.mjs   # technical SEO/QA audit against dist/
```

## What's inside

- **Design:** Liquid Glass system, animated aurora + low-count particles,
  floating dock (desktop) + mobile glass dock, 3D tilt cards, magnetic hover,
  scroll reveal, Astro view transitions, loading screen, **5 themes**
  (Midnight Black, Liquid Silver, Arctic Blue, Purple Nebula, Pure Light)
  persisted in localStorage, **Lite effects** mode (auto on Save-Data /
  low-core devices, manual toggle in the theme menu).
- **Homepage:** animated wordmark hero with working global search, Trending
  Dashboard (editorial frontmatter flags — not analytics), Editorial Showcase,
  discovery clusters, tools showcase, gaming + earning bands, editorial
  product picks, recommendations, honest newsletter placeholder (not
  connected — the form sends/stores nothing and says so).
- **Blog engine:** Markdown content collections — 8 complete articles,
  categories/tags, authors, reading time, related + trending, client search
  & filters, static pagination, share links, Article + Breadcrumb JSON-LD.
- **Reading experience:** progress bar, auto TOC, prev/next, reading mode,
  cluster pillar/supporting-guide internal linking, FAQ sections + FAQPage
  schema where FAQs exist in frontmatter.
- **AI Tools Directory:** 12 real tools, official links only, search/filters,
  detail pages. Pricing is never invented — "Check official site" labels.
- **Products:** editorial reviews with pros/cons/specs, comparison table,
  optional verified price only, manual affiliate URLs with
  `rel="sponsored nofollow noopener"`, FTC disclosure on every product page.
- **Search:** static `search-index.json` (articles + tools + products),
  instant suggestions with `<mark>` highlighting, recent searches
  (localStorage), keyboard navigation, plus a **command palette (Ctrl/⌘+K)**.
- **CMS:** Decap CMS (Git-based) configured for `Nexa1st/nexa.1st` — see
  `CMS-GUIDE.md`. Not active until the repo + OAuth/Git Gateway exist.
- **SEO:** dynamic meta from frontmatter, canonical (with per-article
  override), OG/Twitter (default OG image + per-article image), sitemap,
  robots.txt, RSS, keyword fields, 7 topic clusters with pillar hubs.
  Audit: `SEO-ADVANCED-AUDIT.md`. Keyword workflow: `KEYWORD-RESEARCH.md`.

## Integrations — prepared, NOT active

| Integration | How it activates | Current state |
|---|---|---|
| Google Analytics 4 | Set `PUBLIC_GA_MEASUREMENT_ID` (this site needs its **own** GA4 property — do NOT reuse the NEXA Link page's ID, that property belongs to that page) then rebuild | Env empty → **no GA script in dist** (QA-verified) |
| Search Console | Set `PUBLIC_GSC_VERIFICATION`, or DNS/GA methods — see `GSC-GUIDE.md` | No code → no meta tag emitted (QA-verified) |
| AdSense / Adsterra | Owner pastes genuine codes into `src/config/ads.ts`, sets a position's network + network `enabled` → rebuild. Website banner/native codes do not exist yet in the owner's Adsterra account (only a Direct Link, which must NOT be embedded as an ad) | **Disabled.** Empty codes, all positions `network:'none'`, zero ad scripts in dist (QA-verified) |
| Newsletter | Owner connects a free provider (e.g. Buttondown) and replaces the form action | Placeholder form — sends/stores nothing, labelled as such |

## AdSense activation (when approved — future)

After AdSense approval, paste the real client/slot codes into the `adsense`
section of `src/config/ads.ts`, set the position networks, enable, rebuild.
Until then the slots render nothing in production.

## Deployment (DO NOT run without the owner's approval)

1. Owner creates the empty GitHub repo **`nexa.1st`** under `Nexa1st` and
   grants the GitHub App access; then push this folder to `main`.
2. Cloudflare Pages → Create project → connect the repo. **Project name
   proposal: `nexa1st`** (→ `nexa1st.pages.dev`) — Pages names cannot contain
   a dot, and `nexa-1st` is the existing NEXA Link project which must NOT be
   reused/overwritten. Confirm the name at deploy time; if it differs, update
   `site` in `astro.config.mjs` + `robots.txt` + admin `site_url`.
3. Build command `npm run build`, output directory `dist`. Free plan only.
4. Set env vars (GA/GSC) in Pages settings if activating them.
5. Follow `GSC-GUIDE.md` (verify + submit sitemap) and `BACKUP-RECOVERY.md`
   (tag `v1.0`).

See `REPORT.md` for the full audit (features, build/QA results, pending items).
