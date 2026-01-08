# docs-sync

一个文档同步工具，用于从多个 Git 仓库或本地目录拉取内容并编译到本地项目中。

## 特性

- 🔄 **多源同步**: 从多个 Git 仓库拉取文档
- 📁 **本地源支持**: 直接使用本地目录作为文档源（无需拷贝，实时反映变化）
- 📝 **包含系统**: 使用 `@include` 指令引用和包含已同步源的内容
- 🎯 **站点过滤**: 根据站点配置有条件地包含/排除内容
- 📊 **依赖追踪**: 使用依赖图进行增量编译
- 👀 **监视模式**: 当源文件更改时自动重新编译（支持本地源监视）
- 🔍 **预演模式**: 预览更改而不写入文件
- ⚙️ **灵活配置**: 支持自定义配置文件路径

## 安装

```bash
npm install
npm run build
```

## 配置

在项目根目录创建配置文件，支持 TypeScript 或 JavaScript 格式：

### TypeScript 配置 (推荐)

创建 `docs-sync.config.ts`：

```typescript
import { defineConfig } from 'docs-sync-cli';

export default defineConfig({
  site: 'site-a',
  cacheDir: '.docs-sync-cache',

  sources: {
    // Git 仓库源（必须指定 branch）
    common: {
      repo: 'git@github.com:your-org/docs-common.git',
      branch: 'main',
    },

    // 本地目录源（支持绝对路径和相对路径，branch 可选）
    local: {
      repo: './source',  // 相对路径，相对于 cwd
    },

    // 本地绝对路径源
    other: {
      repo: '/Users/username/my-docs',
    },
  },

  mappings: [
    // 从 Git 仓库同步
    {
      from: 'common:guides/install.md',
      to: 'docs/guide/install.md',
    },

    // 从本地目录同步
    {
      from: 'local:README.md',
      to: 'docs/README.md',
    },
  ],
});
```

### JavaScript 配置

创建 `docs-sync.config.js`：

```javascript
const { defineConfig } = require('docs-sync-cli');

module.exports = defineConfig({
  site: 'site-a',
  cacheDir: '.docs-sync-cache',

  sources: {
    common: {
      repo: 'git@github.com:your-org/docs-common.git',
      branch: 'main',
    },
  },

  mappings: [
    {
      from: 'common:guides/install.md',
      to: 'docs/guide/install.md',
    },
  ],
});
```

> **注意**: CLI 会自动查找配置文件，优先级为 `docs-sync.config.ts` > `docs-sync.config.js`

### 配置说明

#### sources

每个源可以是:

- **Git 仓库**:
  - 提供 Git URL (如 `git@github.com:...` 或 `https://github.com/...`)
  - **必须**指定 `branch` 字段

- **本地目录**:
  - 提供本地路径 (绝对路径如 `/path/to/docs` 或相对路径如 `./source`)
  - `branch` 字段**可选**，会被忽略

**本地源的优势:**
- ✅ 无需拷贝,直接使用绝对路径读取
- ✅ 节省磁盘空间
- ✅ 实时反映文件变化
- ✅ 更适合开发调试场景
- ✅ 不需要配置 `branch` 字段

#### mappings

定义从源到目标的文件映射关系:
- `from`: 格式为 `source-key:path/to/file.md`
- `to`: 相对于当前工作目录的目标路径

## 使用

### 基础命令

```bash
# 同步一次
docs-sync sync

# 监视模式（自动重新编译变更的文件）
docs-sync watch
```

### 命令行选项

```bash
# 使用自定义配置文件
docs-sync sync --config path/to/config.ts
docs-sync sync -c custom.config.ts

# 预演模式（预览更改，不写入文件）
docs-sync sync --dry-run

# 调试模式（显示详细日志）
docs-sync sync --debug

# 组合使用
docs-sync sync -c custom.config.ts --dry-run --debug
```

