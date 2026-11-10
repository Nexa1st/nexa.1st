import type { APIRoute } from 'astro';
import { getPublishedPosts, getPublishedProducts, entrySlug } from '../lib/content';
import tools from '../data/tools.json';

export const prerender = true;
/** Static search index generated at build from content collections + tools data.
 *  Consumed by GlobalSearch and the Command Palette. */
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const products = await getPublishedProducts();
  const items = [
    ...posts.map((p) => ({ title: p.data.title, description: p.data.description, url: `/blog/${entrySlug(p)}/`, type: 'Article', category: p.data.category, tags: p.data.tags, keywords: `${p.data.category} ${p.data.tags.join(' ')}` })),
    ...tools.map((t) => ({ title: t.name, description: t.description, url: `/tools/${t.slug}/`, type: 'Tool', category: t.category, tags: [t.pricingLabel], keywords: `${t.by} ${t.bestFor}` })),
    ...products.map((p) => ({ title: p.data.title, description: p.data.description, url: `/products/${entrySlug(p)}/`, type: 'Product', category: p.data.category, tags: [], keywords: 'review product editorial' })),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
