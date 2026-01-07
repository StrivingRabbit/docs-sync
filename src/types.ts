export type Source = {
  repo: string;
  branch: string;
};

export type Mapping = {
  from: string;
  to: string;
};

export type DocsSyncConfig = {
  site: string;
  cacheDir: string;
  sources: Record<string, Source>;
  mappings: Mapping[];
  dryRun?: boolean;
};