**可用选项:**
- `-c, --config <path>`: 指定配置文件路径（默认: `docs-sync.config.ts` 从当前目录）
- `--dry-run`: 预演模式，只显示将要做的更改，不实际写入文件
- `--debug`: 启用调试日志，显示详细信息（如内容哈希、依赖关系等）

### 在 package.json 中使用

```json
{
  "scripts": {
    "sync": "docs-sync sync",
    "sync:dry": "docs-sync sync --dry-run",
    "sync:debug": "docs-sync sync --debug",
    "watch": "docs-sync watch"
  }
}
```

然后运行:

```bash
npm run sync
npm run sync:dry
npm run watch
```

## 指令

### @include

从已同步的源包含内容：

```markdown
<!-- @include common:snippets/warning.md -->
```

**嵌套支持:**

`@include` 指令支持递归嵌套。被包含的文件中也可以包含 `@include` 指令,系统会自动递归处理。

**示例:**

`common:snippets/warning.md`:
```markdown
> **⚠️ 警告**: 请仔细阅读以下内容
<!-- @include common:snippets/note.md -->
```

`common:snippets/note.md`:
```markdown
**注意**: 这是一个重要提示
```

**结果:**
```markdown
> **⚠️ 警告**: 请仔细阅读以下内容
**注意**: 这是一个重要提示
```

**多次引用 vs 循环引用:**

- ✅ **多次引用**(合法): 同一个文件可以在不同的位置被多次包含
  ```markdown
  <!-- @include common:note.md -->
  Some content
  <!-- @include common:note.md -->  <!-- 合法,允许重复引用 -->
  ```

- ❌ **循环引用**(非法): 形成 A→B→A 的引用链
  ```markdown
  // a.md: <!-- @include common:b.md -->
  // b.md: <!-- @include common:a.md -->  <!-- 非法,形成循环 -->
  ```

系统使用**调用栈**检测循环引用,只在当前包含链中检查重复。如果检测到循环引用,会在生成的文档中插入错误提示:
```markdown
<!-- ERROR: Circular include detected: common:circular.md -->
```

### @site

根据站点有条件地包含内容：

```markdown
<!-- @site site-a -->
此内容仅出现在 site-a
<!-- @endsite -->

<!-- @site site-b, site-c -->
此内容仅出现在 site-b 和 site-c
<!-- @endsite -->

<!-- @site !site-a -->
此内容出现在除 site-a 外的所有站点
<!-- @endsite -->
```

## 项目结构

```
docs-sync/
├── package.json
├── tsconfig.json
├── bin/
│   └── docs-sync.ts        # CLI 入口
├── src/
│   ├── config.ts           # 配置加载器
│   ├── git.ts              # Git 操作（clone/pull）
│   ├── compiler.ts         # 文件编译
│   ├── include.ts          # @include 指令
│   ├── site-filter.ts      # @site 指令
│   ├── hash.ts             # 内容哈希
│   ├── graph.ts            # 依赖图
│   ├── engine.ts           # sync/watch 命令
│   ├── logger.ts           # 日志系统（带颜色和时间戳）
│   └── fs/
│       ├── types.ts        # 文件系统接口
│       ├── realFs.ts       # 真实文件系统操作
│       └── dryRunFs.ts     # 预演文件系统（仅日志）
└── docs-sync.config.ts     # 用户配置
```

## 工作原理

### 同步流程

1. **准备源**:
   - **Git 源**: Clone/Pull 到缓存目录 (`.docs-sync-cache/source-key/`)
   - **本地源**: 解析为绝对路径,直接使用（无需拷贝）

2. **编译映射**: 对于每个映射：
   - 从源路径读取文件
   - 处理 `@include` 指令（递归包含其他文件）
   - 根据 `@site` 标签过滤内容
   - 生成内容哈希用于变更检测
   - 写入目标位置

3. **监视模式**:
   - 监视所有源的路径（包括本地源）
   - 检测文件变更
   - 使用依赖图找出受影响的映射
   - 只重新编译受影响的文件

### 架构设计

