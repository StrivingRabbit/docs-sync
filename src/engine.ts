import chokidar from 'chokidar';
import { prepareRepo } from './git';
import { compileMapping } from './compiler';
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
  for (const [key, src] of Object.entries(config.sources)) {
    prepareRepo(key, src.repo, src.branch, config.cacheDir, fs);
  }

  logger.info(`Compiling ${config.mappings.length} mapping(s)...`);

  // 编译失败不应该中断整个流程
  let successCount = 0;
  for (const m of config.mappings) {
    try {
      compileMapping(m, config.cacheDir, config.site, graph, fs);
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

  return graph;
}

export async function watch(config: DocsSyncConfig) {
  const graph = await syncAll(config);
  const fs = config.dryRun ? dryRunFs : realFs;

  chokidar
    .watch(`${config.cacheDir}/**/*.md`)
    .on('change', file => {
      const sourceId = file
        .replace(config.cacheDir + '/', '')
        .replace(/\\/g, '/');

      logger.info(`File changed: ${sourceId}`);

      const affected = graph.affected(sourceId);

      if (affected.size > 0) {
        logger.info(`Recompiling ${affected.size} affected mapping(s)...`);
      }

      // Watch 模式下，单个文件编译失败不应该中断监视
      for (const m of config.mappings) {
        if (affected.has(m.from)) {
          try {
            compileMapping(m, config.cacheDir, config.site, graph, fs);
          } catch (error) {
            // 错误已记录，继续监视其他文件
            logger.debug(`Skipping failed mapping: ${m.from}`);
          }
        }
      }
    });
}
