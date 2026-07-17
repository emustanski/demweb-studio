// Absolute date, computed at build time — the permanently-correct fallback for
// the Lighthouse freshness indicator (TrustStrip.astro) so it never silently
// goes stale between deploys. Relative phrasing ("2 days ago") is layered on
// top client-side against the visitor's own clock — see the inline script in
// TrustStrip.astro.
export function formatAbsoluteDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}
