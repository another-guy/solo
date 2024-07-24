import chalk from 'chalk';
import { Command } from 'commander';
import { readdir } from 'fs/promises';
import * as path from 'path';
import { allCommands } from './commands';
import { CommandMetadata, createCommandExample, describeCliOption } from './commands/cli-option';
import { exportWorkspace, hasIncompleteConfig } from './load-workspace';
import { never } from './typescript';

function join(...paths: string[]): string {
  const p = path.join(...paths);
  return p.charAt(p.length - 1) === path.sep ? p.slice(0, -1) : p;
}

function nameSort(a: string, b: string): number {
  return a.localeCompare(b);
}

export function createCli(): Command {
  const program = new Command();

  program
    .name(`fakemono`)
    .description(`Igor's AH4R CLI tool.`)
    .option(`--verbose`, `Provide verbose output.`)
    .version(`0.0.1`);

  allCommands.forEach((command) => registerCommand(program, command));

  // // TODO:
  // program
  //   .command('list-deployments')
  //   .description('List deployments in ADO project.')
  //   .option(...describeCliOption(commonAdoOptions.organization))
  //   .option(...describeCliOption(commonAdoOptions.project))
  //   .option(...describeCliOption(commonAdoOptions.login))
  //   .option(...describeCliOption(commonAdoOptions.token))
  //   .addHelpText('after', provideExamples('$ npm start -- list-remote-repos -l isoloydenko@ah4r.com -t <PERSONAL_ACCESS_TOKEN> | grep https'))
  //   .action(async function (this: any, str, options) {
  //     const executionContext = createExecutionContext(parseCommonOptions(options));
  //     const { organization, project, login, token } = str;
  //     const { logger } = executionContext;

  //     const org = organization || 'americanhomes4rent';
  //     const proj = project || 'oculos';
  //     const listReposResponse = await axios.get<{}, AxiosResponse<any>>(`https://vsrm.dev.azure.com/${org}/${proj}/_apis/release/deployments?api-version=7.1-preview.2`, {
  //       headers: {
  //         Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
  //       },
  //     });

  //     if (listReposResponse.status < 200 && listReposResponse.status >= 300)
  //       throw new Error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);

  //     console.log(listReposResponse.status + ' ' + listReposResponse.statusText);
  //     console.log(listReposResponse.data);
  //   });

  program
    .command('analyze')
    .description('Analyze the workspace.')
    .option('-d, --directory <directory>', 'directory to analyze as the monorepo.')
    .option('-c, --config <configFilePath>', 'path to the fakemono.json config file.')
    .addHelpText(
      'after',
      formatExample(
        '$ npm start -- analyze  -c /c/SourceCode/fakemono.json -d /c/SourceCode --verbose',
      ),
    )
    .action(async function (this: any, str, options) {
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
    });

  return program;
}

export type CommonOptions = ReturnType<typeof parseCommonOptions>;

export function parseCommonOptions(options: any) {
  const { verbose } = options.parent.opts();
  return { verbose };
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
    verbose: options.verbose ? (...input: unknown[]) => myLog(chalk.gray, 'VERBOSE', ...input) : () => { }, //, ...input){ if (options.verbose) , // console.log(chalk.gray(timestamp(), '[VERBOSE]', ...input)) }
    trace: (...input: unknown[]) => myLog(chalk.magenta, 'TRACE', ...input), // console.log(chalk.magenta(timestamp(), '[TRACE]', ...input))
    debug: (...input: unknown[]) => myLog(chalk.magenta, 'DEBUG', ...input), // console.log(chalk.magenta(timestamp(), '[DEBUG]', ...input))
  };
}

function registerCommand(programCommand: Command, commandMetadata: CommandMetadata) {
  let command = programCommand
    .command(commandMetadata.name)
    .description(commandMetadata.description);

  command = Object
    .values(commandMetadata.options)
    .reduce(
      (command, option) => command.option(...describeCliOption(option)),
      command,
    );
  
  command
    .addHelpText('after', formatExample(createCommandExample(commandMetadata)))
    .action(commandMetadata.impl);
}

function formatExample(...lines: string[]): string {
  return `
Example:
${lines.join('\n')}
`;
}
