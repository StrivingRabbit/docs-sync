import path from 'path';
import { FsOps } from './fs/types';
import { logger } from './logger';

const INCLUDE_RE = /<!--\s*@include\s+([^>]+)\s*-->/g;

export function resolveIncludes(
  content: string,
  sourcePaths: Record<string, string>,
  site: string,
  deps: Set<string>,
  fs: FsOps,
  includeStack: Set<string> = new Set()
) {
  return content.replace(INCLUDE_RE, (_, ref) => {
    const [sourceKey, relPath] = ref.trim().split(':');
    const includeRef = `${sourceKey}:${relPath}`;
    const sourceBaseDir = sourcePaths[sourceKey];

    if (!sourceBaseDir) {
      logger.error(`Source '${sourceKey}' not found for include: ${ref}`);
      return `<!-- ERROR: Source '${sourceKey}' not found -->`;
    }

    const file = path.join(sourceBaseDir, relPath);

    if (!fs.exists(file)) {
      logger.error(`Include file not found: ${ref} (${file})`);
      // 返回注释占位符，而不是抛出错误，让编译可以继续
      return `<!-- ERROR: Include file not found: ${ref} -->`;
    }

    // 检测循环引用：只检查当前调用栈，而不是所有依赖
    if (includeStack.has(includeRef)) {
      logger.error(`Circular include detected: ${ref}`);
      return `<!-- ERROR: Circular include detected: ${ref} -->`;
    }

    logger.debug(`Including: ${ref}`);
    deps.add(includeRef);

    try {
      let included = fs.readFileSync(file);
      included = included.replace(/^---[\s\S]*?---/, '');

      // 递归处理被包含文件中的 @include 指令
      // 将当前文件加入调用栈
      const newStack = new Set(includeStack);
      newStack.add(includeRef);
      included = resolveIncludes(included, sourcePaths, site, deps, fs, newStack);

      return included.trim();
    } catch (error) {
      logger.error(`Failed to read include file ${ref}: ${error}`);
      return `<!-- ERROR: Failed to read include file: ${ref} -->`;
    }
  });
}
