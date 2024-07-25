import { createComparator } from './algos/sort';

// TODO: split by service / tool

export interface WorkspaceDef {
  root: string;
  projectProfiles: { [profile: string]: ProjectDef['gitDir'][] };
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

export interface PackageJson {
  name: string,
  version: SemVerString,
  description: string,
  main: string,
  scripts: { [_: string]: string },
  author: string,
  license: string,
  dependencies: { [name: string]: SemVerString };
  devDependencies: { [name: string]: SemVerString };
}

export type SemVerString = string;

export interface NpmAuditResult {
  auditReportVersion: number;
  vulnerabilities: {
    [packageName: string]: NpmAuditVulnerability;
  };
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    },
    dependencies: {
      prod: number;
      dev: number;
      optional: number;
      peer: number;
      peerOptional: number;
      total: number;
    }
  };
}

export interface NpmAuditVulnerability {
  name: string;
  severity: 'none' | 'info' | 'low' | 'moderate' | 'high' | 'critical';
  isDirect: boolean;
  via: string[] | { source: number, name: string, dependency: string, title: string, url: string, severity: string, cwe: string[], cvss: { score: number, vectorString: string | null }, range: string }[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean | { name: string, version: string, isSemVerMajor: boolean };
}

export const compareSeverity = createComparator(['none', 'info', 'low', 'moderate', 'high', 'critical']);

export interface NpmOutdatedResult {
  [packageName: string]: NpmOutatedPackageResult;
}

export interface NpmOutatedPackageResult {
  current: SemVerString;
  wanted: SemVerString;
  latest: SemVerString;
  dependent: string;
  location: string;
}
