// Site-wide constants. Cloudflare Email Routing is confirmed live (verified
// via the Gmail SMTP "send as" confirmation round-trip actually reaching this
// inbox), so the professional address is the real one now — see CLAUDE.md
// Section 1 & 3. RESEND_TO_EMAIL (the Cloudflare Pages env var used by the
// contact Pages Function) should be kept in sync with this by hand in the
// Cloudflare dashboard.

export const SITE = {
  name: 'DEMWeb Studio',
  tagline: 'Fast, SEO-first websites for small businesses and freelancers',
  description:
    'DEMWeb Studio designs and builds fast, SEO-first websites for small businesses and freelancers — custom builds, redesigns, performance optimization, and SEO audits.',
  url: 'https://demwebstudio.com',
  email: 'hello@demwebstudio.com',
} as const;

export const PUBLIC_CONTACT_EMAIL = SITE.email;

export const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
] as const;

export const FOOTER_STUDIO_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const FOOTER_RESOURCES_LINKS = [
  { label: 'How We Work', href: '/process' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Free Website Check', href: '/free-website-check' },
] as const;

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
] as const;
