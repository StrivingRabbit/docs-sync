#!/usr/bin/env node
import path from 'path';
import { pathToFileURL } from 'url';
import { syncAll, watch } from '../src/engine';
import { logger } from '../src/logger';

async function loadConfig() {
  const configPath = path.resolve('docs-sync.config.ts');

  try {
    const mod = await import(pathToFileURL(configPath).href);
    return mod.default;
  } catch (error) {
    logger.error(`Failed to load config from ${configPath}`);
    throw error;
  }
}

const args = process.argv.slice(2);
const cmd = args[0];
const flags = args.slice(1);

if (!cmd) {
  logger.error('No command specified. Use "sync" or "watch"');
  process.exit(1);
}

const config = await loadConfig();

// Check for --dry-run flag
if (flags.includes('--dry-run')) {
  config.dryRun = true;
  logger.warn('Running in DRY-RUN mode (no files will be written)');
}

// Check for --debug flag
if (flags.includes('--debug')) {
  process.env.DEBUG = 'true';
}

logger.info(`Site: ${config.site}`);
logger.info(`Cache directory: ${config.cacheDir}`);

if (cmd === 'sync') {
  await syncAll(config);
  logger.success(config.dryRun ? 'Dry-run completed' : 'Docs synced successfully');
}

if (cmd === 'watch') {
  await watch(config);
  logger.info('Watching for changes...');
}