```
┌─────────────────────────────────────────────┐
│           docs-sync CLI                     │
│  (支持 CommonJS, 无 top-level await)         │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐                 ┌────▼────┐
│ Git 源 │                 │ 本地源   │
│ (拉取) │                 │ (直接)   │
└───┬────┘                 └────┬────┘
    │                           │
    └─────────────┬─────────────┘
                  │
            ┌─────▼──────┐
            │ sourcePaths│ (映射表)
            └─────┬──────┘
                  │
         ┌────────┴────────┐
         │   编译器         │
         │ - resolveIncludes│
         │ - filterBySite   │
         │ - hashContent    │
         └────────┬─────────┘
                  │
            ┌─────▼──────┐
            │  目标文件   │
            └────────────┘
```

**关键改进:**
- 本地源使用绝对路径,性能更好,实时反映变化
- 统一的 `sourcePaths` 映射表,简化路径解析
- Watch 模式支持监视本地目录变更

## 使用场景

### 场景 1: 多站点文档共享

你有一个共享的文档仓库,多个站点需要使用其中的内容:

```typescript
export default defineConfig({
  site: 'site-a',
  sources: {
    common: {
      repo: 'git@github.com:company/docs-common.git',
      branch: 'main',
    },
  },
  mappings: [
    // 共享的安装指南
    { from: 'common:guides/install.md', to: 'docs/guides/install.md' },
    // 但每个站点有自己的配置说明
    { from: 'common:guides/config-site-a.md', to: 'docs/guides/config.md' },
  ],
});
```

### 场景 2: 本地开发 + 远程共享

开发时使用本地源,生产环境使用 Git 源:

```typescript
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  site: 'site-a',
  sources: {
    common: isDev
      ? { repo: './local-docs', branch: 'main' }  // 开发时用本地
      : { repo: 'git@github.com:company/docs.git', branch: 'main' },  // 生产用 Git
  },
  mappings: [
    { from: 'common:README.md', to: 'docs/README.md' },
  ],
});
```

### 场景 3: 复杂的包含和过滤

使用 `@include` 和 `@site` 创建灵活的文档:

**源文件** (`common:snippets/warning.md`):
```markdown
> **⚠️ 警告**: 请仔细阅读以下内容
```

**源文件** (`common:guides/install.md`):
```markdown
# 安装指南

<!-- @include common:snippets/warning.md -->

## 通用步骤

1. 下载安装包
2. 运行安装程序

<!-- @site site-a -->
## Site A 特定配置

Site A 需要额外配置数据库连接。
<!-- @endsite -->

<!-- @site site-b -->
## Site B 特定配置

Site B 使用云端配置,无需本地设置。
<!-- @endsite -->
```

**编译后的文档** (site-a):
```markdown
# 安装指南

> **⚠️ 警告**: 请仔细阅读以下内容

## 通用步骤

1. 下载安装包
2. 运行安装程序

## Site A 特定配置

Site A 需要额外配置数据库连接。
```

## 常见问题

### Q: 本地源和 Git 源有什么区别?

**本地源:**
- 直接读取本地文件,无需拷贝
- 实时反映文件变化
- 适合开发调试
- 性能更好

**Git 源:**
- 自动 clone/pull 到缓存目录
- 适合生产环境
- 可以指定分支
- 支持远程协作

### Q: 如何调试同步问题?

使用 `--debug` 标志查看详细日志:

```bash
docs-sync sync --debug
```

这会显示:
- 文件读取路径
- 内容哈希值
- 依赖关系
- Include 处理过程

### Q: Watch 模式会监视什么?

- **Git 源**: 监视 `.docs-sync-cache/source-key/` 目录
- **本地源**: 监视本地源的绝对路径

当任何 `.md` 文件变化时,会自动重新编译受影响的映射。

### Q: 支持哪些模块系统?

当前版本使用 **CommonJS**:
- 编译目标: `target: ES2020`, `module: commonjs`
- 使用 `ts-node/register` 加载 TypeScript 配置文件
- 兼容 Node.js 14+

## 许可证

MIT
