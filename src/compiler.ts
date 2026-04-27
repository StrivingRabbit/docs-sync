import path from 'path';
import { filterBySite } from './site-filter';
import { resolveIncludes } from './include';
import { hashContent } from './hash';
import { DepGraph } from './graph';
import { Mapping, Source } from './types';
import { FsOps } from './fs/types';
import { logger } from './logger';

const endingSlashRE = /\/$/;

/**
 * 将 SSH 格式的 git 仓库地址转换为 HTTPS，并去除末尾的 .git。
 * 支持：
 *   ssh://git@host:port/org/repo.git → https://host/org/repo
 *   git@host:org/repo.git            → https://host/org/repo
 *   https://host/org/repo.git        → https://host/org/repo
 */
export function normalizeRepoUrl(repo: string): string {
  // ssh://git@hostname:port/path  or  ssh://git@hostname/path
  const sshProtoRE = /^ssh:\/\/(?:[^@]+@)?([^:/]+)(?::\d+)?(\/.*)/;
  // git@hostname:path
  const sshShortRE = /^(?:[^@]+@)([^:]+):(.+)/;

  let url = repo;
  const sshProtoMatch = url.match(sshProtoRE);
  if (sshProtoMatch) {
    url = `https://${sshProtoMatch[1]}${sshProtoMatch[2]}`;
  } else {
    const sshShortMatch = url.match(sshShortRE);
    if (sshShortMatch) {
      url = `https://${sshShortMatch[1]}/${sshShortMatch[2]}`;
    }
  }
  return url.replace(/\.git$/, '');
}

/**
 * 构建文件在远程仓库的编辑链接。
 * 平台规则（同 VuePress createEditLink）：
 *   Bitbucket → /src/{branch}/file?mode=edit...
 *   GitLab    → /-/edit/{branch}/file
 *   其余      → /edit/{branch}/file（GitHub / GitCode / Gitee / 自建 GitLab 等）
 */
export function buildEditLink(repo: string, branch: string, filePath: string): string {
  const base = normalizeRepoUrl(repo);

  if (/bitbucket\.org/.test(base)) {
    return (
      base.replace(endingSlashRE, '') +
      `/src/${branch}/${filePath}` +
      `?mode=edit&spa=0&at=${branch}&fileviewer=file-view-default`
    );
  }

  if (/gitlab\.com/.test(base)) {
    return base.replace(endingSlashRE, '') + `/-/edit/${branch}/${filePath}`;
  }

  // GitHub / GitCode / Gitee / 其他平台（含自建服务）
  return base.replace(endingSlashRE, '') + `/edit/${branch}/${filePath}`;
}

/**
 * 将 source 字段注入 frontmatter。
 * - 若内容已有 frontmatter，则在其中插入 source 字段。
 * - 若没有，则在内容前面添加新的 frontmatter 块。
 * 返回 { frontmatter, body }，body 是去掉原 frontmatter 后的剩余内容。
 */
function injectSourceFrontmatter(
  content: string,
  sourceUrl: string
): { frontmatter: string; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = content.match(frontmatterRegex);
  if (match) {
    const existing = match[1]
      .split('\n')
      .filter(line => !/^source\s*:/.test(line))
      .join('\n');
    const body = content.slice(match[0].length);
    return {
      frontmatter: `---\nsource: ${sourceUrl}\n${existing}\n---\n`,
      body,
    };
  }
  return {
    frontmatter: `---\nsource: ${sourceUrl}\n---\n`,
    body: content,
  };
}

/**
 * 删除指定 mapping 对应的输出文件
 * 当源文件被删除时调用
 */
export function deleteMapping(
  mapping: Mapping,
  graph: DepGraph,
  fs: FsOps
) {
  try {
    logger.info(`Deleting ${mapping.from} → ${mapping.to}`);

    // 删除输出文件(如果存在)
    if (fs.exists(mapping.to)) {
      fs.unlinkSync(mapping.to);
      logger.success(`Deleted ${mapping.to}`);
    } else {
      logger.debug(`Output file not found, skipping: ${mapping.to}`);
    }

    // 从依赖图中移除
    graph.removeDep(mapping.from);

  } catch (error) {
    logger.error(`Failed to delete ${mapping.from}: ${error}`);
    throw new Error(`Failed to delete ${mapping.from}: ${error}`);
  }
}

export function compileMapping(
  mapping: Mapping,
  sourcePaths: Record<string, string>,
  sources: Record<string, Source>,
  site: string,
  graph: DepGraph,
  fs: FsOps
) {
  try {
    const colonIdx = mapping.from.indexOf(':');
    const sourceKey = mapping.from.slice(0, colonIdx);
    const srcPath = mapping.from.slice(colonIdx + 1);
    const sourceBaseDir = sourcePaths[sourceKey];

    if (!sourceBaseDir) {
      throw new Error(`Source '${sourceKey}' not found in sourcePaths`);
    }

    const srcFile = path.join(sourceBaseDir, srcPath);

    logger.info(`Compiling ${mapping.from} → ${mapping.to}`);

    let content = fs.readFileSync(srcFile);
    const deps = new Set<string>([mapping.from]);

    content = resolveIncludes(content, sourcePaths, site, deps, fs);
    content = filterBySite(content, site);

    const hash = hashContent(content);
    logger.debug(`Content hash: ${hash.substring(0, 8)}...`);

    // 添加依赖到图中,排除自己(避免自循环)
    for (const d of deps) {
      if (d !== mapping.from) {
        graph.addDep(d, mapping.from);
      }
    }

    if (deps.size > 1) {
      logger.debug(`Dependencies: ${Array.from(deps).join(', ')}`);
    }

    const targetDir = path.dirname(mapping.to)
    fs.ensureDir(targetDir)

    const source = sources[sourceKey];
    const isLocalPath = !source || (
      source.repo.startsWith('/') ||
      source.repo.startsWith('./') ||
      source.repo.startsWith('../')
    );
    const isSidebar = path.basename(srcPath) === '_sidebar.md';

    if (isLocalPath || isSidebar) {
      fs.writeFileSync(
        mapping.to,
        `<!-- GENERATED BY docs-sync\nhash: ${hash}\n-->\n\n${content}`
      );
    } else {
      const sourceUrl = buildEditLink(source.repo, source.branch ?? 'main', srcPath);
      const { frontmatter, body } = injectSourceFrontmatter(content, sourceUrl);
      fs.writeFileSync(
        mapping.to,
        `${frontmatter}\n<!-- GENERATED BY docs-sync\nhash: ${hash}\n-->\n\n${body}`
      );
    }

    logger.success(`Compiled ${mapping.from}`);
  } catch (error) {
    logger.error(`Failed to compile ${mapping.from}: ${error}`);
    throw new Error(`Failed to compile ${mapping.from}: ${error}`);
  }
}
