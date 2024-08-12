import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { execAsync, nonZeroCode } from '../exec-promise';
import { exportWorkspace } from '../load-workspace';
import { ProjectDef } from '../types';
import { never } from '../typescript/never';
import { CliCommandMetadata, CliOption } from './cli-option';
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
  exampleValue: `"git pull"`,
};

const sequentially: CliOption = {
  short: 's',
  long: `sequentially`,
  codeName: `sequentially`,
  description: `run commands sequentially instead of parallel.`,
  exampleValue: `true`,
};

const runManyCommandOptions = {
  profile: commonOptions.profile,
  configFilePath: commonOptions.configFilePath,
  commandType,
  cmd,
  sequentially,
};

interface StrParams {
  profile: string;
  config: string;
  type: CommandType | undefined;
  cmd: string;
  sequentially: boolean;
}

export async function runManyAsyncCommand(this: any, str: StrParams, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { profile: profileName, config: configFilePath, type: commandTypeRaw, cmd, sequentially } = str;
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

  let collectedOutputs = '';

  const filteredProjects = workspace.projects.filter(p => projectProfileFilterFn(p) && projectFilterFn(p));
  logger.logHighlight(`Running command "${cmd}" in ${filteredProjects.length} projects.`);
  const commandPromises = filteredProjects.map(async (projectDef) => {
    const subDir =
      commandType === 'dir' || commandType === 'git' ? projectDef.gitDir :
        commandType === 'npm' ? projectDef.projectDir :
          commandType === 'dotnet' ? projectDef.projectDir :
            never();

    const dir = path.join(workspace.root, subDir);

    try {
      logger.verbose(`Executing command "${cmd}" in "${dir}"`)
      const stdout = await execAsync(cmd, { cwd: dir, throwOnCode: nonZeroCode });

      const text = `${dir}\n${stdout}`;
      logger.log(text);
      collectedOutputs += text;
    } catch (error) {
      const text = `${dir}\n${error}`;
      logger.error(text);
      collectedOutputs += text;
    }
  });

  if (sequentially) {
    for (let i = 0; i < commandPromises.length; i++)
      await commandPromises[i];
  } else {
    await Promise.allSettled(commandPromises);
  }

  return collectedOutputs;
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Run a command against multiple projects.`,
  options: runManyCommandOptions,
  impl: runManyAsyncCommand,
}
