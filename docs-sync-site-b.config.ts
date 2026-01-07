import { defineConfig } from './src/config';

export default defineConfig({
  site: 'site-b',

  cacheDir: '.docs-sync-cache',

  sources: {
    common: {
      repo: 'ssh://git@git.dcloud.io:2222/liuxiaohang/docs-common.git',
      branch: 'main',
    },
    docs1: {
      repo: 'ssh://git@git.dcloud.io:2222/liuxiaohang/docs1.git',
      branch: 'main',
    },
    docs2: {
      repo: 'ssh://git@git.dcloud.io:2222/liuxiaohang/docs2.git',
      branch: 'main',
    },
  },

  mappings: [
    // 从 common 同步共享文档
    {
      from: 'common:guides/install.md',
      to: 'output/site-b/guides/install.md',
    },
    {
      from: 'common:guides/quickstart.md',
      to: 'output/site-b/guides/quickstart.md',
    },
    {
      from: 'common:snippets/warning.md',
      to: 'output/site-b/snippets/warning.md',
    },
    {
      from: 'common:snippets/note.md',
      to: 'output/site-b/snippets/note.md',
    },
    // 从 docs2 同步 Site B 特定文档
    {
      from: 'docs2:README.md',
      to: 'output/site-b/README.md',
    },
    {
      from: 'docs2:tutorials/getting-started.md',
      to: 'output/site-b/tutorials/getting-started.md',
    },
    {
      from: 'docs2:examples/basic.md',
      to: 'output/site-b/examples/basic.md',
    },
  ],
});
