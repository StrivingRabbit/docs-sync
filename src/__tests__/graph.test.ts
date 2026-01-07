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
});
