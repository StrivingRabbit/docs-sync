import { defineConfig } from './src/config';

export default defineConfig({
  site: 'site-a',

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
      to: 'output/site-a/guides/install.md',
    },
    {
      from: 'common:guides/quickstart.md',
      to: 'output/site-a/guides/quickstart.md',
    },
    {
      from: 'common:snippets/warning.md',
      to: 'output/site-a/snippets/warning.md',
    },
    {
      from: 'common:snippets/note.md',
      to: 'output/site-a/snippets/note.md',
    },
    // 从 docs1 同步 Site A 特定文档
    {
      from: 'docs1:README.md',
      to: 'output/site-a/README.md',
    },
    {
      from: 'docs1:features/overview.md',
      to: 'output/site-a/features/overview.md',
    },
    {
      from: 'docs1:api/reference.md',
      to: 'output/site-a/api/reference.md',
    },
  ],
});
