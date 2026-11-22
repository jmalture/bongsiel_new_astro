// Load the content seed into the database in DATA_DIR (default ./.data). Existing entries are skipped.
// node tools/seed.mjs            → schema + content
// node tools/seed.mjs --rebuild  → rebuild seed/seed.json from raw/content first
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const dir = resolve(process.env.DATA_DIR || '.data');
if (process.argv.includes('--rebuild')) execSync('node tools/build-seed.mjs', { stdio: 'inherit' });
execSync(`npx emdash seed seed/seed.json -d "${dir}/data.db" --uploads-dir "${dir}/uploads"`, { stdio: 'inherit' });
