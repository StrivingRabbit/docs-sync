import fs from 'fs'

export type FsOps = {
  ensureDir(dir: string): void
  writeFileSync(file: string, content: string): void
  readFileSync(file: string): string
  exists(path: string): boolean
  stat(path: string): fs.Stats
}
