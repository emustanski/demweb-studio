// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// TODO: swap to `https://demwebstudio.com` once the domain is live (see CLAUDE.md Section 1 & 3)
const SITE_URL = 'https://demweb-studio.pages.dev';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'bg'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
