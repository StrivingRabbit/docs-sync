import { execSync } from 'child_process';
import path from 'path';
import { FsOps } from './fs/types';
import { logger } from './logger';

export function prepareRepo(
  key: string,
  repo: string,
  branch: string | undefined,
  cacheDir: string,
  fs: FsOps
) {
  // 检查是否是本地路径（绝对路径或相对路径）
  const isLocalPath = repo.startsWith('/') || repo.startsWith('./') || repo.startsWith('../');

  if (isLocalPath) {
    // 本地路径，直接返回
    const absolutePath = path.isAbsolute(repo) ? repo : path.resolve(process.cwd(), repo);

    if (!fs.exists(absolutePath)) {
      logger.error(`Local path does not exist: ${absolutePath}`);
      throw new Error(`Local path does not exist: ${absolutePath}`);
    }

    logger.info(`Using local source: ${key} -> ${absolutePath}`);
    return absolutePath;
  }

  // Git 仓库，使用现有逻辑
  if (!branch) {
    logger.error(`Branch is required for Git repository: ${key}`);
    throw new Error(`Branch is required for Git repository: ${key}`);
  }

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
