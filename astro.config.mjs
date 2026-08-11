// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import business from './src/config/business.json' with { type: 'json' };

export default defineConfig({
  // Single source of truth: swap the domain in src/config/business.json
  site: business.domain,
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      // /thank-you/ is noindex (post-form landing) — keep it out of the sitemap
      filter: (page) => !page.includes('/admin/') && !page.includes('/thank-you/')
    })
  ],
  // Static output (no SSR needed for brochure sites)
  output: 'static',
  // Prefetch links on hover
  prefetch: {
    prefetchAll: true
  }
});
