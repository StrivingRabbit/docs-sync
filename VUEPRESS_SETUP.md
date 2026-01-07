# VuePress 项目设置指南

本文档说明如何将三个仓库设置为可运行的 VuePress 项目。

## 架构概述

```
docs-sync (npm 包)
    ↓ (pnpm link)
    ├── docs1 (Site A VuePress 项目)
    └── docs2 (Site B VuePress 项目)
        ↑
        └── docs-common (共享文档源)
```

## 仓库说明

### 1. docs-sync
- **类型**: npm 包 / CLI 工具
- **路径**: `/Users/lxh/MyProject/docs-sync`
- **作用**: 提供文档同步功能
- **使用**: 通过 pnpm link 链接到 docs1 和 docs2

### 2. docs-common
- **类型**: 纯文档仓库
- **路径**: `/Users/lxh/MyProject/docs-common`
- **作用**: 存储共享的文档片段和指南
- **特性**: 不需要运行，仅作为文档源

### 3. docs1 (Site A)
- **类型**: VuePress 1.9.x 项目
- **路径**: `/Users/lxh/MyProject/docs1`
- **作用**: Site A 文档站点
- **目录结构**:
  ```
  docs1/
  ├── source/              # 本地源文档
  │   ├── README.md
  │   ├── features/
  │   └── api/
  ├── docs/                # VuePress 文档目录（同步生成）
  │   ├── .vuepress/
  │   ├── guides/         # 从 common 同步
  │   ├── features/       # 从 source 同步
  │   ├── api/            # 从 source 同步
  │   └── README.md       # 从 source 同步
  ├── docs-sync.config.ts
  └── package.json
  ```

### 4. docs2 (Site B)
- **类型**: VuePress 1.9.x 项目
- **路径**: `/Users/lxh/MyProject/docs2`
- **作用**: Site B 文档站点
- **目录结构**:
  ```
  docs2/
  ├── source/              # 本地源文档
  │   ├── README.md
  │   ├── tutorials/
  │   └── examples/
  ├── docs/                # VuePress 文档目录（同步生成）
  │   ├── .vuepress/
  │   ├── guides/         # 从 common 同步
  │   ├── tutorials/      # 从 source 同步
  │   ├── examples/       # 从 source 同步
  │   └── README.md       # 从 source 同步
  ├── docs-sync.config.ts
  └── package.json
  ```

## 使用流程

### 一、运行 docs1 (Site A)

#### 1. 安装依赖
```bash
cd /Users/lxh/MyProject/docs1
pnpm install
```

#### 2. 同步文档
```bash
# 从 docs-common 和本地 source 同步文档到 docs/
pnpm sync

# 或者预览同步（dry-run）
pnpm sync:dry-run

# 或者调试模式
pnpm sync:debug
```

#### 3. 运行 VuePress
```bash
# 开发模式
pnpm docs:dev

# 构建生产版本
pnpm docs:build
```

访问 http://localhost:8080 查看 Site A 文档。

### 二、运行 docs2 (Site B)

#### 1. 安装依赖
```bash
cd /Users/lxh/MyProject/docs2
pnpm install
```

#### 2. 同步文档
```bash
pnpm sync
```

#### 3. 运行 VuePress
```bash
pnpm docs:dev
```

访问 http://localhost:8080 查看 Site B 文档。

## 配置说明

### docs1/docs-sync.config.ts

```typescript
import { defineConfig } from '@docs-sync/cli';

export default defineConfig({
  site: 'site-a',  // 站点标识
  cacheDir: '.docs-sync-cache',

  sources: {
    // Git 仓库源
    common: {
      repo: 'ssh://git@git.dcloud.io:2222/liuxiaohang/docs-common.git',
      branch: 'main',
    },
    // 本地目录源（新功能！）
    local: {
      repo: '/Users/lxh/MyProject/docs1/source',
      branch: 'main',  // 本地源时此字段无效
    },
  },

  mappings: [
    // 从 common 同步共享文档
    { from: 'common:guides/install.md', to: 'docs/guides/install.md' },

    // 从 local/source 同步站点特定文档
    { from: 'local:README.md', to: 'docs/README.md' },
    { from: 'local:features/overview.md', to: 'docs/features/overview.md' },
  ],
});
```

