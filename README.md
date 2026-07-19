# DEMWeb Studio

Marketing site for **DEMWeb Studio** — web design, redesigns, performance optimization, and SEO audits for small businesses and freelancers.

🔗 **Live:** [demwebstudio.com](https://demwebstudio.com)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) — static output, ships close to zero JS by default |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Hosting | Cloudflare Pages |
| Contact form | Cloudflare Pages Functions + Cloudflare Turnstile (spam protection) + [Resend](https://resend.com) (email delivery) |
| Email | Cloudflare Email Routing |
| Analytics | Cloudflare Web Analytics (cookieless) + Google Search Console |
| Content | Astro content collections (Markdown) |
| CI | GitHub Actions — Lighthouse CI runs on every deploy and writes a real, dated performance score into the site (see `scripts/write-lighthouse-score.mjs`) |

The tech stack for *client* projects is chosen per engagement based on what fits — this repo reflects what fits DEMWeb Studio's own site, not a fixed template applied to every build.

## Getting started

Requires Node ≥ 22.12.0.

```sh
npm install
cp .env.example .env   # fill in real values, see below
npm run dev
```

### Environment variables

Copy `.env.example` to `.env` for local dev. None of these are committed — see that file for which keys are required (Resend API key, Turnstile site/secret keys) versus which just need a real address (`RESEND_TO_EMAIL`, `RESEND_FROM_EMAIL`).

Cloudflare Pages Functions (`functions/api/contact.ts`) need the same variables available as `.dev.vars` for local testing:

```sh
cp .env.example .dev.vars
npx wrangler pages dev dist --port 8788
```

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start the Astro dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `node scripts/check-sitemap-routes.mjs` | Verify `src/pages/sitemap.xml.ts` covers every real route before deploying |

## Project structure

```
src/
├── pages/            # routes — one .astro file per page
├── components/        # shared UI (Nav, Footer, Button, Logo, TrustStrip, ...)
├── content/            # content collections: services, portfolio, testimonials, blog
├── layouts/           # BaseLayout — head/meta/schema, Nav + Footer wrapper
└── lib/               # site constants, schema.org helpers, date formatting

functions/
└── api/contact.ts     # Cloudflare Pages Function — Turnstile verification + Resend delivery

scripts/                # standalone Node scripts run outside the Astro build
public/                 # static assets served as-is (favicon, robots.txt, images)
```

## Deployment

Pushes to `main` deploy automatically via Cloudflare Pages. `.github/workflows/lighthouse.yml` runs Lighthouse CI against the live production URL after each deploy and commits the resulting score back into the repo — the "Built for speed" badge on the homepage reads that file, it's never fetched live in the browser.

## License

Proprietary — all rights reserved. This is the source for a commercial business's own site, not a template intended for reuse.
