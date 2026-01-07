import { describe, it, expect } from 'vitest';
import { filterBySite } from '../site-filter';

describe('filterBySite', () => {
  it('should include content for matching site', () => {
    const content = `
# Header
<!-- @site site-a -->
This is for site-a
<!-- @endsite -->
Footer
`;
    const result = filterBySite(content, 'site-a');
    expect(result).toContain('This is for site-a');
    expect(result).toContain('Header');
    expect(result).toContain('Footer');
  });

  it('should exclude content for non-matching site', () => {
    const content = `
# Header
<!-- @site site-a -->
This is for site-a
<!-- @endsite -->
Footer
`;
    const result = filterBySite(content, 'site-b');
    expect(result).not.toContain('This is for site-a');
    expect(result).toContain('Header');
    expect(result).toContain('Footer');
  });

  it('should handle multiple sites', () => {
    const content = `
<!-- @site site-a, site-b -->
Content for A and B
<!-- @endsite -->
`;
    expect(filterBySite(content, 'site-a')).toContain('Content for A and B');
    expect(filterBySite(content, 'site-b')).toContain('Content for A and B');
    expect(filterBySite(content, 'site-c')).not.toContain('Content for A and B');
  });

  it('should handle exclusion with !', () => {
    const content = `
<!-- @site !site-a -->
Content for all except site-a
<!-- @endsite -->
`;
    expect(filterBySite(content, 'site-a')).not.toContain('Content for all except site-a');
    expect(filterBySite(content, 'site-b')).toContain('Content for all except site-a');
    expect(filterBySite(content, 'site-c')).toContain('Content for all except site-a');
  });

  it('should handle multiple exclusions', () => {
    const content = `
<!-- @site !site-a, !site-b -->
Content for all except site-a and site-b
<!-- @endsite -->
`;
    expect(filterBySite(content, 'site-a')).toBe('\n\n');
    expect(filterBySite(content, 'site-b')).toBe('\n\n');
    expect(filterBySite(content, 'site-c')).toContain('Content for all except site-a and site-b');
  });

  it('should handle nested content', () => {
    const content = `
Before
<!-- @site site-a -->
First block
<!-- @endsite -->
Middle
<!-- @site site-b -->
Second block
<!-- @endsite -->
After
`;
    const resultA = filterBySite(content, 'site-a');
    expect(resultA).toContain('First block');
    expect(resultA).not.toContain('Second block');
    expect(resultA).toContain('Before');
    expect(resultA).toContain('Middle');
    expect(resultA).toContain('After');

    const resultB = filterBySite(content, 'site-b');
    expect(resultB).not.toContain('First block');
    expect(resultB).toContain('Second block');
  });

  it('should preserve content without site directives', () => {
    const content = `
# Normal content
This has no site directives
`;
    const result = filterBySite(content, 'any-site');
    expect(result).toBe(content);
  });
});
