// Build-time data folder check (see src/lib/paths.ts for the reason). Production refuses a relative DATA_DIR,
// because a Hostinger build wipes the app folder and with it the database.
import { isAbsolute, resolve } from 'node:path';

export function resolveDataDir(env, mode) {
  const dir = env.DATA_DIR;
  if (mode === 'production' && env.ALLOW_LOCAL_DATA !== '1') {
    if (!dir || !isAbsolute(dir)) throw new Error('DATA_DIR must be an absolute path outside the app folder in production (or set ALLOW_LOCAL_DATA=1 for a local preview)');
    return dir;
  }
  return resolve(dir || '.data');
}
