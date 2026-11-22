import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import { mkdirSync } from 'node:fs';
import { resolveDataDir } from './config/paths.mjs';

const mode = process.argv.includes('dev') ? 'development' : 'production';
const dataDir = resolveDataDir(process.env, mode);
process.env.DATA_DIR = dataDir;
mkdirSync(`${dataDir}/uploads`, { recursive: true });
const siteUrl = process.env.EMDASH_SITE_URL || 'http://127.0.0.1:4460';
const { protocol, hostname } = new URL(siteUrl);

// No `trailingSlash` setting: it breaks EmDash's /_emdash/admin/setup/ (404).
export default defineConfig({
  site: siteUrl,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4460, host: '127.0.0.1' },
  build: { inlineStylesheets: 'always' },
  security: { allowedDomains: [{ hostname, protocol: protocol.replace(':', '') }] },
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: `file:${dataDir}/data.db` }),
      storage: local({ directory: `${dataDir}/uploads`, baseUrl: '/_emdash/api/media/file' }),
      admin: {
        locales: ['de', 'en'],
        siteName: 'Bongsiel',
        hiddenNavItems: ['comments', 'widgets', 'bylines', 'import', 'sections', 'menus', 'redirects'],
      },
    }),
  ],
});
