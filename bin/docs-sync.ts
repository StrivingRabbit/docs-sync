#!/usr/bin/env node
import path from 'path';
import { syncAll, watch } from '../src/engine';
import { logger } from '../src/logger';
import { existsSync } from 'fs';

async function loadConfig(customPath?: string) {
  // Use custom path if provided, otherwise look for default config in cwd
  const configPath = customPath
    ? path.resolve(customPath)
    : path.resolve(process.cwd(), 'docs-sync.config.ts');

  if (!existsSync(configPath)) {
    logger.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  try {
    // Try to load .ts file using ts-node
    if (configPath.endsWith('.ts')) {
      // Register ts-node to handle TypeScript files
      require('ts-node').register({
        transpileOnly: true,
        compilerOptions: {
          module: 'commonjs',
        },
      });
    }

    // Use require for CommonJS compatibility
    const mod = require(configPath);
    return mod.default || mod;
  } catch (error) {
    logger.error(`Failed to load config from ${configPath}`);
    throw error;
  }
}

function parseArgs(args: string[]) {
  const parsed: {
    command?: string;
    config?: string;
    dryRun: boolean;
    debug: boolean;
  } = {
    dryRun: false,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--config' || arg === '-c') {
      parsed.config = args[++i];
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--debug') {
      parsed.debug = true;
    } else if (!parsed.command) {
      parsed.command = arg;
    }
  }

  return parsed;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.command) {
    logger.error('No command specified. Use "sync" or "watch"');
    logger.info('');
    logger.info('Usage:');
    logger.info('  docs-sync <command> [options]');
    logger.info('');
    logger.info('Commands:');
    logger.info('  sync      Sync documents once');
    logger.info('  watch     Watch for changes and sync automatically');
    logger.info('');
    logger.info('Options:');
    logger.info('  -c, --config <path>   Path to config file (default: docs-sync.config.ts)');
    logger.info('  --dry-run             Preview changes without writing files');
    logger.info('  --debug               Enable debug logging');
    process.exit(1);
  }

  const config = await loadConfig(options.config);

  // Apply command-line flags
  if (options.dryRun) {
    config.dryRun = true;
    logger.warn('Running in DRY-RUN mode (no files will be written)');
  }

  if (options.debug) {
    process.env.DEBUG = 'true';
  }

  logger.info(`Site: ${config.site}`);
  logger.info(`Cache directory: ${config.cacheDir}`);
  if (options.config) {
    logger.info(`Config file: ${path.resolve(options.config)}`);
  }

  if (options.command === 'sync') {
    await syncAll(config);
    logger.success(config.dryRun ? 'Dry-run completed' : 'Docs synced successfully');
  }

  if (options.command === 'watch') {
    await watch(config);
    logger.info('Watching for changes...');
  }
}

// Run main function and handle errors
main().catch((error) => {
  logger.error('Fatal error:');
  console.error(error);
  process.exit(1);
});
