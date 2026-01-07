export function filterBySite(content: string, site: string) {
  return content.replace(
    /<!--\s*@site\s+([^>]+)\s*-->([\s\S]*?)<!--\s*@endsite\s*-->/g,
    (_, rule, body) => {
      const rules = rule.split(',').map((r: string) => r.trim());
      const hasExclude = rules.some((r: string) => r.startsWith('!'));

      if (hasExclude) {
        return rules.includes(`!${site}`) ? '' : body;
      }

      return rules.includes(site) ? body : '';
    }
  );
}
