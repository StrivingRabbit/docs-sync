import { describe, it, expect } from 'vitest';
import { DepGraph } from '../graph';

describe('DepGraph', () => {
  it('should create empty graph', () => {
    const graph = new DepGraph();
    expect(graph.reverse).toBeInstanceOf(Map);
    expect(graph.reverse.size).toBe(0);
  });

  it('should add simple dependency', () => {
    const graph = new DepGraph();
    graph.addDep('common:a.md', 'target1.md');

    expect(graph.reverse.has('common:a.md')).toBe(true);
    expect(graph.reverse.get('common:a.md')?.has('target1.md')).toBe(true);
  });

  it('should add multiple dependencies to same source', () => {
    const graph = new DepGraph();
    graph.addDep('common:a.md', 'target1.md');
    graph.addDep('common:a.md', 'target2.md');

    const deps = graph.reverse.get('common:a.md');
    expect(deps?.size).toBe(2);
    expect(deps?.has('target1.md')).toBe(true);
    expect(deps?.has('target2.md')).toBe(true);
  });

  it('should find directly affected files', () => {
    const graph = new DepGraph();
    graph.addDep('common:a.md', 'target1.md');
    graph.addDep('common:a.md', 'target2.md');

    const affected = graph.affected('common:a.md');
    expect(affected.size).toBe(2);
    expect(affected.has('target1.md')).toBe(true);
    expect(affected.has('target2.md')).toBe(true);
  });

  it('should find transitively affected files', () => {
    const graph = new DepGraph();
    // a.md -> target1.md -> target2.md
    graph.addDep('common:a.md', 'target1.md');
    graph.addDep('target1.md', 'target2.md');

    const affected = graph.affected('common:a.md');
    expect(affected.size).toBe(2);
    expect(affected.has('target1.md')).toBe(true);
    expect(affected.has('target2.md')).toBe(true);
  });

  it('should handle complex dependency chains', () => {
    const graph = new DepGraph();
    // Build dependency tree:
    //        a.md
    //       /    \
    //   target1  target2
    //      |        |
    //   target3  target4
    //      \      /
    //      target5

    graph.addDep('common:a.md', 'target1');
    graph.addDep('common:a.md', 'target2');
    graph.addDep('target1', 'target3');
    graph.addDep('target2', 'target4');
    graph.addDep('target3', 'target5');
    graph.addDep('target4', 'target5');

    // Visualize the graph
    console.log('\n=== Complex Dependency Chain ===');
    console.log(graph.visualize());
    console.log('\n=== Mermaid Format ===');
    console.log(graph.toMermaid());
    console.log('');

    const affected = graph.affected('common:a.md');
    expect(affected.size).toBe(5);
    expect(affected.has('target1')).toBe(true);
    expect(affected.has('target2')).toBe(true);
    expect(affected.has('target3')).toBe(true);
    expect(affected.has('target4')).toBe(true);
    expect(affected.has('target5')).toBe(true);
  });

  it('should handle circular dependencies without infinite loop', () => {
    const graph = new DepGraph();
    // Create circular dependency: a -> b -> c -> a
    graph.addDep('a', 'b');
    graph.addDep('b', 'c');
    graph.addDep('c', 'a');

    // Visualize the circular dependency
    console.log('\n=== Circular Dependency (a -> b -> c -> a) ===');
    console.log(graph.visualize());
    console.log('\n=== Mermaid Format ===');
    console.log(graph.toMermaid());
    console.log('');

    const affected = graph.affected('a');
    expect(affected.size).toBe(3);
    expect(affected.has('a')).toBe(true);
    expect(affected.has('b')).toBe(true);
    expect(affected.has('c')).toBe(true);
  });

  it('should return empty set for non-existent dependency', () => {
    const graph = new DepGraph();
    graph.addDep('common:a.md', 'target1.md');

    const affected = graph.affected('common:nonexistent.md');
    expect(affected.size).toBe(0);
  });

  it('should handle multiple independent trees', () => {
    const graph = new DepGraph();
    // Tree 1: a -> target1
    graph.addDep('a', 'target1');
    // Tree 2: b -> target2
    graph.addDep('b', 'target2');

    // Visualize independent trees
    console.log('\n=== Multiple Independent Trees ===');
    console.log(graph.visualize());
    console.log('\n=== Mermaid Format ===');
    console.log(graph.toMermaid());
    console.log('');

    const affectedA = graph.affected('a');
    expect(affectedA.size).toBe(1);
    expect(affectedA.has('target1')).toBe(true);
    expect(affectedA.has('target2')).toBe(false);

    const affectedB = graph.affected('b');
    expect(affectedB.size).toBe(1);
    expect(affectedB.has('target2')).toBe(true);
    expect(affectedB.has('target1')).toBe(false);
  });

  it('should visualize empty graph', () => {
    const graph = new DepGraph();

    expect(graph.visualize()).toBe('(empty graph)');
    expect(graph.toMermaid()).toContain('empty[Empty Graph]');
  });

  it('should visualize simple dependency', () => {
    const graph = new DepGraph();
    graph.addDep('source.md', 'target.md');

    const visualization = graph.visualize();
    expect(visualization).toContain('source.md');
    expect(visualization).toContain('target.md');
    expect(visualization).toContain('└─');

    const mermaid = graph.toMermaid();
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('source.md');
    expect(mermaid).toContain('target.md');
    expect(mermaid).toContain('-->');
  });

  describe('removeDep', () => {
    it('should remove dependency from graph', () => {
      const graph = new DepGraph();
      graph.addDep('common:a.md', 'target1.md');
      graph.addDep('common:a.md', 'target2.md');

      expect(graph.reverse.has('common:a.md')).toBe(true);

      graph.removeDep('common:a.md');

      expect(graph.reverse.has('common:a.md')).toBe(false);
    });

    it('should remove dependency from other targets', () => {
      const graph = new DepGraph();
      // Build: snippet.md -> source.md -> target1.md
      graph.addDep('common:snippet.md', 'common:source.md');
      graph.addDep('common:source.md', 'target1.md');

      console.log('\n=== Before Removing common:source.md ===');
      console.log(graph.visualize());

      graph.removeDep('common:source.md');

      console.log('\n=== After Removing common:source.md ===');
      console.log(graph.visualize());
      console.log('');

      // common:source.md should be removed
      expect(graph.reverse.has('common:source.md')).toBe(false);

      // common:snippet.md should no longer reference common:source.md
      const snippetTargets = graph.reverse.get('common:snippet.md');
      expect(snippetTargets?.has('common:source.md')).toBe(false);
    });

    it('should handle removing non-existent dependency', () => {
      const graph = new DepGraph();
      graph.addDep('common:a.md', 'target1.md');

      // Should not throw when removing non-existent dependency
      expect(() => {
        graph.removeDep('common:nonexistent.md');
      }).not.toThrow();

      // Original dependency should remain
      expect(graph.reverse.has('common:a.md')).toBe(true);
    });

    it('should remove dependency from complex graph', () => {
      const graph = new DepGraph();
      // Build complex graph:
      //   a.md -> b.md -> c.md
      //   a.md -> d.md
      //   e.md -> b.md
      graph.addDep('a.md', 'b.md');
      graph.addDep('b.md', 'c.md');
      graph.addDep('a.md', 'd.md');
      graph.addDep('e.md', 'b.md');

      console.log('\n=== Before Removing b.md (Complex Graph) ===');
      console.log(graph.visualize());

      // Remove b.md
      graph.removeDep('b.md');

      console.log('\n=== After Removing b.md ===');
      console.log(graph.visualize());
      console.log('');

      // b.md should be removed from graph
      expect(graph.reverse.has('b.md')).toBe(false);

      // a.md should no longer reference b.md, but should still reference d.md
      const aTargets = graph.reverse.get('a.md');
      expect(aTargets?.has('b.md')).toBe(false);
      expect(aTargets?.has('d.md')).toBe(true);

      // e.md should no longer reference b.md
      const eTargets = graph.reverse.get('e.md');
      expect(eTargets?.has('b.md')).toBe(false);
    });

    it('should affect graph queries after removal', () => {
      const graph = new DepGraph();
      // a.md -> b.md -> c.md
      graph.addDep('a.md', 'b.md');
      graph.addDep('b.md', 'c.md');

      console.log('\n=== Before Removing b.md (Dependency Chain) ===');
      console.log(graph.visualize());

      // Before removal, a.md affects both b.md and c.md
      let affected = graph.affected('a.md');
      console.log(`\nAffected by a.md (before): ${Array.from(affected).join(', ')}`);
      expect(affected.size).toBe(2);
      expect(affected.has('b.md')).toBe(true);
      expect(affected.has('c.md')).toBe(true);

      // Remove b.md
      graph.removeDep('b.md');

      console.log('\n=== After Removing b.md (Chain Broken) ===');
      console.log(graph.visualize());

      // After removal, a.md should no longer affect c.md (chain is broken)
      affected = graph.affected('a.md');
      console.log(`Affected by a.md (after): ${affected.size === 0 ? '(none)' : Array.from(affected).join(', ')}`);
      console.log('');

      expect(affected.size).toBe(0);
    });

    it('should handle removing from empty graph', () => {
      const graph = new DepGraph();

      expect(() => {
        graph.removeDep('common:a.md');
      }).not.toThrow();

      expect(graph.reverse.size).toBe(0);
    });

    it('should clean up empty target sets', () => {
      const graph = new DepGraph();
      graph.addDep('a.md', 'b.md');
      graph.addDep('c.md', 'b.md');

      // Remove b.md
      graph.removeDep('b.md');

      // Both a.md and c.md should still exist but with empty or cleaned target sets
      const aTargets = graph.reverse.get('a.md');
      const cTargets = graph.reverse.get('c.md');

      // They should exist but not reference b.md
      expect(aTargets?.has('b.md')).toBe(false);
      expect(cTargets?.has('b.md')).toBe(false);
    });
  });
});
