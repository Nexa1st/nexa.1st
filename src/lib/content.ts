import { getCollection, type CollectionEntry } from 'astro:content';
import authors from '../data/authors.json';

export type Post = CollectionEntry<'blog'>;
export type Product = CollectionEntry<'products'>;

const now = () => new Date();

/** Published posts only: drafts excluded AND future-dated posts excluded.
 *  Future pubDate = build-level scheduling (post appears on the next build after its date). */
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('blog');
  return all
    .filter((p) => !p.data.draft && p.data.pubDate <= now())
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
export async function getPublishedProducts(): Promise<Product[]> {
  const all = await getCollection('products');
  return all.filter((p) => !p.data.draft && p.data.pubDate <= now())
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
export function readingTime(body: string): number {
  const words = (body || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
export function authorById(id: string) {
  return authors.find((a) => a.id === id) ?? authors[0];
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
export function relatedPosts(post: Post, all: Post[], n = 3): Post[] {
  return all.filter((p) => p.id !== post.id)
    .map((p) => ({ p, s: (p.data.category === post.data.category ? 2 : 0) + p.data.tags.filter((t) => post.data.tags.includes(t)).length }))
    .sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.p);
}
export const entrySlug = (e: any): string => (e.slug ?? String(e.id).replace(/\.(md|mdx)$/, ''));
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---- Topical authority: 7 clusters mapped to existing categories ---- */
export const CATEGORY_CLUSTER: Record<string, string> = {
  'AI & Machine Learning': 'Artificial Intelligence',
  'Creator Guides': 'AI Tools & Tutorials',
  'Technology': 'Technology',
  'Gaming': 'Gaming',
  'Digital Marketing': 'Digital Marketing',
  'Online Business': 'Online Business',
};
export const CLUSTERS = ['Artificial Intelligence', 'AI Tools & Tutorials', 'Technology', 'Gaming', 'Digital Marketing', 'Online Business', 'Product Reviews'] as const;
export const CLUSTER_INTROS: Record<string, string> = {
  'Artificial Intelligence': 'How modern AI actually works — explained in plain English for creators. These guides cover the models, the limits and the directing skills that turn unpredictable generations into publishable stories.',
  'AI Tools & Tutorials': 'Hands-on tutorials and the free tool stacks behind a real short-form production workflow. Every tutorial comes from a workflow that is actually in use, with honest notes on what free tiers can and cannot do.',
  'Technology': 'Technology without the hype: local AI, realistic hardware expectations and the software decisions that quietly decide what a small creator can build. If a claim cannot be tested, it is labelled as opinion.',
  'Gaming': 'Gaming as both craft and business — turning gameplay into cinematic series people follow, and understanding where gaming creator income really comes from. Locked characters, honest numbers, no shortcuts.',
  'Digital Marketing': 'Discovery is a system, not luck. Titles, captions, hashtags and measurement habits that help the right viewers find your work — tested patterns only, never guaranteed results.',
  'Online Business': 'The honest road from content hobby to small online business: audience first, trust second, a small real offer third. No income screenshots, no overnight promises — just the sequence that holds up.',
  'Product Reviews': 'Editorial product reviews from a working creator stack: pros, cons, specs and verdicts, with full affiliate disclosure. Prices are never invented, and every rating is labelled as our editors’ opinion.',
};
export function clusterOf(post: Post): string { return post.data.cluster ?? CATEGORY_CLUSTER[post.data.category] ?? post.data.category; }
export function clusterHubUrl(post: Post): string {
  return clusterOf(post) === 'Product Reviews' ? '/products/' : `/blog/category/${slugify(post.data.category)}/`;
}
