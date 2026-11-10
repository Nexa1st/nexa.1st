# NEXA v1.0 — PRE-DEPLOYMENT FINAL AUDIT

**Date:** 2026-11-10 · **Project:** `~/workspace/nexa-ultra-hybrid/` (Astro 5, static)
**Scope:** local checks only. Nothing deployed, no GitHub repo created or pushed to, nothing purchased, no feature removed.

---

## 1. npm audit results

**Status: NOT EXECUTABLE in this build environment — no counts can honestly be reported.**

| | Critical | High | Moderate | Low |
|---|---|---|---|---|
| Before | unknown — endpoint blocked | unknown | unknown | unknown |
| After | unknown — endpoint blocked | unknown | unknown | unknown |

- Attempts: `npm audit`, `npm audit --json`, `npm audit --registry=https://registry.npmjs.org --json`, `npm audit fix --dry-run`. All returned: `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick - policy_denied` (egress proxy policy `zz_managed_internal_spaces_package_registries`). Raw outputs saved: `audit-npm.json`, `audit-npm-before.json`, `audit-npm-before.txt`, explanation in `audit-npm.txt`.
- No policy bypass was attempted and `npm audit fix --force` was not used.
- **Substitute evidence gathered instead:**
  - `npm outdated`: every package is at **Current == Wanted** — the latest release inside its declared semver range. The only newer versions are next majors (astro 7.x, @astrojs/mdx 8.x, @astrojs/react 7.x, framer-motion 14.x, typescript 7.x), deliberately not taken (breaking-change rule).
  - All 535 locked packages were freshly installed from the registry on 2026-11-10 for this project; no stale pins are carried.
  - Consequently, no safe within-range fix exists for `npm update`/`npm audit fix` to apply, even if the endpoint were reachable.
- **Risk note:** the shipped product is static HTML/CSS/JS. Build/dev tooling is not served to visitors, which reduces (but does not eliminate) the impact of typical toolchain advisories.
- **Required follow-up (owner):** after the GitHub push, enable Dependabot alerts on `Nexa1st/nexa.1st` and/or run `npm audit` once from an unrestricted network; fix any critical/high findings before or immediately after deployment.

## 2. astro check results

- Tooling: `@astrojs/check` installed as a devDependency (free; `^0.9.12`). `typescript` was already a devDependency and resolved to 5.9.3 inside its existing `^5.8.0` range. This is the one deliberate dependency change of this audit.
- **First run:** 7 errors, 0 warnings, 13 hints (39 files). Log: `astro-check-before.txt`.
- **Errors (7) — one root cause, real bug:** `src/components/AdSlot.astro` line 20 held an HTML comment inside a ternary expression; the Astro/TS parser read `<!-- Ad …` as code (`Cannot find name 'Ad'` + 6 cascading parse errors). The production build tolerated it; type-checking did not.
- **Final run: 0 errors, 0 warnings, 0 hints** (39 files). Log: `astro-check-after.txt`.

## 3. Fixes applied

