export type Source = {
  repo: string;
  branch?: string; // Optional for local paths
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