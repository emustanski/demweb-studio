import { SITE } from './site';

export function professionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    email: SITE.email,
    areaServed: 'Worldwide',
    priceRange: '€€',
    knowsLanguage: ['en'],
  };
}

export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function articleSchema(post: { title: string; description: string; date: Date; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date.toISOString(),
    author: { '@type': 'Organization', name: SITE.name },
    url: new URL(`/blog/${post.slug}`, SITE.url).toString(),
  };
}
