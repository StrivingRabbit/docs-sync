import fs from 'fs'
import { FsOps } from './types'

export const realFs: FsOps = {
  ensureDir(dir) {
    if (fs.existsSync(dir)) {
      if (!fs.statSync(dir).isDirectory()) {
        throw new Error(`[docs-sync] Not a directory: ${dir}`)
      }
      return
    }
    fs.mkdirSync(dir, { recursive: true })
  },

  writeFileSync(file, content) {
    fs.writeFileSync(file, content, 'utf-8')
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
