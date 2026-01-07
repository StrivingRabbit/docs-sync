# 测试文档

## 概述

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架，提供了完整的单元测试和集成测试。

## 运行测试

### 安装测试依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行测试一次（CI 模式）

```bash
npm run test:run
```

### 生成测试覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录。

## 测试结构

```
src/__tests__/
├── fixtures/                # 测试数据文件
│   ├── README.md
│   ├── test.config.ts      # 测试配置示例
│   ├── common/             # 模拟 common 源仓库
│   │   ├── a.md
│   │   ├── b.md
│   │   ├── snippet.md
│   │   ├── with-frontmatter.md
│   │   ├── with-site-directives.md
│   │   ├── with-includes.md
│   │   ├── complex.md
│   │   └── snippets/
│   │       ├── note.md
│   │       └── warning.md
│   └── other/              # 模拟 other 源仓库
│       └── c.md
├── site-filter.test.ts     # site-filter 模块单元测试
├── graph.test.ts           # 依赖图单元测试
├── include.test.ts         # include 指令单元测试
├── compiler.test.ts        # 编译器单元测试
└── integration.test.ts     # 集成测试
```

## 测试覆盖范围

### 1. Site Filter 测试 (`site-filter.test.ts`)

测试站点过滤功能：

- ✅ 匹配站点时包含内容
- ✅ 不匹配站点时排除内容
- ✅ 多站点支持
- ✅ 排除语法（`!site-a`）
- ✅ 多重排除
- ✅ 嵌套内容处理
- ✅ 保留无指令内容

### 2. Dependency Graph 测试 (`graph.test.ts`)

测试依赖追踪功能：

- ✅ 创建空依赖图
- ✅ 添加简单依赖
- ✅ 添加多个依赖到同一源
- ✅ 查找直接受影响的文件
- ✅ 查找传递受影响的文件
- ✅ 处理复杂依赖链
- ✅ 处理循环依赖（无限循环保护）
- ✅ 处理不存在的依赖
- ✅ 处理多个独立依赖树

### 3. Include 指令测试 (`include.test.ts`)

测试 include 指令功能：

- ✅ 替换 include 指令为文件内容
- ✅ 处理多个 include
- ✅ 剥离 frontmatter
- ✅ 修剪空白
- ✅ 文件不存在时返回错误占位符
- ✅ 文件读取失败时返回错误占位符
- ✅ 构造正确的文件路径
- ✅ 处理带空格的 include
- ✅ 保留无 include 的内容
- ✅ 追踪所有被包含的文件为依赖

### 4. Compiler 测试 (`compiler.test.ts`)

测试编译器功能：

- ✅ 编译简单映射
- ✅ 处理 include
- ✅ 按站点过滤
- ✅ 添加依赖到依赖图
- ✅ 在输出中包含内容哈希
- ✅ 确保目标目录存在
- ✅ 源文件读取失败时抛出错误
- ✅ 处理复杂编译（include + 站点过滤）
- ✅ 支持不同的源键

### 5. Integration 测试 (`integration.test.ts`)

端到端集成测试：

- ✅ 完整同步工作流
- ✅ 处理多个映射
- ✅ 正确追踪依赖

## Mock 策略

### 文件系统 Mock

使用 `FsOps` 接口的 mock 实现，避免实际文件操作：

```typescript
const mockFs: FsOps = {
  exists: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  ensureDir: vi.fn(),
  stat: vi.fn(),
};
```

### Logger Mock

所有测试都 mock 了 logger 以保持测试输出清洁：

```typescript
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
```

## 编写新测试

### 单元测试模板

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { yourFunction } from '../your-module';

describe('yourFunction', () => {
  beforeEach(() => {
    // 设置测试环境
  });

  it('should do something', () => {
    // 准备
    const input = 'test';

    // 执行
    const result = yourFunction(input);

    // 断言
    expect(result).toBe('expected');
  });
});
```

### 集成测试注意事项

1. 使用临时目录进行测试
2. 在 `beforeEach` 中创建测试环境
3. 在 `afterEach` 中清理测试环境
4. 使用真实的 Git 仓库进行测试

## CI/CD 集成

在 CI 环境中运行测试：

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## 故障排除

### 测试超时

如果集成测试超时，可以增加超时时间：

```typescript
it('should complete', async () => {
  // ...
}, 10000); // 10 秒超时
```

### Mock 不生效

确保 mock 在导入模块之前定义：

```typescript
vi.mock('../logger'); // 必须在 import 之前

import { yourFunction } from '../your-module';
```

## 最佳实践

1. **单一职责**：每个测试只测试一个功能点
2. **清晰命名**：使用描述性的测试名称
3. **独立性**：测试之间不应相互依赖
4. **清理**：使用 `beforeEach` 和 `afterEach` 确保测试环境干净
5. **覆盖边界情况**：测试正常情况和异常情况
6. **使用 Mock**：避免依赖外部系统（文件系统、网络等）

## 测试覆盖率目标

- **整体覆盖率**: > 80%
- **核心模块**: > 90%
  - compiler.ts
  - include.ts
  - site-filter.ts
  - graph.ts
