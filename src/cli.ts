import chalk from 'chalk';
import { Command } from 'commander';
import { allCommands } from './commands';
import { CliCommandMetadata, createCommandExample, describeCliOption } from './commands/cli-option';

export function createCli(): Command {
  const program = new Command();

  program
    .name(`solo`)
    .description(`CLI tool by Igor Soloydenko for automating routine processes.`)
    .option(`--verbose`, `Provide verbose output.`)
    .version(`0.0.1`);

  // // TODO: learn about subcommands: https://github.com/tj/commander.js?tab=readme-ov-file#typescript
  // let adoCommands = program
  //   .command('ado')
  //   .description('Azure DevOps commands.')
  //   .addHelpText('after', '........')
  //   .action(() => { console.log('ado !!!!!!!!!!!!!'); });
  // adoCommands
  //   .command('lizt')
  //   .description('XXX List deployments in ADO project.')
  //   .addHelpText('after', '........')
  //   .action(() => { console.log('list-deploys !!!!!!!!!!!!!'); });

  allCommands.forEach((command) => registerCommand(program, command));

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

function registerCommand(programCommand: Command, commandMetadata: CliCommandMetadata) {
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
    .action((...args: [str: any, options: any]) => {
      commandMetadata.impl.apply(null, args);
    });

  function formatExample(...lines: string[]): string {
    return `
Example:
${lines.join('\n')}
`;
  }
}
