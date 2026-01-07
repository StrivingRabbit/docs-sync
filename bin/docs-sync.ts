#!/usr/bin/env node
import path from 'path';
import { syncAll, watch } from '../src/engine';
import { logger } from '../src/logger';
import { existsSync } from 'fs';

async function loadConfig(customPath?: string) {
  let configPath: string;

  if (customPath) {
    // Use custom path if provided
    configPath = path.resolve(customPath);
    if (!existsSync(configPath)) {
      logger.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
  } else {
    // Look for default config files in order: .ts, .js
    const cwd = process.cwd();
    const possiblePaths = [
      path.resolve(cwd, 'docs-sync.config.ts'),
      path.resolve(cwd, 'docs-sync.config.js'),
    ];

    const foundPath = possiblePaths.find((p) => existsSync(p));

    if (!foundPath) {
      logger.error('Config file not found. Looking for:');
      possiblePaths.forEach((p) => logger.error(`  - ${p}`));
      logger.info('');
      logger.info('Create a config file with:');
      logger.info('  docs-sync.config.ts (TypeScript)');
      logger.info('  docs-sync.config.js (JavaScript)');
      process.exit(1);
    }

    configPath = foundPath;
  }

  try {
    // Register ts-node for TypeScript files
    if (configPath.endsWith('.ts')) {
      try {
        require('ts-node').register({
          transpileOnly: true,
          compilerOptions: {
            module: 'commonjs',
          },
        });
      } catch (error) {
        logger.error('Failed to load ts-node. TypeScript config files require ts-node.');
        logger.error('Please install: npm install -D ts-node typescript');
        logger.error('Or use a JavaScript config file: docs-sync.config.js');
        process.exit(1);
      }
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
    logger.info('  -c, --config <path>   Path to config file (default: docs-sync.config.{ts,js})');
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
