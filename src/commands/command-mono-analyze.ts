
import chalk from 'chalk';
import { readdir } from 'fs/promises';
import * as path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { exportWorkspace, hasIssuesInConfig, ConfigIssues } from '../load-workspace';
import { never } from '../typescript';
import { CliOption, CliCommandMetadata, CliOptionsSet } from './cli-option';
import { commonOptions } from './common-options';
import { renderTable } from '../cli/render-table';
import { createComparator } from '../algos/sort';

const commandName = 'mono-analyze';

const directoryOption: CliOption = {
  short: 'd',
  long: 'directory',
  codeName: 'directory',
  description: 'directory to analyze as the monorepo.',
  exampleValue: '/c/SourceCode/mono',
  defaultValue: process.cwd(),
};

const analyzeCommandOptions: CliOptionsSet = {
  configFilePath: commonOptions.configFilePath,
  directoryOption,
};

async function monoAnalyzeAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { directory, config: configFilePath } = str;
  const workspace = await exportWorkspace(configFilePath, executionContext);
  const { logger } = executionContext;

  const subdirectoriesFound =
    (await readdir(directory, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => join(directory, dirent.name))
      .sort(nameSort);
  logger.verbose('Subdirectories found:');
  subdirectoriesFound.forEach((subDir) => {
    logger.verbose(subDir);
  });

  const incompleteConfigDirs: Map<string, ConfigIssues> = new Map();
  const declaredGitDirs =
    workspace.projects
      .map((projectDef) => {
        const projectDir = join(workspace.root, projectDef.gitDir);
        const configIssues = hasIssuesInConfig(projectDef);
        if (configIssues)
          incompleteConfigDirs.set(projectDir, configIssues);
        return projectDir;
      })
      .sort(nameSort);
  // incompleteConfigDirs.sort(nameSort);

  logger.verbose('Declared project directories:');
  declaredGitDirs.forEach((gitDir) => {
    logger.verbose(gitDir);
  });

  const ignoreDirs = workspace.ignoreDirs.map((dir) => join(workspace.root, dir));
  logger.verbose('Ignored directories:');
  ignoreDirs.forEach((dir) => {
    logger.verbose(dir);
  });

  const allDirs = Array.from(new Set([...subdirectoriesFound, ...declaredGitDirs]));

  const rows: Row[] = allDirs.map((dir) => {
    const isDeclared = declaredGitDirs.includes(dir);
    const isFound = subdirectoriesFound.includes(dir);
    const isIgnored = ignoreDirs.includes(dir);
    const configIssues = incompleteConfigDirs.get(dir);

    const [status, text] =
      isFound && isIgnored ? ['IGNORED', undefined] as const :
        isFound && isDeclared && configIssues ? ['MISCONFIGURED', configIssues] as const :
          isFound && isDeclared ? ['READY', undefined] as const :
            isFound && !isDeclared ? ['UNREGISTERED', undefined] as const :
              !isFound && isDeclared ? ['MISSING', undefined] as const :
                [never(), never()] as const;

    const statusColor = {
      READY: chalk.greenBright,
      IGNORED: chalk.gray,
      MISCONFIGURED: chalk.yellowBright,
      UNREGISTERED: chalk.red,
      MISSING: chalk.yellow,
    }[status];

    // logger.log(statusColor(status + (text ? ` ${text}` : '')), dir);
    return {
      dir,
      statusColor,
      status,
      configIssues,
    };
  });

  const compareStatus = createComparator(['MISSING', 'UNREGISTERED', 'MISCONFIGURED', 'IGNORED', 'READY']);
  const sortedRows = rows.sort((row1, row2) => compareStatus(row1.status, row2.status));

  console.log(
    renderTable<Row>(
      [
        {
          title: 'Directory',
          width: 'max',
          selector: (row) => row.statusColor(row.dir),
        },
        {
          title: 'Status',
          width: 'max',
          selector: (row) => row.statusColor(row.status),
        },
        {
          title: 'Config Issues',
          width: 'max',
          selector: (row) =>
            row.configIssues ?
              Object.entries(row.configIssues).filter(([k, v]) => !!v).map(([k, v]) => k).join(', ') :
              '',
        },
      ],
      sortedRows,
    ),
  );
};

function join(...paths: string[]): string {
  const p = path.join(...paths);
  return p.charAt(p.length - 1) === path.sep ? p.slice(0, -1) : p;
}

function nameSort(a: string, b: string): number {
  return a.localeCompare(b);
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Analyze the workspace.`,
  options: analyzeCommandOptions,
  impl: monoAnalyzeAsyncCommand,
}

interface Row {
  dir: string;
  statusColor: chalk.Chalk;
  status: 'IGNORED' | 'MISCONFIGURED' | 'READY' | 'UNREGISTERED' | 'MISSING';
  configIssues: ConfigIssues | undefined;
}
