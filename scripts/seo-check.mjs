#!/usr/bin/env node
/** NEXA technical SEO + QA checker. Run AFTER `npm run build`:  node scripts/seo-check.mjs
 *  Checks (all against dist/): canonical absolute, accidental noindex, duplicate
 *  titles/descriptions, JSON-LD parse validation, sitemap XML validity + route
 *  coverage, broken internal links, forbidden strings (ad networks / GA while
 *  env unset), single-H1 count, secrets scan over src. Prints a JSON summary. */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist', import.meta.url).pathname;
const src = new URL('../src', import.meta.url).pathname;
const walk = (dir, ext) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name), ext) : (e.name.endsWith(ext) ? [join(dir, e.name)] : []));
const htmlFiles = walk(dist, '.html');
const routeOf = f => '/' + relative(dist, f).replace(/index\.html$/, '').replace(/\.html$/, '/').replace(/^\/?$/, '');
const titles = new Map(), descs = new Map();
let canonicalMissing = [], canonicalRelative = [], noindexPages = [], jsonldErrors = [], jsonldCount = 0, h1Issues = [];
const internalLinks = new Set(); let brokenLinks = [];
const routes = new Set(htmlFiles.map(routeOf));

for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8'); const route = routeOf(f);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (title) { if (!titles.has(title)) titles.set(title, []); titles.get(title).push(route); }
  if (desc) { if (!descs.has(desc)) descs.set(desc, []); descs.get(desc).push(route); }
  const can = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (!can) canonicalMissing.push(route); else if (!can.startsWith('https://')) canonicalRelative.push(route);
  if (/noindex/i.test(html)) noindexPages.push(route);
  const h1s = (html.match(/<h1[\s>]/g) || []).length; if (h1s !== 1) h1Issues.push(`${route} (${h1s} H1)`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    jsonldCount++; try { JSON.parse(m[1]); } catch (e) { jsonldErrors.push(`${route}: ${e.message}`); }
  }
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    let u = m[1]; if (u.startsWith('//')) continue;
    internalLinks.add(u);
  }
}
for (const u of internalLinks) {
  const path = u.endsWith('/') ? join(dist, u, 'index.html') : join(dist, u);
  if (!existsSync(path) && !existsSync(join(dist, u, 'index.html'))) brokenLinks.push(u);
}
// Sitemap
let sitemapUrls = [], sitemapError = null, sitemapValid = false;
try {
  const idx = readFileSync(join(dist, 'sitemap-index.xml'), 'utf8');
  const files = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  for (const loc of files) {
    const name = loc.split('/').pop();
    const xml = readFileSync(join(dist, name), 'utf8');
    if (!xml.includes('</urlset>')) throw new Error(`${name} malformed`);
    sitemapUrls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname));
  }
  sitemapValid = true;
} catch (e) { sitemapError = e.message; }
const publicRoutes = [...routes].filter(r => !r.startsWith('/admin'));
const sitemapGaps = publicRoutes.filter(r => !sitemapUrls.includes(r === '' ? '/' : r) && !(r === '/' && sitemapUrls.includes('/')));
const dupTitles = [...titles.entries()].filter(([, v]) => v.length > 1);
const dupDescs = [...descs.entries()].filter(([, v]) => v.length > 1);
// Forbidden strings in dist (ads disabled + GA env unset => must be ZERO)
const allDist = walk(dist, '.html').map(f => readFileSync(f, 'utf8')).join('\n') +
  walk(dist, '.js').map(f => readFileSync(f, 'utf8')).join('\n');
const forbidden = {
  adsterra: (allDist.match(/adsterra/gi) || []).length,
  invokeJs: (allDist.match(/invoke\.js/g) || []).length,
  googletagmanager: (allDist.match(/googletagmanager/g) || []).length,
  gscMeta: (allDist.match(/google-site-verification/g) || []).length,
  lorem: (allDist.match(/lorem ipsum/gi) || []).length,
};
// Secrets scan over source (patterns, values never printed)
const srcText = walk(src, '.ts').concat(walk(src, '.astro'), walk(src, '.tsx'), walk(src, '.json'), walk(src, '.md'))
  .map(f => readFileSync(f, 'utf8')).join('\n');
const secretHits = (srcText.match(/(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,})/g) || []).length;
// Sizes
const sizeOf = f => statSync(f).size;
const jsFiles = walk(dist, '.js');
let distBytes = 0; for (const f of [...walk(dist, '.html'), ...jsFiles, ...walk(dist, '.css'), ...walk(dist, '.svg'), ...walk(dist, '.json'), ...walk(dist, '.xml')]) distBytes += sizeOf(f);
const summary = {
  pages: htmlFiles.length, routes: routes.size,
  canonicalMissing, canonicalRelative, noindexPages,
  dupTitles: dupTitles.map(([t, v]) => ({ title: t, routes: v })),
  dupDescs: dupDescs.map(([t, v]) => ({ desc: t.slice(0, 60), routes: v })),
  jsonldBlocks: jsonldCount, jsonldErrors, h1Issues,
  internalLinkTargets: internalLinks.size, brokenLinks,
  sitemapValid, sitemapError, sitemapUrlCount: sitemapUrls.length, sitemapGaps,
  forbidden, secretHits,
  jsBundles: jsFiles.map(f => ({ file: relative(dist, f), kb: +(sizeOf(f) / 1024).toFixed(1) })).sort((a, b) => b.kb - a.kb).slice(0, 8),
  distBytesKB: +(distBytes / 1024).toFixed(0),
  largestHtml: htmlFiles.map(f => ({ route: routeOf(f), kb: +(sizeOf(f) / 1024).toFixed(1) })).sort((a, b) => b.kb - a.kb).slice(0, 5),
};
console.log(JSON.stringify(summary, null, 2));
