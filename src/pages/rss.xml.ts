import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getPublishedPosts, entrySlug } from '../lib/content';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  return rss({
    title: 'NEXA',
    description: 'AI stories, technology, gaming and honest online-earning guides from NEXA.',
    site: context.site ?? 'https://nexa1st.pages.dev',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${entrySlug(p)}/`,
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: '<language>en-US</language>',
  });
};