### 支持的源类型

1. **Git 仓库**: 以 ssh://, https://, git@ 开头的 URL
2. **本地目录**: 以 `/`, `./`, `../` 开头的路径

## 工作流程

### 场景 1: 修改本地文档

```bash
cd /Users/lxh/MyProject/docs1

# 1. 修改 source/ 目录下的文档
vim source/features/overview.md

# 2. 同步文档到 docs/
pnpm sync

# 3. 预览更改
pnpm docs:dev
```

### 场景 2: 修改共享文档

```bash
cd /Users/lxh/MyProject/docs-common

# 1. 修改共享文档
vim guides/install.md

# 2. 提交并推送
git add .
git commit -m "Update install guide"
git push

# 3. 在 docs1 中同步
cd /Users/lxh/MyProject/docs1
pnpm sync  # 会自动 git pull 最新的 docs-common

# 4. 预览更改
pnpm docs:dev
```

### 场景 3: 测试站点过滤

修改 `docs-common/guides/install.md`，添加站点特定内容：

```markdown
<!-- @site site-a -->
## Site A 专用步骤
这段内容只在 Site A 显示
<!-- @endsite -->

<!-- @site site-b -->
## Site B 专用步骤
这段内容只在 Site B 显示
<!-- @endsite -->
```

然后分别在 docs1 和 docs2 中同步和预览，查看差异。

## 文档特性

### 1. @include 指令

在文档中嵌入其他文档：

```markdown
# 安装指南

<!-- @include common:snippets/note.md -->

## 步骤

<!-- @include common:snippets/installation-requirements.md -->
```

### 2. @site 指令

站点特定内容过滤：

```markdown
<!-- @site site-a -->
这段内容只在 Site A 显示
<!-- @endsite -->

<!-- @site site-b -->
这段内容只在 Site B 显示
<!-- @endsite -->

<!-- @site site-a, site-b -->
这段内容在 Site A 和 Site B 都显示
<!-- @endsite -->

<!-- @site !site-a -->
这段内容在除了 Site A 之外的所有站点显示
<!-- @endsite -->
```

### 3. Frontmatter 自动剥离

snippet 文件中的 frontmatter 会在同步时自动移除：

```markdown
---
type: note
title: 示例
---

实际内容（这部分会保留）
```

## 常见问题

### Q: 为什么 docs/ 目录下的文件不提交到 Git？

A: docs/ 目录是通过同步生成的，不应该提交。在 .gitignore 中已经忽略了这些文件。

### Q: 如何更新 docs-sync 工具？

```bash
cd /Users/lxh/MyProject/docs-sync
git pull
pnpm build
```

docs1 和 docs2 会自动使用最新版本（因为使用的是 pnpm link）。

### Q: 同步时出现错误怎么办？

1. 检查 docs-sync.config.ts 配置是否正确
2. 使用 `pnpm sync:debug` 查看详细日志
3. 清除缓存：`rm -rf .docs-sync-cache` 后重新同步

### Q: 如何在不同端口运行两个站点？

```bash
# Terminal 1 - Site A
cd /Users/lxh/MyProject/docs1
pnpm docs:dev  # 默认 8080

# Terminal 2 - Site B
cd /Users/lxh/MyProject/docs2
PORT=8081 pnpm docs:dev  # 指定 8081 端口
```

## 下一步

1. ✅ 三个仓库已设置完成
2. ✅ docs-sync 已支持本地目录源
3. ✅ VuePress 配置已完成
4. 🎯 现在可以开始测试！

### 快速测试命令

```bash
# 测试 docs1
cd /Users/lxh/MyProject/docs1
pnpm sync && pnpm docs:dev

# 测试 docs2
cd /Users/lxh/MyProject/docs2
pnpm sync && pnpm docs:dev
```
