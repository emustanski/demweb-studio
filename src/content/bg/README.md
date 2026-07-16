# Bulgarian locale content — not live yet

Structural placeholder only (CLAUDE.md Section 2/3). Do not add real entries,
routes, sitemap entries, or `hreflang` tags for `/bg/` until Bulgarian content
actually ships (Phase 3).

When ready, mirror `src/content/en/`: `services/`, `portfolio/`, `blog/`,
`testimonials/` subfolders. The collection loaders in `src/content.config.ts`
already glob across all locale folders, so adding files here is enough — no
config changes needed.
