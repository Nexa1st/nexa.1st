// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// NOTE: `site` is a PLACEHOLDER for the PROPOSED free Cloudflare Pages project
// `nexa1st` (nexa1st.pages.dev) — Pages project names cannot contain a dot, and
// the existing `nexa-1st` project (NEXA Link, nexa-1st.pages.dev) must NOT be
// reused or overwritten. Nothing has been deployed. To be confirmed by the
// user at deploy time; update this value if a different project is chosen.
export default defineConfig({
  site: 'https://nexa1st.pages.dev',
  output: 'static',
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/irfan-admin') })],
  vite: { plugins: [tailwindcss()] },
  prefetch: { prefetchAll: true },
});
