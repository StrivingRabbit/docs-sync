# 测试仓库说明

本项目使用三个 Git 仓库进行测试：

## 仓库结构

### 1. docs-common (共享文档仓库)
- **路径**: `/Users/lxh/MyProject/docs-common`
- **远程**: `ssh://git@git.dcloud.io:2222/liuxiaohang/docs-common.git`
- **用途**: 存储跨站点共享的文档和代码片段

**内容结构**:
```
docs-common/
├── guides/
│   ├── install.md              # 安装指南（包含 @site 指令）
│   └── quickstart.md           # 快速开始（包含 @site 和 @include 指令）
└── snippets/
    ├── warning.md              # 警告信息片段
    ├── note.md                 # 提示信息片段
    └── installation-requirements.md  # 安装要求片段
```

### 2. docs1 (Site A 专用仓库)
- **路径**: `/Users/lxh/MyProject/docs1`
- **远程**: `ssh://git@git.dcloud.io:2222/liuxiaohang/docs1.git`
- **用途**: Site A 的特定文档

**内容结构**:
```
docs1/
├── README.md                   # Site A 首页（引用 common 内容）
├── features/
│   └── overview.md            # 功能概览
└── api/
    └── reference.md           # API 文档
```

### 3. docs2 (Site B 专用仓库)
- **路径**: `/Users/lxh/MyProject/docs2`
- **远程**: `ssh://git@git.dcloud.io:2222/liuxiaohang/docs2.git`
- **用途**: Site B 的特定文档

**内容结构**:
```
docs2/
├── README.md                   # Site B 首页（引用 common 内容）
├── tutorials/
│   └── getting-started.md     # 入门教程
└── examples/
    └── basic.md               # 基础示例
```

## 测试配置

### Site A 配置 (docs-sync.config.ts)
```bash
npm run dev sync
```

将会:
- 从 `common` 仓库同步共享文档
- 从 `docs1` 仓库同步 Site A 特定文档
- 处理 `@site site-a` 指令，只保留 Site A 的内容
- 处理 `@include` 指令，嵌入引用的文档片段
- 输出到 `output/site-a/` 目录

### Site B 配置 (docs-sync-site-b.config.ts)
```bash
npm run dev sync -- --config docs-sync-site-b.config.ts
```

将会:
- 从 `common` 仓库同步共享文档
- 从 `docs2` 仓库同步 Site B 特定文档
- 处理 `@site site-b` 指令，只保留 Site B 的内容
- 处理 `@include` 指令，嵌入引用的文档片段
- 输出到 `output/site-b/` 目录

## 测试场景

### 1. 测试 @include 指令
修改 `docs-common/snippets/note.md`，然后运行同步：
```bash
cd /Users/lxh/MyProject/docs-common
# 修改 snippets/note.md
git add . && git commit -m "Update note" && git push

cd /Users/lxh/MyProject/docs-sync
npm run dev sync
```

检查 `output/site-a/` 中引用此片段的文档是否更新。

### 2. 测试 @site 指令
修改 `docs-common/guides/install.md` 中的站点特定内容：
```bash
cd /Users/lxh/MyProject/docs-common
# 修改 guides/install.md 中的 @site 部分
git add . && git commit -m "Update site-specific content" && git push

cd /Users/lxh/MyProject/docs-sync
npm run dev sync  # 同步 Site A
npm run dev sync -- --config docs-sync-site-b.config.ts  # 同步 Site B
```

比较 `output/site-a/guides/install.md` 和 `output/site-b/guides/install.md` 的差异。

### 3. 测试依赖追踪
修改 `docs-common/snippets/warning.md`：
```bash
cd /Users/lxh/MyProject/docs-common
echo "新的警告内容" >> snippets/warning.md
git add . && git commit -m "Update warning" && git push

cd /Users/lxh/MyProject/docs-sync
npm run dev sync
```

检查所有引用 `warning.md` 的文档是否都被重新编译。

### 4. 测试 dry-run 模式
预览更改而不实际写入文件：
```bash
npm run dev sync -- --dry-run
```

### 5. 测试多个独立站点
同时为两个站点生成文档：
```bash
# 为 Site A 生成
npm run dev sync

# 为 Site B 生成
npm run dev sync -- --config docs-sync-site-b.config.ts
```

比较两个站点的输出内容差异。

## 快速修改脚本

创建快速修改脚本来测试实时同步：

### 修改并推送 common 仓库
```bash
#!/bin/bash
cd /Users/lxh/MyProject/docs-common
# 你的修改
git add .
git commit -m "Test change"
git push
```

### 修改并推送 docs1 仓库
```bash
#!/bin/bash
cd /Users/lxh/MyProject/docs1
# 你的修改
git add .
git commit -m "Test change"
git push
```

### 修改并推送 docs2 仓库
```bash
#!/bin/bash
cd /Users/lxh/MyProject/docs2
# 你的修改
git add .
git commit -m "Test change"
git push
```

## 验证输出

同步完成后，检查以下内容：

### Site A 输出 (output/site-a/)
- ✅ `guides/install.md` 应该只包含 Site A 的安装步骤
- ✅ 所有 `@include` 指令应该被替换为实际内容
- ✅ Frontmatter 应该被移除
- ✅ 文件头部应包含生成注释和内容哈希

### Site B 输出 (output/site-b/)
- ✅ `guides/install.md` 应该只包含 Site B 的安装步骤
- ✅ 所有 `@include` 指令应该被替换为实际内容
- ✅ Frontmatter 应该被移除
- ✅ 文件头部应包含生成注释和内容哈希

## 常见测试用例

### 添加新的 snippet
```bash
cd /Users/lxh/MyProject/docs-common
cat > snippets/tip.md << 'EOF'
---
type: tip
---

> **💡 小贴士**: 这是一个新的提示信息。
EOF

git add . && git commit -m "Add new tip snippet" && git push
```

### 添加站点特定内容
在 `install.md` 中添加新的 `@site` 区块：
```markdown
<!-- @site site-c -->
## Site C 安装步骤
这是 Site C 的特定内容
<!-- @endsite -->
```

### 测试嵌套 include
创建一个包含其他 include 的文档：
```markdown
# 复杂文档

<!-- @include common:snippets/note.md -->

## 详细信息

<!-- @include common:guides/quickstart.md -->
```

## 故障排查

如果遇到问题：

1. **清除缓存**: `rm -rf .docs-sync-cache`
2. **重新克隆**: 删除缓存后重新运行同步
3. **检查 Git 状态**: 确保所有仓库都已推送最新更改
4. **查看日志**: 使用 `--debug` 标志查看详细日志

```bash
npm run dev sync -- --debug
```
