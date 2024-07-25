import * as fs from 'fs';
import * as path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { execAsyncFor, neverThrow } from '../exec-promise';
import { compareSeverity, NpmAuditResult, NpmAuditVulnerability, NpmOutatedPackageResult, NpmOutdatedResult, PackageJson } from '../types';
import { CliCommandMetadata, CliOption, CliOptionsSet } from './cli-option';
import { sort, reverseComparator, createComparator, combineComparators, compareBooleans } from '../algos/sort';
import { renderTable } from '../cli/render-table';

const commandName = 'audit-npm';

const directoryOption: CliOption = {
  short: 'd',
  long: 'directory',
  codeName: 'directory',
  description: 'directory containing the package.json file.',
  exampleValue: '/c/SourceCode/app-mf-vendor',
  defaultValue: process.cwd(),
};

const auditCommandOptions: CliOptionsSet = {
  directoryOption,
};

async function auditAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { directory } = str;
  const { logger } = executionContext;

  logger.log(`Analyzing the directory: ${directory}`);

  const packageJsonPath = join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logger.error(`package.json not found in the directory: ${directory}`);
    return;
  } else {
    logger.log(`Found package.json at: ${packageJsonPath}`);
  }

  const config = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  const { dependencies, devDependencies } = config;

  try {
    const npmOutdatedResult = await execAsyncFor<NpmOutdatedResult>("npm outdated --json", { cwd: directory });

    const npmAuditResult = await execAsyncFor<NpmAuditResult>("npm audit --json", { cwd: directory, throwOnCode: neverThrow });
    logger.verbose(JSON.stringify(npmAuditResult, null, 2));

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
        Object
          .values(npmAuditResult.vulnerabilities)
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
          title: 'package name',
          selector: v => v.name,
          width: (packageNameMaxLength + 2) || 15,
        },
        {
          title: 'dep. kind',
          selector: v => v.isDirect ? 'direct' : 'transitive',
          width: 15,
        },
        {
          title: 'dev/prod',
          selector: v => v.dependencyType,
          width: 10,
        },
        {
          title: 'severity',
          selector: v => v.severity,
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
        }
      ],
      allDependencies,
    ));
  } catch (error) {
    logger.error(error);
  }
};

function formatVersions(v: ExtendedNpmVulnerability): string {
  const cellSubtable = [
    ['package.json: ', `${v.packageJsonVersion}`],
    ['current: ', `${v.versions?.current}`],
    ['wanted: ', `${v.versions?.wanted}`],
    ['latest: ', `${v.versions?.latest}`],
  ];

  const desiredWidth = cellSubtable.reduce((max, [a, b]) => Math.max(max, a.length + b.length + 1), 0);

  return cellSubtable
    .map(([a, b]) => {
      const padding = ' '.repeat(desiredWidth - a.length - b.length);
      return `${a}${padding}${b}`;
    })
    .join('\n');
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
  impl: auditAsyncCommand,
}
