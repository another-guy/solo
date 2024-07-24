import { exec } from 'child_process';
import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { exportWorkspace } from '../load-workspace';
import { ProjectDef } from '../types';
import { never } from '../typescript/never';
import { CliOption, CliCommandMetadata } from './cli-option';
import { commonOptions } from './common-options';

type CommandType = 'dir' | 'git' | 'npm' | 'dotnet';

const commandName = `run-many`;

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

const runManyCommandOptions = {
  profile: commonOptions.profile,
  configFilePath: commonOptions.configFilePath,
  commandType,
  cmd,
};

async function runManyAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { profile: profileName, config: configFilePath, type: commandTypeRaw, cmd } = str;
  const commandType = commandTypeRaw as CommandType | undefined;
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

  const filteredProjects = workspace.projects.filter(p => projectProfileFilterFn(p) && projectFilterFn(p));
  logger.logHighlight(`Running command "${cmd}" in ${filteredProjects.length} projects.`);
  filteredProjects.forEach((projectDef) => {
    const subDir =
      commandType === 'dir' || commandType === 'git' ? projectDef.gitDir :
        commandType === 'npm' ? projectDef.projectDir :
          commandType === 'dotnet' ? projectDef.projectDir :
            never();

    const dir = path.join(workspace.root, subDir);

    // TODO: use execAsync
    exec(`cd ${dir} && ${cmd}`, (error, stdout, stderr) => {
      logger.verbose(`Executing command "${cmd}" in "${dir}"`)
      if (error) {
        logger.error(`${dir}\n${error}`);
      } else {
        logger.log(`${dir}\n${stdout}`);
      }
    });
  });
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `run a command against multiple projects.`,
  options: runManyCommandOptions,
  impl: runManyAsyncCommand,
}
