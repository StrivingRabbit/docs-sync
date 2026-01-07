// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
}

export type Logger = {
  info(msg: string): void
  success(msg: string): void
  warn(msg: string): void
  error(msg: string): void
  debug(msg: string): void
}

export function createLogger(): Logger {
  const timestamp = () => {
    const now = new Date()
    return `${colors.gray}[${now.toLocaleTimeString()}]${colors.reset}`
  }

  return {
    info(msg) {
      console.log(`${timestamp()} ${colors.blue}ℹ${colors.reset} ${msg}`)
    },

    success(msg) {
      console.log(`${timestamp()} ${colors.green}✓${colors.reset} ${msg}`)
    },

    warn(msg) {
      console.log(`${timestamp()} ${colors.yellow}⚠${colors.reset} ${msg}`)
    },

    error(msg) {
      console.error(`${timestamp()} ${colors.red}✖${colors.reset} ${msg}`)
    },

    debug(msg) {
      if (process.env.DEBUG) {
        console.log(`${timestamp()} ${colors.gray}[DEBUG]${colors.reset} ${colors.dim}${msg}${colors.reset}`)
      }
    }
  }
}

// 创建全局 logger 实例
export const logger = createLogger()
