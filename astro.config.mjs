// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/data/site.mjs';

export default defineConfig({
  site: site.url,
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { inlineStylesheets: 'always', format: 'file' },
  prefetch: false, // tiny static site: the prefetch script cost more main-thread time than it saved
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
});
