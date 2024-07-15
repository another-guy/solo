export interface WorkspaceDef {
  root: string;
  projects: ProjectDef[];
  ignoreDirs: string[];
}

export interface ProjectDef {
  type: 'dotnet' | 'node-web',
  gitDir: string;
  projectDir: string;
  projectFile: string;
}

export interface AdoListRepositoriesResponse {
  value: AdoRepository[];
}

export interface AdoRepository {
  id: string;
  name: string;
  url: string;
  project: {
    id: string;
    name: string;
    url: string;
  };
  defaultBranch: string;
  remoteUrl: string;
  sshUrl: string;
}
