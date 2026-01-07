import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveIncludes } from '../include';
import type { FsOps } from '../fs/types';

describe('resolveIncludes', () => {
  let mockFs: FsOps;
  let deps: Set<string>;

  beforeEach(() => {
    deps = new Set();
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

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

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

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

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

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

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

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

    expect(result).toBe('Content with whitespace');
  });

  it('should return error placeholder when file not found', () => {
    const content = '<!-- @include common:missing.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(false);

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

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

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

    expect(result).toContain('ERROR: Failed to read include file');
    expect(result).toContain('common:error.md');
  });

  it('should construct correct file path', () => {
    const content = '<!-- @include common:path/to/file.md -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue('content');

    resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

    expect(mockFs.exists).toHaveBeenCalledWith('/cache/common/path/to/file.md');
    expect(mockFs.readFileSync).toHaveBeenCalledWith('/cache/common/path/to/file.md');
  });

  it('should handle include with spaces', () => {
    const content = '<!--   @include   common:file.md   -->';

    vi.mocked(mockFs.exists).mockReturnValue(true);
    vi.mocked(mockFs.readFileSync).mockReturnValue('content');

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

    expect(result).toBe('content');
    expect(deps.has('common:file.md')).toBe(true);
  });

  it('should preserve content without includes', () => {
    const content = '# Normal content\nNo includes here';

    const result = resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

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

    resolveIncludes(content, '/cache', 'site-a', deps, mockFs);

    expect(deps.size).toBe(3);
    expect(deps.has('common:a.md')).toBe(true);
    expect(deps.has('common:b.md')).toBe(true);
    expect(deps.has('other:c.md')).toBe(true);
  });
});
