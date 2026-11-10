# NEXA — Google Search Console Guide (Post-Deploy)

Nothing here can be completed before the site is deployed to a public URL.
No verification code exists yet, and none is faked anywhere in the build.

## 1. Create the property

1. Go to Google Search Console → Add property → **URL prefix** with the final
   deployed URL (proposed: `https://nexa1st.pages.dev/` — confirm at deploy).
2. Pick a verification method (below), verify, done.

## 2. Verification methods supported by this site

- **HTML meta tag (built-in support):** GSC gives you a code like
  `content="abc123..."`. Set it in the environment as
  `PUBLIC_GSC_VERIFICATION=abc123...` (Cloudflare Pages → Settings →
  Environment variables, and/or a local `.env` — never commit `.env`), then
  redeploy. The layout emits `<meta name="google-site-verification">` **only**
  when the variable is set; QA confirmed it is absent while unset.
- **DNS:** Add the TXT record GSC provides at your DNS provider. Only possible
  with a custom domain (a `pages.dev` subdomain's DNS is Cloudflare's).
- **Google Analytics method:** Works only after this site's OWN GA4 property
  exists and its measurement ID is set via `PUBLIC_GA_MEASUREMENT_ID`
  (see README). Do not reuse another property's ID.

## 3. Submit the sitemap (after verification)

GSC → Sitemaps → enter `sitemap-index.xml` → Submit. The build generates
`sitemap-index.xml` + `sitemap-0.xml` automatically; QA validated the XML and
route coverage locally (61 URLs; only `/404/` intentionally excluded).
Also confirm `robots.txt` loads at `/robots.txt` — it references the sitemap.

## 4. Indexing readiness checklist

- [ ] Site deployed on the final URL; `astro.config.mjs` `site` matches it.
- [ ] GSC property verified (method above).
- [ ] Sitemap submitted and read successfully in GSC.
- [ ] Spot-check 3–5 pages with GSC's URL Inspection → "Page is eligible"
      (being eligible is not a ranking promise — nothing can promise that).
- [ ] GA4 property created for THIS site and ID set (optional, separate step).
