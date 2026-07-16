import type { APIRoute } from 'astro';

// Hand-written rather than @astrojs/sitemap (not on the approved package
// list — see CLAUDE.md Section 1). Phase 1 has a small, fixed set of static
// routes, so a generated endpoint is simple and needs no extra dependency.
// Locale routes (/de, /bg) are intentionally excluded until real content
// ships for those locales (CLAUDE.md Section 2).

const ROUTES = [
  '/',
  '/services',
  '/portfolio',
  '/about',
  '/process',
  '/faq',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
];

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://demweb-studio.pages.dev');

  const urls = ROUTES.map((path) => {
    const loc = new URL(path, baseUrl).toString();
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
