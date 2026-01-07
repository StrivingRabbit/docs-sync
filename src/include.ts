import path from 'path';
import { FsOps } from './fs/types';
import { logger } from './logger';

const INCLUDE_RE = /<!--\s*@include\s+([^>]+)\s*-->/g;

export function resolveIncludes(
  content: string,
  cacheDir: string,
  site: string,
  deps: Set<string>,
  fs: FsOps
) {
  return content.replace(INCLUDE_RE, (_, ref) => {
    const [sourceKey, relPath] = ref.trim().split(':');
    const file = path.join(cacheDir, sourceKey, relPath);

    if (!fs.exists(file)) {
      logger.error(`Include file not found: ${ref} (${file})`);
      // 返回注释占位符，而不是抛出错误，让编译可以继续
      return `<!-- ERROR: Include file not found: ${ref} -->`;
    }

    logger.debug(`Including: ${ref}`);
    deps.add(`${sourceKey}:${relPath}`);

    try {
      let included = fs.readFileSync(file);
      included = included.replace(/^---[\s\S]*?---/, '');
      return included.trim();
    } catch (error) {
      logger.error(`Failed to read include file ${ref}: ${error}`);
      return `<!-- ERROR: Failed to read include file: ${ref} -->`;
    }
  });
}
