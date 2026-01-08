import chokidar from 'chokidar';
import { prepareRepo } from './git';
import { compileMapping, deleteMapping } from './compiler';
import { DepGraph } from './graph';
import { DocsSyncConfig } from './types';
import { realFs } from './fs/realFs';
import { dryRunFs } from './fs/dryRunFs';
import { logger } from './logger';

export async function syncAll(config: DocsSyncConfig) {
  const graph = new DepGraph();
  const fs = config.dryRun ? dryRunFs : realFs;
  const errors: string[] = [];

  logger.info(`Syncing ${Object.keys(config.sources).length} source(s)...`);

  // Git 操作失败是致命的，应该抛出错误
  // 保存每个 source 的实际路径（可能是 cache 路径或本地路径）
  const sourcePaths: Record<string, string> = {};
  for (const [key, src] of Object.entries(config.sources)) {
    sourcePaths[key] = prepareRepo(key, src.repo, src.branch, config.cacheDir, fs);
  }

  logger.info(`Compiling ${config.mappings.length} mapping(s)...`);

  // 编译失败不应该中断整个流程
  let successCount = 0;
  for (const m of config.mappings) {
    try {
      compileMapping(m, sourcePaths, config.site, graph, fs);
      successCount++;
    } catch (error) {
      errors.push(`${m.from}: ${error}`);
      // 错误已经在 compileMapping 中通过 logger.error 记录了
    }
  }

  // 汇总结果
  if (errors.length > 0) {
    logger.warn(`Compiled ${successCount}/${config.mappings.length} mapping(s), ${errors.length} failed`);
    if (config.dryRun || errors.length < config.mappings.length) {
      // 在 dry-run 模式或部分成功时，不抛出错误
      logger.debug(`Failed mappings: ${errors.join(', ')}`);
    } else {
      // 所有 mappings 都失败时才抛出
      throw new Error(`All mappings failed to compile`);
    }
  } else {
    logger.success(`All ${successCount} mapping(s) compiled successfully`);
  }

  // 在 debug 模式下输出依赖图
  if (process.env.DEBUG === 'true') {
    logger.info('\n=== Dependency Graph ===');
    logger.info(graph.visualize());
  }

  return graph;
}

export async function watch(config: DocsSyncConfig) {
  const graph = new DepGraph();
  const fs = config.dryRun ? dryRunFs : realFs;

  logger.info(`Syncing ${Object.keys(config.sources).length} source(s)...`);

  // 准备所有源并保存路径
  const sourcePaths: Record<string, string> = {};
  for (const [key, src] of Object.entries(config.sources)) {
    sourcePaths[key] = prepareRepo(key, src.repo, src.branch, config.cacheDir, fs);
  }

  // 初始编译
  logger.info(`Compiling ${config.mappings.length} mapping(s)...`);
  for (const m of config.mappings) {
    try {
      compileMapping(m, sourcePaths, config.site, graph, fs);
    } catch (error) {
      logger.debug(`Skipping failed mapping: ${m.from}`);
    }
  }

  // 在 debug 模式下输出初始依赖图
  if (process.env.DEBUG === 'true') {
    logger.info('\n=== Initial Dependency Graph ===');
    logger.info(graph.visualize());
  }

  // 构建要监视的路径列表
  const watchPaths = Object.values(sourcePaths).map(p => `${p}/**/*.md`);

  const handleFileChange = (file: string, eventType: 'change' | 'unlink') => {
    // 找到文件属于哪个 source
    let sourceId: string | null = null;
    for (const [key, basePath] of Object.entries(sourcePaths)) {
      if (file.startsWith(basePath)) {
        const relPath = file.substring(basePath.length + 1).replace(/\\/g, '/');
        sourceId = `${key}:${relPath}`;
        break;
      }
    }

    if (!sourceId) {
      logger.warn(`Could not determine source for ${eventType} file: ${file}`);
      return;
    }

    logger.info(`File ${eventType === 'unlink' ? 'deleted' : 'changed'}: ${sourceId}`);

    // 如果是删除事件，找到直接使用该文件的 mappings 并删除它们
    if (eventType === 'unlink') {
      for (const m of config.mappings) {
        if (m.from === sourceId) {
          try {
            deleteMapping(m, graph, fs);
          } catch (error) {
            logger.debug(`Failed to delete mapping: ${m.from}`);
          }
        }
      }
    }

    // 查找受影响的 mappings（包括通过 include 间接依赖的）
    const affected = graph.affected(sourceId);

    if (affected.size > 0) {
      logger.info(`Recompiling ${affected.size} affected mapping(s)...`);
    }

    // Watch 模式下，单个文件编译失败不应该中断监视
    for (const m of config.mappings) {
      if (affected.has(m.from)) {
        try {
          compileMapping(m, sourcePaths, config.site, graph, fs);
        } catch (error) {
          // 错误已记录，继续监视其他文件
          logger.debug(`Skipping failed mapping: ${m.from}`);
        }
      }
    }

    // 在 debug 模式下输出更新后的依赖图
    if (process.env.DEBUG === 'true') {
      logger.info('\n=== Updated Dependency Graph ===');
      logger.info(graph.visualize());
    }
  };

  chokidar
    .watch(watchPaths)
    .on('change', file => handleFileChange(file, 'change'))
    .on('unlink', file => handleFileChange(file, 'unlink'));
}
