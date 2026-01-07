import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveIncludes } from '../include';
import type { FsOps } from '../fs/types';

describe('resolveIncludes', () => {
  let mockFs: FsOps;
  let deps: Set<string>;
  let sourcePaths: Record<string, string>;

  beforeEach(() => {
    deps = new Set();
    sourcePaths = {
      common: '/cache/common',
      other: '/cache/other',
    };
    mockFs = {
      exists: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      ensureDir: vi.fn(),
      stat: vi.fn(),
    };
  });

  it('should replace include directive with file content', () => {
    const content = '# Header\n<!-- @include common:snippet.md -->\n# Footer';
    const includedContent = 'This is the included content';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(includedContent);

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('This is the included content');
    expect(result).not.toContain('@include');
    expect(deps.has('common:snippet.md')).toBe(true);
  });

  it('should handle multiple includes', () => {
    const content = `
<!-- @include common:a.md -->
Middle
<!-- @include common:b.md -->
`;

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync)
      .mockReturnValueOnce('Content A')
      .mockReturnValueOnce('Content B');

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('Content A');
    expect(result).toContain('Content B');
    expect(result).toContain('Middle');
    expect(deps.has('common:a.md')).toBe(true);
    expect(deps.has('common:b.md')).toBe(true);
  });

  it('should strip frontmatter from included content', () => {
    const content = '<!-- @include common:with-frontmatter.md -->';
    const includedContent = `---
title: Test
author: John
---

Actual content`;

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(includedContent);

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('Actual content');
    expect(result).not.toContain('title: Test');
    expect(result).not.toContain('author: John');
    expect(result).not.toContain('---');
  });

  it('should trim whitespace from included content', () => {
    const content = '<!-- @include common:whitespace.md -->';
    const includedContent = '   \n\nContent with whitespace\n\n   ';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue(includedContent);

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toBe('Content with whitespace');
  });

  it('should return error placeholder when file not found', () => {
    const content = '<!-- @include common:missing.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(false);

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('ERROR: Include file not found');
    expect(result).toContain('common:missing.md');
    expect(deps.has('common:missing.md')).toBe(false);
  });

  it('should return error placeholder when file read fails', () => {
    const content = '<!-- @include common:error.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('ERROR: Failed to read include file');
    expect(result).toContain('common:error.md');
  });

  it('should construct correct file path', () => {
    const content = '<!-- @include common:path/to/file.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue('content');

    resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(mockFs.exists).toHaveBeenCalledWith('/cache/common/path/to/file.md');
    expect(mockFs.readFileSync).toHaveBeenCalledWith('/cache/common/path/to/file.md');
  });

  it('should handle include with spaces', () => {
    const content = '<!--   @include   common:file.md   -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue('content');

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toBe('content');
    expect(deps.has('common:file.md')).toBe(true);
  });

  it('should preserve content without includes', () => {
    const content = '# Normal content\nNo includes here';

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toBe(content);
    expect(deps.size).toBe(0);
  });

  it('should track all included files as dependencies', () => {
    const content = `
<!-- @include common:a.md -->
<!-- @include common:b.md -->
<!-- @include other:c.md -->
`;

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue('content');

    resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(deps.size).toBe(3);
    expect(deps.has('common:a.md')).toBe(true);
    expect(deps.has('common:b.md')).toBe(true);
    expect(deps.has('other:c.md')).toBe(true);
  });

  it('should handle nested includes recursively', () => {
    const content = '<!-- @include common:parent.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync)
      // First call: parent.md contains another include
      .mockReturnValueOnce('Parent content\n<!-- @include common:child.md -->\nMore parent')
      // Second call: child.md is plain content
      .mockReturnValueOnce('Child content');

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('Parent content');
    expect(result).toContain('Child content');
    expect(result).toContain('More parent');
    expect(result).not.toContain('@include');
    expect(deps.has('common:parent.md')).toBe(true);
    expect(deps.has('common:child.md')).toBe(true);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
  });

  it('should handle deeply nested includes', () => {
    const content = '<!-- @include common:level1.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync)
      .mockReturnValueOnce('Level 1\n<!-- @include common:level2.md -->')
      .mockReturnValueOnce('Level 2\n<!-- @include common:level3.md -->')
      .mockReturnValueOnce('Level 3 content');

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('Level 1');
    expect(result).toContain('Level 2');
    expect(result).toContain('Level 3 content');
    expect(deps.has('common:level1.md')).toBe(true);
    expect(deps.has('common:level2.md')).toBe(true);
    expect(deps.has('common:level3.md')).toBe(true);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(3);
  });

  it('should detect circular includes', () => {
    const content = '<!-- @include common:circular.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    // The file includes itself (or already in deps)
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      'Content\n<!-- @include common:circular.md -->'
    );

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    expect(result).toContain('Content');
    expect(result).toContain('ERROR: Circular include detected: common:circular.md');
    expect(deps.has('common:circular.md')).toBe(true);
  });

  it('should allow same file to be included multiple times from different branches', () => {
    const content = `<!-- @include common:parent1.md -->
<!-- @include common:parent2.md -->`;

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync)
      // parent1.md includes shared.md
      .mockReturnValueOnce('Parent 1\n<!-- @include common:shared.md -->')
      // shared.md from parent1
      .mockReturnValueOnce('Shared content')
      // parent2.md also includes shared.md
      .mockReturnValueOnce('Parent 2\n<!-- @include common:shared.md -->')
      // shared.md from parent2
      .mockReturnValueOnce('Shared content');

    const result = resolveIncludes(content, sourcePaths, 'site-a', deps, mockFs);

    // Should not report circular include error
    expect(result).not.toContain('ERROR: Circular include detected');
    expect(result).toContain('Parent 1');
    expect(result).toContain('Parent 2');
    // Shared content should appear twice
    const matches = result.match(/Shared content/g);
    expect(matches).toHaveLength(2);
    // All files should be tracked as dependencies
    expect(deps.has('common:parent1.md')).toBe(true);
    expect(deps.has('common:parent2.md')).toBe(true);
    expect(deps.has('common:shared.md')).toBe(true);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(4);
  });
});