1. `src/components/AdSlot.astro` — explanatory HTML comment moved out of the expression to above it; the disabled-branch now renders only `<Fragment />`. Ad behaviour is unchanged (still renders nothing while disabled).
2. Hints cleanup (all trivial, behaviour-preserving):
   - Removed unused `React` default imports in `CommandPalette.tsx`, `CookieConsent.tsx`, `Explorers.tsx`, `GlobalSearch.tsx`, `HeroMotion.tsx`, `ThemeSwitcher.tsx` (project uses `jsx: react-jsx`; no `React.*` usages existed).
   - Removed dead `tweenPause` declaration in `HeroMotion.tsx` (observer logic unchanged).
   - Removed unused `categories` const in `src/pages/index.astro`.
   - Removed unused `CLUSTERS` import in `src/pages/blog/category/[category].astro`.
   - Removed two dead variables (`siteBase`, `totalDist`) in `scripts/seo-check.mjs`.
   - `ViewTransitions` → `ClientRouter` in `src/layouts/BaseLayout.astro` (the component's current name in Astro 5; the built router bundle is present in dist).
3. OG default switched from SVG to the new PNG (see §6).
4. Docs updated: this file, a Pre-Deployment Check section appended to `REPORT.md`, and the two resolved limitation bullets in `REPORT.md` marked accordingly.
5. **No** `npm audit fix --force`, **no** major-version upgrades, **no** feature removed or disabled.

## 4. Build results

- `npm run build` — **PASS**. 62 pages built in ~6.4s, no errors. Log: `build-final.log`.
- dist size: **2.4 MB** on disk (≈2.0 MB across HTML/JS/CSS/JSON/XML per the SEO script's byte count; largest JS bundles unchanged: React runtime ~210 KB, Framer Motion proxy ~120 KB, GSAP hero ~71 KB, uncompressed).

## 5. HTML verification

- **HTML files in dist: 63** — exactly the pre-check count; nothing lost in the fixes.
- Spot-verified present: `/` (home), `/blog/` + page 2 (`/blog/page/2/`), **8 article pages**, **6 category hubs** (ai-machine-learning, technology, gaming, online-business, digital-marketing, creator-guides), **23 tag pages**, `/tools/` + **12 tool pages**, `/products/` + **2 reviews**, `/about/ /contact/ /privacy/ /terms/ /disclosure/`, `404.html`, `/admin/`, plus `rss.xml`, `search-index.json`, `sitemap-index.xml`, `sitemap-0.xml`, `robots.txt`, `_headers`, `_redirects`, `og-image.png`, `og-default.svg` (fallback).

## 6. OG image

- Created `public/og-image.png` with Python PIL (`scripts/make-og-image.py`, Liberation Sans TTF): dark liquid-glass panel over a midnight→blue→violet gradient mesh with aurora glows, large **NEXA** wordmark, tagline **"AI Tools · Technology · Gaming · Online Business"**, sub-line, and a subtle **NEXA.1ST** eyebrow handle. Visually inspected after generation.
- Verified: PNG format, **exactly 1200×630**, **142,872 bytes (~140 KB)** — well under the 500 KB target.
- `BaseLayout.astro` default `og:image`/`twitter:image` now resolves to `/og-image.png`; verified in the built home page and in a built article page (`https://nexa1st.pages.dev/og-image.png`). Per-article `ogImage`/`image` frontmatter still overrides the default (no article currently sets one — they inherit the new PNG). `og-default.svg` remains in `public/` and dist as a fallback asset; no references were broken.

## 7. Feature re-verification (code/build level, final build)

- **Themes:** all 5 present — `midnight` (Midnight Black), `silver` (Liquid Silver), `arctic` (Arctic Blue), `nebula` (Purple Nebula), `light` (Pure Light) — theme list in `ThemeSwitcher.tsx` and all five `[data-theme=…]` blocks in the built CSS; `data-theme` attribute present in built HTML.
- **Search:** `dist/search-index.json` contains **22 items**; `GlobalSearch` and `CommandPalette` JS bundles are built in `dist/_astro/`; `ClientRouter` bundle present after the rename.
- **CMS:** `public/admin/config.yml` still points to backend `github`, repo **`Nexa1st/nexa.1st`**, branch `main`; Decap remains inert (commented out in the admin placeholder) until the repo and OAuth/Git Gateway exist; `/admin/` is the only noindex page.
- **Ads:** `src/config/ads.ts` unchanged — master `enabled:false`, Adsterra `enabled:false` with all code fields empty (`bannerDesktop`, `bannerMobile`, `native`, `nativeBanner`, `inArticle`, `sidebar`, `responsive`, `socialBar`, `popunder`), AdSense `enabled:false` with empty fields, every position `network:'none'`. Final-build greps over dist HTML+JS: **ad script tags 0, `invoke.js` 0, googletagmanager script tags 0, GSC verification meta 0**. Stated precisely: the string `googletagmanager` occurs once in `dist/_headers` as a CSP allowlist entry (preparation for the future env-gated GA4) — no GA script, snippet or measurement ID exists in the output. The word "Adsterra" occurs only in Privacy/Disclosure page copy stating that ads are not active.
- **SEO script (`scripts/seo-check.mjs`) re-run on the final build:** pages 63; **100 JSON-LD blocks, 0 parse errors**; **0 duplicate titles, 0 duplicate descriptions**; exactly 1 H1 per page (0 issues); **0 broken internal links** across 66 internal targets; sitemap XML valid with **61 URLs** (only `/404/` excluded — correct); canonical missing only on `/admin/` (by design — it is a noindex placeholder); secrets scan **0 hits**; lorem ipsum **0**.
- **Scheduling/drafts behaviour** was proven during the original build (future-dated/draft test posts produced zero pages/sitemap/RSS/search entries) and the content set is unchanged since; the final build's page counts match exactly.
- **GA4/GSC:** still env-gated only (`PUBLIC_GA_MEASUREMENT_ID`, `PUBLIC_GSC_VERIFICATION`, both unset) — zero tracking output, as designed. The separate NEXA Link GA4 ID was not used anywhere.

## 8. Remaining issues / limitations

1. **Real `npm audit` still outstanding** — environment policy blocks the audit endpoint (see §1). Owner-side follow-up required (Dependabot after push, or a local audit run). This is the only reason the verdict is not a plain READY.
2. **Core Web Vitals: still pending** — cannot be measured before deployment; run PageSpeed Insights on the live URL after deploy. No scores are claimed anywhere in this project's docs.
3. The `site` URL (`https://nexa1st.pages.dev`) remains the proposed, not-yet-existing Pages address; canonicals, sitemap and OG URLs point there and must be reconfirmed if the owner picks a different project name at deploy time.
4. Decap CMS, GA4 (new property), GSC verification and both ad networks remain **prepared but inactive** — activation steps are documented in `README.md`, `CMS-GUIDE.md`, `GSC-GUIDE.md` and `src/config/ads.ts`, and each requires the owner's genuine accounts/codes and explicit go-ahead.

## 9. Deployment readiness verdict

**READY WITH NOTES**

The site builds cleanly, type-checks with zero diagnostics, keeps all 63 pages and every feature, ships a proper PNG share image, and contains no ad/analytics output while disabled. The single open note is the `npm audit` that this sandbox cannot execute — dependencies are verifiably at their latest within-range versions, and the audit must be completed owner-side (Dependabot or local run) around the GitHub push step of the roadmap.

**No deployment, no repository creation, no purchase and no activation was performed in this check. Waiting for the owner's approval.**
