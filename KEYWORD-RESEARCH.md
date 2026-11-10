# NEXA — Keyword Research (Free-Only Workflow)

No paid SEO tools. No invented search volumes anywhere in this project — if a
number did not come from a tool you can open, it is not written down as fact.
Keywords are **admin metadata** (frontmatter/CMS fields), never stuffed into
visible copy.

## The free workflow

1. **Google Trends** (trends.google.com) — compare up to 5 terms, set region to
   **United States**, 12-month view. Note direction and seasonality, not hype.
2. **Google autocomplete** — type the seed term in a private window, record the
   real suggestions Google returns. These are real queries people type.
3. **"People Also Ask" + related searches** — open the SERP for the seed term,
   copy the PAA questions (great FAQ material) and the related searches at the
   bottom of the page.
4. **Competitor SERP reading** — for the target query, open the top results and
   note: what intent they serve, what headings they use, what they miss. Write
   the better, more specific answer — do not copy.
5. **YouTube autocomplete** — for video-led topics, repeat step 2 on YouTube;
   short-form audiences search there first.
6. **After deploy: Google Search Console** — the Performance report shows the
   *real* queries your pages already appear for. That is your best keyword
   list: improve pages ranking on page 2 before inventing new topics.

## Intent classification (matches the CMS `searchIntent` field)

| Intent | Searcher wants | NEXA format |
|---|---|---|
| Informational | To learn/understand | Guides, explainers (most NEXA articles) |
| Navigational | A specific site/tool | Tools directory entries (official links) |
| Commercial | To compare before deciding | Editorial reviews, comparisons, pros/cons |
| Transactional | To buy/sign up now | Rarely — only genuine product pages |

Rule: match the page format to the intent. An informational query answered by
a sales page (or the reverse) will not hold rankings or readers.

## US targeting notes

- Site language is `en-US`, dates render in US format, `targetCountry` defaults
  to `US` in frontmatter, and hreflang is `en-US` + `x-default`.
- Use US spelling in titles/copy (optimize, behavior, center) and US examples
  where a choice exists. Check Trends with the region pinned to the US.

## Content quality rules (non-negotiable)

- Original, human-reviewed content only. No spun, scraped or fabricated text.
- No keyword stuffing: the focus keyword guides the topic; it is not repeated
  mechanically in copy.
- No fake author credentials — bios stay factual (creator/editor roles only).
- No fake backlinks, link schemes, or purchased links. Earn links with useful
  content; internal linking (clusters/pillars) is the lever we control.
- **No one can guarantee rankings, indexing or traffic — including us.** SEO
  work improves eligibility and relevance; outcomes belong to search engines.

## Tracking table (copy per month — fill only with real GSC data after deploy)

| Keyword | Page URL | Intent | Cluster | GSC Impressions | GSC Clicks | Avg. Position | Last checked | Action |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |
