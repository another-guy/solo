import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import semver from 'semver';
import { combineComparators, createComparator, reverseComparator, sort } from '../algos/sort';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { renderTable } from '../cli/render-table';
import { execAsync, execAsyncFor, neverThrow } from '../exec-promise';
import { compareSeverity, NpmAuditResult, NpmAuditVulnerability, NpmLsDependency, NpmLsResponse, NpmOutatedPackageResult, NpmOutdatedResult, NpmViewResponse, PackageJson } from '../types';
import { CliCommandMetadata, CliOption, CliOptionsSet } from './cli-option';

const commandName = 'npm-audit';

const directoryOption: CliOption = {
  short: 'd',
  long: 'directory',
  codeName: 'directory',
  description: 'directory containing the package.json file.',
  exampleValue: '/c/SourceCode/app-mf-vendor',
  defaultValue: process.cwd(),
};

const omitOptions: CliOption = {
  short: 'o',
  long: 'omit',
  codeName: 'omit',
  description: 'omits packages by type (dev, optional, peer).',
  exampleValue: 'dev,optional,peer',
  defaultValue: process.cwd(),
};

const auditCommandOptions: CliOptionsSet = {
  directoryOption,
  omitOptions,
};

async function npmAuditAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { directory, omit } = str;
  const { logger } = executionContext;

  logger.verbose(`Analyzing the directory: ${directory}. Omitting packages: ${omit}`);

  const packageJsonPath = join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logger.error(`package.json not found in the directory: ${directory}`);
    return;
  } else {
    logger.verbose(`Found package.json at: ${packageJsonPath}`);
  }

  const config = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  const { dependencies, devDependencies } = config;

  try {
    if (!fs.existsSync(join(directory, 'node_modules'))) {
      // For some npm commands the packages need to actually be installed.
      logger.verbose('Running npm install');
      const _ = await execAsync('npm install', { cwd: directory });
    } else {
      logger.verbose('node_modules found.');
    }

    const npmOutdatedResult = await execAsyncFor<NpmOutdatedResult>(`npm outdated --json`, { cwd: directory });

    const omitFilter = omit ? (omit + '').split(',').map(o => `--omit ${o}`).join(' ') : '';
    const npmAuditResult = await execAsyncFor<NpmAuditResult>(`npm audit --json  ${omitFilter}`, { cwd: directory, throwOnCode: neverThrow });
    logger.verbose(JSON.stringify(npmAuditResult, null, 2));

    const vulnerablePackages = Object.values(npmAuditResult.vulnerabilities);

    const indirectPackageLs = (
      await Promise.all(
        vulnerablePackages.map(async p => {
          const npmLsResponse = await execAsyncFor<NpmLsResponse>(`npm ls ${p.name} --json`, { cwd: directory })
          return [p.name, npmLsResponse] as const;
        }),
      )
    )
      .reduce(
        (result, [packageName, npmLsResponse]) => {
          result[packageName] = npmLsResponse;
          return result;
        },
        {} as { [packageName: string]: NpmLsResponse },
      )

    const repoDetails =
      (
        await Promise.all(
          vulnerablePackages.map(p => execAsyncFor<NpmViewResponse>(`npm view ${p.name} --json`)),
        )
      )
        .reduce(
          (result, npmViewResponse) => {
            result[npmViewResponse.name] = npmViewResponse;
            return result;
          },
          {} as { [packageName: string]: NpmViewResponse },
        );

    const byTypeDesc =
      (a: ExtendedNpmVulnerability, b: ExtendedNpmVulnerability) =>
        reverseComparator(
          createComparator(vulnerabilityTypes)
        )
          (a.dependencyType, b.dependencyType);

    const bySeverityDesc =
      (a: ExtendedNpmVulnerability, b: ExtendedNpmVulnerability) =>
        reverseComparator(
          compareSeverity
        )(a.severity, b.severity);
    const comparator = combineComparators(byTypeDesc, bySeverityDesc);

    const allDependencies =
      sort(
        vulnerablePackages
          .reduce(
            (result, vulnerability) => {
              const dependencyType =
                devDependencies.hasOwnProperty(vulnerability.name) ? 'dev' :
                  dependencies.hasOwnProperty(vulnerability.name) ? 'prod' :
                    '—';

              const version =
                dependencyType === 'dev' ? devDependencies[vulnerability.name] :
                  dependencyType === 'prod' ? dependencies[vulnerability.name] :
                    '——————';

              result.push({
                ...vulnerability,
                dependencyType,
                packageJsonVersion: version,
                versions: npmOutdatedResult[vulnerability.name],
              });
              return result;
            },
            [] as ExtendedNpmVulnerability[],
          ),
        comparator,
      );

    const packageNameMaxLength = Object
      .values(npmAuditResult.vulnerabilities)
      .reduce((result, vulnerability) => Math.max(result, vulnerability.name.length), 0);

    console.log(renderTable(
      [
        {
          title: 'package',
          selector: v => v.name + '\n' + guessGithubUrl(repoDetails[v.name]),
          width: Math.max(packageNameMaxLength + 2, 60),
        },
        {
          title: 'dev/prod',
          selector: v => dependencyTypeColors[v.dependencyType](v.dependencyType),
          width: 10,
        },
        {
          title: 'severity',
          selector: v => severityColors[v.severity](v.severity),
          width: 12,
        },
        {
          title: 'versions',
          selector: v => v.isDirect ? formatVersions(v) : '——————————————————————',
          width: 30,
        },
        {
          title: 'vulnerable range',
          selector: v => v.range,
          width: 50,
        },
        {
          title: 'dependency tree',
          selector: v => v.isDirect ? '<direct>' : formatIndirect(dependencies, devDependencies, indirectPackageLs[v.name]),
          width: 60,
        },
      ],
      allDependencies,
    ));
  } catch (error) {
    logger.error(error);
  }
};

