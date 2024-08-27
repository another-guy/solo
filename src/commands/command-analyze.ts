
import chalk from 'chalk';
import { readdir } from 'fs/promises';
import * as path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { exportWorkspace, hasIncompleteConfig } from '../load-workspace';
import { never } from '../typescript';
import { CliOption, CliCommandMetadata, CliOptionsSet } from './cli-option';
import { commonOptions } from './common-options';

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

async function analyzeAsyncCommand(this: any, str: any, options: any) {
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

  const incompleteConfigDirs: string[] = [];
  const declaredGitDirs =
    workspace.projects
      .map((projectDef) => {
        const projectDir = join(workspace.root, projectDef.gitDir);
        if (hasIncompleteConfig(projectDef))
          incompleteConfigDirs.push(projectDir);
        return projectDir;
      })
      .sort(nameSort);
  incompleteConfigDirs.sort(nameSort);

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
  logger.log('All directories:');
  allDirs.forEach((dir) => {
    const isDeclared = declaredGitDirs.includes(dir);
    const isFound = subdirectoriesFound.includes(dir);
    const isIgnored = ignoreDirs.includes(dir);
    const isIncompleteConfig = incompleteConfigDirs.includes(dir);

    const status =
      isFound && isIgnored ? 'IGNORED' :
        isFound && isDeclared && isIncompleteConfig ? 'MISCONFIGURED' :
          isFound && isDeclared ? 'READY' :
            isFound && !isDeclared ? 'UNREGISTERED' :
              !isFound && isDeclared ? 'MISSING' :
                never();

    const statusColor = {
      READY: chalk.greenBright,
      IGNORED: chalk.gray,
      MISCONFIGURED: chalk.yellowBright,
      UNREGISTERED: chalk.red,
      MISSING: chalk.yellow,
    }[status];

    logger.log(statusColor(status), dir);
  });
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
  impl: analyzeAsyncCommand,
}
