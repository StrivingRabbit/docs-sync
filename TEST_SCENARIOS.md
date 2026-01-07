# 测试场景总览

## 已创建的测试内容

### 📦 docs-common (共享文档)
包含的测试特性：
- ✅ `@include` 指令 - 在 `guides/install.md` 和 `guides/quickstart.md` 中
- ✅ `@site` 指令 - 区分 `site-a` 和 `site-b` 的内容
- ✅ `@site !site-a` 排除指令 - 在 `guides/quickstart.md` 中
- ✅ Frontmatter - 在所有 snippet 文件中
- ✅ 可复用片段 - `snippets/` 目录

### 📦 docs1 (Site A 文档)
- ✅ 引用 common 内容的复杂文档
- ✅ 多层级目录结构
- ✅ 代码示例和 API 文档

### 📦 docs2 (Site B 文档)
- ✅ 引用 common 内容的教程文档
- ✅ 示例代码文档
- ✅ 不同于 Site A 的内容结构

## 快速测试命令

### 同步 Site A
```bash
cd /Users/lxh/MyProject/docs-sync
npm run dev sync
```

### 同步 Site B
```bash
cd /Users/lxh/MyProject/docs-sync
npm run dev sync -- --config docs-sync-site-b.config.ts
```

### Dry-run 预览
```bash
npm run dev sync -- --dry-run
```

### 带调试信息同步
```bash
npm run dev sync -- --debug
```

## 测试要点

1. **Include 处理**: 检查所有 @include 标签是否被替换
2. **Site 过滤**: 验证不同站点看到不同的内容
3. **Frontmatter 剥离**: 确认 snippet 的 frontmatter 被移除
4. **依赖追踪**: 修改 snippet 后检查依赖文件是否重新编译
5. **错误处理**: 引用不存在的文件时应优雅处理

## 仓库地址

- docs-common: `/Users/lxh/MyProject/docs-common`
- docs1: `/Users/lxh/MyProject/docs1`
- docs2: `/Users/lxh/MyProject/docs2`

所有仓库均已配置 Git 远程，可以自由修改、提交和推送。
