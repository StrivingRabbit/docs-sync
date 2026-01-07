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
}
