import * as path from 'path';
import { Command } from 'commander';
import { exportWorkspace, hasIncompleteConfig } from './load-workspace';
import { exec } from 'child_process';
import chalk from 'chalk';
import { AdoListRepositoriesResponse, ProjectDef } from './types';
import { readdir } from 'fs/promises';
import axios, { AxiosResponse } from 'axios';

type CommandType = 'dir' | 'git' | 'npm' | 'dotnet';

function join(...paths: string[]): string {
  const p = path.join(...paths);
  return p.charAt(p.length - 1) === path.sep ? p.slice(0, -1) : p;
}

function nameSort(a: string, b: string): number {
  return a.localeCompare(b);
}

export function createCli(): Command {
  const program = new Command();

  function provideExamples() {
    return `
Examples:
  $ npm start -- help
  $ npm start -- help run-many
  $ npm start -- run-many -c /c/SourceCode/fakemono.json -t git --cmd "git pull" --verbose
  $ npm start -- analyze  -c /c/SourceCode/fakemono.json -d /c/SourceCode --verbose
  $ npm start -- list-remote-repos -l isoloydenko@ah4r.com -t <TOKEN> | grep https
`;
  }

  program
    .name('fakemono')
    .description('A fake monorepo manager.')
    .addHelpText('after', provideExamples())
    .option('--verbose', 'Provide verbose output.')
    .option('--utc', 'TODO: Use UTC timestamps.') // TODO: Implement non-UTC timestamps!
    .version('0.0.1');

  program
    .command('list-remote-repos')
    .description('List remote repositories in ADO project.')
    .option('-o, --organization <organization>', 'ADO organization name.')
    .option('-p, --project <project>', 'ADO project name.')
    .option('-l, --login <login>', 'ADO login.')
    .option('-t, --token <token>', 'ADO personal access token.')
    .action(async function (this: any, str, options) {
      const executionContext = createExecutionContext(parseCommonOptions(options));
      const { organization, project, login, token } = str;
      const { logger } = executionContext;

      const org = organization || 'americanhomes4rent';
      const proj = project || 'oculos';
      const listRepositoriesResponse = await axios.get<{}, AxiosResponse<AdoListRepositoriesResponse>>(`https://dev.azure.com/${org}/${proj}/_apis/git/repositories`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
        },
      });

      if (listRepositoriesResponse.status < 200 && listRepositoriesResponse.status >= 300)
        throw new Error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);

      listRepositoriesResponse.data.value.forEach((repo) => {
        console.log(repo.remoteUrl);
      });
    });

  program
    .command('analyze')
    .description('Analyze the workspace.')
    .option('-d, --directory <directory>', 'directory to analyze as the monorepo.')
    .option('-c, --config <configFilePath>', 'path to the fakemono.json config file.')
    .action(async function (this: any, str, options) {
      const executionContext = createExecutionContext(parseCommonOptions(options));
      const { directory, config: configFilePath } = str;
      const workspace = await exportWorkspace(configFilePath, executionContext);
      const { logger } = executionContext;

      const subdirectoriesFound =
        (await readdir(directory, { withFileTypes: true }))
          .filter((x) => x.isDirectory()).map((x) => join(directory, x.name))
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
    });

  program
    .command('run-many')
    .description('run a command against multiple projects.')
    .option('-c, --config <configFilePath>', 'path to the fakemono.json config file.')
    .option('-t, --type <commandType>', 'command type. One of: "dir", "git", "npm", "dotnet".')
    .option('--cmd <command>', 'the command to run.')
    .action(async function (this: any, str, options) {
      const executionContext = createExecutionContext(parseCommonOptions(options));
      const { config: configFilePath, type: commandTypeRaw, cmd } = str;
      const commandType = commandTypeRaw as CommandType | undefined;
      const workspace = await exportWorkspace(configFilePath, executionContext);
      const { logger } = executionContext;

      logger.verbose(JSON.stringify({ configFilePath, commandType, cmd }));

      const projectFilterFn = commandType ?
        (projectDef: ProjectDef) => {
          return (commandType === 'dir' || commandType === 'git') ||
            (commandType === 'npm' && projectDef.type === 'node-web') ||
            (commandType === 'dotnet' && projectDef.type === 'dotnet');
        } :
        () => true;

      const filteredProjects = workspace.projects.filter(projectFilterFn);
      logger.logHighlight(`Running command "${cmd}" in ${filteredProjects.length} projects.`);
      filteredProjects.forEach((projectDef) => {
        const subDir =
          commandType === 'dir' || commandType === 'git' ? projectDef.gitDir :
            commandType === 'npm' ? projectDef.projectDir :
              commandType === 'dotnet' ? projectDef.projectDir :
                never();

        const dir = path.join(workspace.root, subDir);


        exec(`cd ${dir} && ${cmd}`, (error, stdout, stderr) => {
          logger.verbose(`Executing command "${cmd}" in "${dir}"`)
          if (error) {
            logger.error(`${dir}\n${error}`);
          } else {
            logger.log(`${dir}\n${stdout}`);
          }
        });
      });
    });

  return program;
}

export type CommonOptions = ReturnType<typeof parseCommonOptions>;

export function parseCommonOptions(options: any) {
  const { verbose, utc } = options.parent.opts();
  return { verbose, utc };
}

export interface ExecutionContext {
  verbose: boolean;
  logger: Logger;
}

export function createExecutionContext(options: CommonOptions): ExecutionContext {
  return {
    verbose: options.verbose,
    logger: logger(options),
  };
}

export type Logger = ReturnType<typeof logger>;

export function logger(options: CommonOptions) {
  function timestamp(): string {
    return new Date().toISOString();
  }

  const myLog = (
    colorFn: (input: string) => string,
    level: 'ERROR' | 'WARN' | 'INFO' | 'VERBOSE' | 'TRACE' | 'DEBUG' | 'LOG',
    ...input: unknown[]
  ) => {
    const [first, ...rest] = input;
    console.log(colorFn(timestamp()), colorFn(level), colorFn(first as string), colorFn(rest.join(' ')));
  };

  return {
    error: (...input: unknown[]) => myLog(chalk.red, 'ERROR', ...input), // console.log(chalk.red(timestamp(), '[ERROR]', ...input))
    warn: (...input: unknown[]) => myLog(chalk.yellow, 'WARN', ...input), // console.log(chalk.yellow(timestamp(), '[WARN]', ...input))
    logHighlight: (...input: unknown[]) => myLog(chalk.green, 'LOG', ...input), // console.log(chalk.green(timestamp(), '[INFO]', ...input))
    log: (...input: unknown[]) => myLog(chalk.white, 'LOG', ...input), // console.log(chalk.white(timestamp(), '[INFO]', ...input))
    verbose: options.verbose ? (...input: unknown[]) => myLog(chalk.gray, 'VERBOSE', ...input) : () => {}, //, ...input){ if (options.verbose) , // console.log(chalk.gray(timestamp(), '[VERBOSE]', ...input)) }
    trace: (...input: unknown[]) => myLog(chalk.magenta, 'TRACE', ...input), // console.log(chalk.magenta(timestamp(), '[TRACE]', ...input))
    debug: (...input: unknown[]) => myLog(chalk.magenta, 'DEBUG', ...input), // console.log(chalk.magenta(timestamp(), '[DEBUG]', ...input))
  };
}

export function never(): never {
  throw new Error('Never reached');
}
