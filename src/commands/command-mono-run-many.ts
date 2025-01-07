import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { execAsync, nonZeroCode } from '../exec-promise';
import { exportWorkspace } from '../load-workspace';
import { ProjectDef } from '../types';
import { never } from '../typescript/never';
import { CliCommandMetadata, CliCommandPolyResult, CliOption } from './cli-option';
import { commonOptions } from './common-options';

type CommandType = 'dir' | 'git' | 'npm' | 'dotnet';

const commandName = `mono-run-many`;

const commandType: CliOption = {
  short: 't',
  long: `type`,
  codeName: `commandType`,
  description: `command type. One of: "dir", "git", "npm", "dotnet".`,
  exampleValue: `git`,
};

const cmd: CliOption = {
  long: `cmd`,
  codeName: `command`,
  description: `the command to run.`,
  exampleValue: `"git branch --show-current"`,
};

const sequentially: CliOption = {
  short: 's',
  long: `sequentially`,
  codeName: `sequentially`,
  description: `run commands sequentially instead of parallel.`,
  exampleValue: `true`,
};

const quiet: CliOption = {
  short: 'q',
  long: `quiet`,
  codeName: `quiet`,
  description: `suppress output.`,
  exampleValue: `true`,
};

const statusCodes: CliOption = {
  short: 'sc',
  long: `status-codes`,
  codeName: `statusCodes`,
  description: `status codes to consider as success (othan than 0).`,
  exampleValue: `1,2,3`,
};

const runManyCommandOptions = {
  profile: commonOptions.profile,
  configFilePath: commonOptions.configFilePath,
  commandType,
  cmd,
  sequentially,
  quiet,
  statusCodes,
};

interface StrParams {
  profile: string;
  config: string;
  type: CommandType | undefined;
  cmd: string;
  sequentially: boolean;
  quiet: boolean;
  statusCodes?: string;
}

export async function monoRunManyAsyncCommand(this: any, str: StrParams, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { profile: profileName, config: configFilePath, type: commandTypeRaw, cmd, sequentially, quiet, statusCodes } = str;
  const commandType = commandTypeRaw;
  const workspace = await exportWorkspace(configFilePath, executionContext);
  const { logger } = executionContext;

  logger.verbose(JSON.stringify({ configFilePath, commandType, cmd }));

  const projectProfileFilterFn = profileName ?
    (projectDef: ProjectDef) => workspace.projectProfiles[profileName].includes(projectDef.gitDir) :
    () => true;
  const projectFilterFn = commandType ?
    (projectDef: ProjectDef) => {
      return (commandType === 'dir' || commandType === 'git') ||
        (commandType === 'npm' && projectDef.type === 'node-web') ||
        (commandType === 'dotnet' && projectDef.type === 'dotnet');
    } :
    () => true;

  let collectedOutputs: CliCommandPolyResult = {};

  const filteredProjects = workspace.projects.filter(p => projectProfileFilterFn(p) && projectFilterFn(p));
  logger.logHighlight(`Running command "${cmd}" in ${filteredProjects.length} projects` + (filteredProjects ? ` (${filteredProjects.map(p => p.gitDir).join(', ')})` : ''));
  const commandPromises = filteredProjects.map(async (projectDef) => {
    const subDir =
      commandType === 'dir' || commandType === 'git' ? projectDef.gitDir :
        commandType === 'npm' ? projectDef.projectDir :
          commandType === 'dotnet' ? projectDef.projectDir :
            never();

    const dir = path.join(workspace.root, subDir);

    try {
      logger.verbose(`Executing command "${cmd}" in "${dir}"`)

      const throwOnCode = statusCodes ?
        (code: number) => !statusCodes.split(',').map(Number).includes(code) :
        nonZeroCode;
      let stdout = await execAsync(cmd, { cwd: dir, throwOnCode: throwOnCode });
      if (stdout[stdout.length - 1] === '\n')
        stdout = stdout.slice(0, stdout.length - 1);

      const text = `${dir}\n${stdout}`;
      if (!quiet)
        logger.log(text);

      collectedOutputs[dir] = { hasError: false, output: stdout };
    } catch (error) {
      const text = `${dir}\n${error}`;
      if (!quiet)
        logger.error(text);

      collectedOutputs[dir] = { hasError: true, output: error + '' };
    }
  });

  if (sequentially) {
    for (let i = 0; i < commandPromises.length; i++)
      await commandPromises[i];
    return collectedOutputs;
  } else {
    await Promise.allSettled(commandPromises);
    return collectedOutputs;
  }
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Run a command against multiple projects.`,
  options: runManyCommandOptions,
  impl: monoRunManyAsyncCommand,
}
