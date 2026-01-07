import fs from 'fs'
import { FsOps } from './types'
import { logger } from '../logger'

export const dryRunFs: FsOps = {
  ensureDir(dir) {
    logger.warn(`[DRY-RUN] Would create directory: ${dir}`)
  },

  writeFileSync(file, content) {
    logger.warn(`[DRY-RUN] Would write file: ${file}`)
    logger.debug(`[DRY-RUN] Content length: ${content.length} characters`)
  },

  readFileSync(file) {
    return fs.readFileSync(file, 'utf-8')
  },

  exists(p) {
    return fs.existsSync(p)
  },

  stat(p) {
    return fs.statSync(p)
  }
}
