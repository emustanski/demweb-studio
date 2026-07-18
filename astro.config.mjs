// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

const SITE_URL = 'https://demwebstudio.com';

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
