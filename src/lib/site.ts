// Site-wide constants. See CLAUDE.md Section 1 & 3 for the temporary-address
// rationale — swap PUBLIC_CONTACT_EMAIL (and the RESEND_TO_EMAIL env var used
// by the contact Pages Function) to hello@demwebstudio.com once Cloudflare
// Email Routing is live. Both should stay in sync.

export const SITE = {
  name: 'DEMWeb Studio',
  tagline: 'Fast, SEO-first websites for small businesses and freelancers',
  description:
    'DEMWeb Studio designs and builds fast, SEO-first websites for small businesses and freelancers — custom builds, redesigns, performance optimization, and SEO audits.',
  url: 'https://demwebstudio.com',
  email: 'emustanski@gmail.com',
} as const;

export const PUBLIC_CONTACT_EMAIL = SITE.email;

export const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/portfolio' },
  { label: 'About', href: '/about' },
  // Blog nav link is added in Phase 2 once real posts exist (CLAUDE.md Section 8) —
  // an empty/linkless Blog tab would be exactly the kind of thin experience the
  // brief avoids elsewhere (empty locale pages, "coming soon" testimonials).
] as const;

export const FOOTER_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'How We Work', href: '/process' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
] as const;

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
] as const;
