export class DepGraph {
  reverse = new Map<string, Set<string>>();

  addDep(dep: string, target: string) {
    if (!this.reverse.has(dep)) {
      this.reverse.set(dep, new Set());
    }
    this.reverse.get(dep)!.add(target);
  }

  affected(dep: string): Set<string> {
    const result = new Set<string>();

    const walk = (d: string) => {
      for (const t of this.reverse.get(d) ?? []) {
        if (!result.has(t)) {
          result.add(t);
          walk(t);
        }
      }
    };

    walk(dep);
    return result;
  }

  /**
   * 清除指定依赖的所有记录
   * 当源文件被删除时调用
   */
  removeDep(dep: string) {
    this.reverse.delete(dep);

    // 同时从其他依赖的目标集合中移除
    for (const targets of this.reverse.values()) {
      targets.delete(dep);
    }
  }

  /**
   * 生成依赖图的可视化表示（ASCII 艺术风格）
   */
  visualize(): string {
    if (this.reverse.size === 0) {
      return '(empty graph)';
    }

    const lines: string[] = [];
    const visited = new Set<string>();

    // 按字母顺序排序，使输出稳定
    const sources = Array.from(this.reverse.keys()).sort();

    for (const source of sources) {
      if (visited.has(source)) continue;

      lines.push(`${source}`);
      const targets = Array.from(this.reverse.get(source) || []).sort();

      targets.forEach((target, index) => {
        const isLast = index === targets.length - 1;
        const prefix = isLast ? '└─' : '├─';
        lines.push(`  ${prefix} ${target}`);

        // 如果 target 也是一个 source，递归显示其依赖
        if (this.reverse.has(target) && !visited.has(target)) {
          const subTargets = Array.from(this.reverse.get(target) || []).sort();
          subTargets.forEach((subTarget, subIndex) => {
            const isSubLast = subIndex === subTargets.length - 1;
            const connector = isLast ? '  ' : '│ ';
            const subPrefix = isSubLast ? '└─' : '├─';
            lines.push(`  ${connector}  ${subPrefix} ${subTarget}`);
          });
        }
      });

      visited.add(source);
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  /**
   * 生成 Mermaid 格式的依赖图（可用于文档）
   */
  toMermaid(): string {
    if (this.reverse.size === 0) {
      return 'graph TD\n  empty[Empty Graph]';
    }

    const lines: string[] = ['graph TD'];

    for (const [source, targets] of this.reverse) {
      for (const target of targets) {
        // 清理节点名称，使其适合 Mermaid
        const cleanSource = source.replace(/[:.]/g, '_');
        const cleanTarget = target.replace(/[:.]/g, '_');
        lines.push(`  ${cleanSource}["${source}"] --> ${cleanTarget}["${target}"]`);
      }
    }

    return lines.join('\n');
  }
}
