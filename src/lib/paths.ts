/**
 * Where the databases and uploads live. On Hostinger a build wipes the app folder, so production needs an
 * absolute DATA_DIR outside it (e.g. /home/<user>/site-data/bongsiel). Local dev uses ./.data.
 */
import { isAbsolute, resolve } from 'node:path';

export function resolveDataDir(env: Record<string, string | undefined>, mode: 'development' | 'production') {
  const dir = env.DATA_DIR;
  if (mode === 'production' && env.ALLOW_LOCAL_DATA !== '1') {
    if (!dir || !isAbsolute(dir))
      throw new Error('DATA_DIR must be an absolute path outside the app folder in production');
    return dir;
  }
  return resolve(dir || '.data');
}

/** At run time: the folder the config already validated at build time. */
export const dataDir = () => resolve(process.env.DATA_DIR || '.data');
