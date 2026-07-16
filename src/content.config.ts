import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Content lives under src/content/<locale>/<collection>/*.md — see CLAUDE.md
// Section 2. Only src/content/en/ has real entries at launch; the loader
// pattern below already spans de/ and bg/ so no config change is needed once
// those locales get real content, only new files.

const services = defineCollection({
  loader: glob({ pattern: '*/services/*.md', base: './src/content' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string(),
    priceFrom: z.number(),
    priceLabel: z.string(),
    popular: z.boolean().default(false),
    summary: z.string(),
    whatsIncluded: z.array(z.string()),
    order: z.number(),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '*/portfolio/*.md', base: './src/content' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    problem: z.string(),
    approach: z.string(),
    result: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '*/blog/*.md', base: './src/content' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.date(),
    description: z.string(),
    tags: z.array(z.string()),
    locale: z.enum(['en', 'de', 'bg']),
    relatedService: reference('services').optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*/testimonials/*.md', base: './src/content' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    company: z.string(),
    quote: z.string(),
    avatar: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
  }),
});

export const collections = { services, portfolio, blog, testimonials };
