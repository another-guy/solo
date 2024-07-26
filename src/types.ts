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
  dependencies: { [packageName: string]: SemVerString };
  devDependencies: { [packageName: string]: SemVerString };
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

export interface NpmViewResponse {
  _id: string;
  _rev: string;
  name: string;
  'dist-tags': { [tag: VersionTag]: SemVerString };
  versions: SemVerString[];
  time: { [version: VersionTag | SemVerString]: string };
  bugs: { url: string };
  author: string;
  license: string;
  homepage: string;
  keywords: string[];
  repository: { url: string, type: string };
  description: string;
  contributors: string[];
  maintainers: string[];
  readmeFilename: string;
  users: { [userId: string]: boolean };
  _contentLength: number;
  version: SemVerString;
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
    fileCount: number;
    unpackedSize: number;
    signatures: { sig: string, keyid: string }[];
    attestations: { url: string, provenance: { predicateType: string } };
  };
  main: string;
  type: string;
  types: string | string[];
  unpkg: string;
  browser: $TODO;
  exports: $TODO;
  gitHead: string;
  scripts: { [scriptName: string]: string };
  typings: string;
  _npmUser: string;
  jsdelivr: string;
  bundlesize: $TODO;
  commitlint: $TODO;
  'release-it': $TODO;
  _npmVersion: SemVerString;
  directories: $TODO;
  sideEffects: boolean;
  _nodeVersion: SemVerString;
  dependencies: { [packageName: string]: SemVerString };
  _hasShrinkwrap: boolean;
  devDependencies: { [packageName: string]: SemVerString };
  _npmOperationalInternal: $TODO;
}

type $TODO = any;

type VersionTag = string;

export interface NpmLsResponse {
  name: string;
  version: SemVerString;
  dependencies?: { [packageName: string]: NpmLsDependency };
}

export interface NpmLsDependency {
  version: SemVerString;
  resolved: string;
  overriden: boolean;
  dependencies?: { [packageName: string]: NpmLsDependency };
}
