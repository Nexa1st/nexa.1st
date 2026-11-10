import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['AI & Machine Learning', 'Technology', 'Gaming', 'Online Business', 'Digital Marketing', 'Creator Guides']),
    tags: z.array(z.string()).default([]),
    author: z.string().default('irfan-ullah'),
    featured: z.boolean().default(false),
    trending: z.boolean().default(false),
    // Editorial popularity score set by editors in frontmatter — NOT real analytics.
    popularity: z.number().default(0),
    draft: z.boolean().default(false),
    gradient: z.string().default('linear-gradient(135deg,#3b82f6,#8b5cf6)'),
    emoji: z.string().default('✦'),
    // Optional uploaded image (via CMS to /images/uploads). Gradient is the fallback.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // --- SEO administration (metadata only — never rendered as visible copy) ---
    focusKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).default([]),
    longTailKeywords: z.array(z.string()).default([]),
    searchIntent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).default('informational'),
    targetCountry: z.string().default('US'),
    cluster: z.enum(['Artificial Intelligence', 'AI Tools & Tutorials', 'Technology', 'Gaming', 'Digital Marketing', 'Online Business', 'Product Reviews']).optional(),
    pillar: z.boolean().default(false),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    canonicalUrl: z.string().url().optional(),
    ogImage: z.string().optional(),
  }),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    pubDate: z.coerce.date(),
    category: z.string(),
    // ONLY shown when an editor manually enters it. Never invented.
    price: z.string().optional(),
    // Manually-entered affiliate URL. When absent, the button links to officialUrl.
    affiliateUrl: z.string().url().optional(),
    officialUrl: z.string().url(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    specs: z.array(z.object({ k: z.string(), v: z.string() })).default([]),
    // Optional EDITORIAL rating (editors' opinion, always labelled as such).
    editorialRating: z.number().min(0).max(5).optional(),
    draft: z.boolean().default(false),
    gradient: z.string().default('linear-gradient(135deg,#f59e0b,#ef4444)'),
    emoji: z.string().default('🛠'),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    focusKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).default([]),
    longTailKeywords: z.array(z.string()).default([]),
    searchIntent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).default('informational'),
    targetCountry: z.string().default('US'),
    canonicalUrl: z.string().url().optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog, products };