const dependencyTypeColors = {
  dev: chalk.red,
  prod: chalk.yellow,
  '—': chalk.white,
};

const severityColors = {
  none: chalk.white,
  info: chalk.green,
  low: chalk.yellow,
  moderate: chalk.yellow,
  high: chalk.red,
  critical: chalk.magenta,
};

function formatIndirect(
  deps: {
    [packageName: string]: string;
  },
  devDeps: {
    [packageName: string]: string;
  },
  result?: NpmLsResponse,
): string {
  if (!result) return '[bad npm ls response]';
  if (!result.dependencies) return '—';

  const lines: string[] = [];
  traverse(result.dependencies);
  return lines.join('\n');

  function traverse(dependencies: { [p: string]: NpmLsDependency }, level: number = 0): void {
    Object.entries(dependencies).forEach(([name, npmLsDependency]) => {

      const kind =
        level !== 0 ? 'indirect' :
          deps.hasOwnProperty(name) ? 'prod' :
            devDeps.hasOwnProperty(name) ? 'dev' :
              'other';

      const color =
        kind === 'prod' ? chalk.red :
          kind === 'dev' ? chalk.yellow :
            chalk.gray;

      lines.push(color(indent(name, level, kind)));
      if (npmLsDependency.dependencies)
        traverse(npmLsDependency.dependencies, level + 1);
    });
  }

  function indent(s: string, level: number, kind: 'dev' | 'prod' | 'indirect' | 'other'): string {
    const offset = 2;
    if (level === 0)
      return `[${kind}] ` + ' '.repeat(level * offset) + s;
    return ' '.repeat(level * offset) + s;
  }
}

function formatVersions(v: ExtendedNpmVulnerability): string {
  const distance = v.versions && semver.diff(v.versions.current, v.versions.latest);
  const semverDiffColor = // Ignoring: premajor preminor prepatch prerelease.
    distance === 'patch' ? chalk.green :
      distance === 'minor' ? chalk.yellow :
        distance === 'major' ? chalk.red :
          chalk.white;

  const cellSubtable = [
    ['package.json: ', `${v.packageJsonVersion}`, chalk.white],
    ['current: ', `${v.versions?.current}`, semverDiffColor],
    ['wanted: ', `${v.versions?.wanted}`, chalk.white],
    ['latest: ', `${v.versions?.latest}`, chalk.green],
  ] as const;

  const desiredWidth = cellSubtable.reduce((max, [a, b, _color]) => Math.max(max, a.length + b.length + 1), 0);

  return cellSubtable
    .map(([a, b, color]) => {
      const padding = ' '.repeat(desiredWidth - a.length - b.length);
      return `${a}${padding}${color(b)}`;
    })
    .join('\n');
}

function guessGithubUrl(nvmViewResponse?: NpmViewResponse): string {
  const url = nvmViewResponse?.repository?.url || '';
  const marker = 'github.com/';
  const suffix = '.git';
  const index = url.toLowerCase().indexOf(marker);
  if (index < 0) return '—';

  const relativeRouteWithSuffix = url.substring(index + marker.length);
  const urlCandidate = `https://${marker}${relativeRouteWithSuffix}`;
  return urlCandidate.endsWith(suffix) ? urlCandidate.substring(0, urlCandidate.length - suffix.length) : urlCandidate;
}

function join(...paths: string[]): string {
  const p = path.join(...paths);
  return p.charAt(p.length - 1) === path.sep ? p.slice(0, -1) : p;
}

type ExtendedNpmVulnerability =
  NpmAuditVulnerability &
  {
    dependencyType: '—' | 'dev' | 'prod',
    packageJsonVersion: string,
    versions?: NpmOutatedPackageResult,
  };

const vulnerabilityTypes = ['—', 'dev', 'prod'];

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Audit NPM packages.`,
  options: auditCommandOptions,
  impl: npmAuditAsyncCommand,
}
