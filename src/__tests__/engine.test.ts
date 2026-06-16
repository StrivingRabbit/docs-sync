import { describe, it, expect } from 'vitest';
import { getAffectedMappings } from '../engine';
import { DepGraph } from '../graph';
import type { Mapping } from '../types';

describe('getAffectedMappings', () => {
  it('should include a direct mapping when its source file changes', () => {
    const graph = new DepGraph();
    const mappings: Mapping[] = [
      { from: 'local:README.md', to: 'docs/README.md' },
    ];

    const affected = getAffectedMappings('local:README.md', mappings, graph);

    expect(affected.has('local:README.md')).toBe(true);
  });

  it('should include mappings affected through include dependencies', () => {
    const graph = new DepGraph();
    graph.addDep('local:snippets/tip.md', 'local:README.md');

    const mappings: Mapping[] = [
      { from: 'local:README.md', to: 'docs/README.md' },
    ];

    const affected = getAffectedMappings('local:snippets/tip.md', mappings, graph);

    expect(affected.has('local:README.md')).toBe(true);
  });

  it('should skip a direct mapping when direct files are excluded', () => {
    const graph = new DepGraph();
    const mappings: Mapping[] = [
      { from: 'local:README.md', to: 'docs/README.md' },
    ];

    const affected = getAffectedMappings('local:README.md', mappings, graph, false);

    expect(affected.has('local:README.md')).toBe(false);
  });
});
