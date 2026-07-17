// Manual pre-deploy check: confirms every route under src/pages/ is listed in
// sitemap.xml.ts's hardcoded ROUTES array (and vice versa). Not wired into CI
// — there's no test runner in this project, and adding one just for this
// single check would be disproportionate. Run by hand: node scripts/check-sitemap-routes.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const pagesDir = join(rootDir, 'src', 'pages');
const sitemapFile = join(pagesDir, 'sitemap.xml.ts');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function fileToRoute(filePath) {
  const rel = relative(pagesDir, filePath).split(sep).join('/');
  const withoutExt = rel.replace(/\.astro$/, '');
  const path = withoutExt === 'index' ? '/' : `/${withoutExt.replace(/\/index$/, '')}`;
  return path;
}

const pageRoutes = walk(pagesDir)
  .filter((f) => f.endsWith('.astro'))
  .filter((f) => !f.endsWith('404.astro'))
  .filter((f) => !f.includes('[') && !relative(pagesDir, f).split(sep).some((seg) => seg.startsWith('_')))
  .map(fileToRoute)
  .sort();

const sitemapSource = readFileSync(sitemapFile, 'utf-8');
const routesMatch = sitemapSource.match(/const ROUTES = \[([\s\S]*?)\];/);
if (!routesMatch) {
  console.error('Could not find a ROUTES array in sitemap.xml.ts — check the file wasn\'t restructured.');
  process.exit(1);
}
const sitemapRoutes = [...routesMatch[1].matchAll(/['"](.+?)['"]/g)].map((m) => m[1]).sort();

const missingFromSitemap = pageRoutes.filter((r) => !sitemapRoutes.includes(r));
const staleInSitemap = sitemapRoutes.filter((r) => !pageRoutes.includes(r));

if (missingFromSitemap.length || staleInSitemap.length) {
  if (missingFromSitemap.length) {
    console.error('Pages that exist but are missing from sitemap.xml.ts ROUTES:');
    missingFromSitemap.forEach((r) => console.error(`  ${r}`));
  }
  if (staleInSitemap.length) {
    console.error('Routes listed in sitemap.xml.ts that no longer have a matching page:');
    staleInSitemap.forEach((r) => console.error(`  ${r}`));
  }
  process.exit(1);
}

console.log(`OK — sitemap.xml.ts ROUTES matches all ${pageRoutes.length} pages under src/pages/.`);
