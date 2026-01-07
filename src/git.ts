import { execSync } from 'child_process';
import path from 'path';
import { FsOps } from './fs/types';
import { logger } from './logger';

export function prepareRepo(
  key: string,
  repo: string,
  branch: string,
  cacheDir: string,
  fs: FsOps
) {
  const dir = path.join(cacheDir, key);

  try {
    if (!fs.exists(dir)) {
      logger.info(`Cloning ${key} from ${repo}...`);
      execSync(`git clone -b ${branch} ${repo} ${dir}`, { stdio: 'inherit' });
      logger.success(`Cloned ${key}`);
    } else {
      logger.info(`Updating ${key}...`);
      execSync(`git -C ${dir} pull`, { stdio: 'inherit' });
      logger.success(`Updated ${key}`);
    }
  } catch (error) {
    logger.error(`Failed to prepare repo ${key}: ${error}`);
    throw new Error(`Failed to prepare repo ${key}: ${error}`);
  }

  return dir;
}
