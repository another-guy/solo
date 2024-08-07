import * as fs from 'fs';
import chalk from 'chalk';
import { readdir } from 'fs/promises';
import * as path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { exportWorkspace, hasIncompleteConfig } from '../load-workspace';
import { never } from '../typescript';
import { CliOption, CliCommandMetadata, CliOptionsSet } from './cli-option';
import { commonOptions } from './common-options';
import { runManyAsyncCommand } from './command-run-many';
import { execAsync } from '../exec-promise';

const commandName = 'git-repo-stats';

const analyzeCommandOptions: CliOptionsSet = {
  profile: commonOptions.profile,
  configFilePath: commonOptions.configFilePath,
};

async function analyzeAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { profile, config: configFilePath } = str;
  const workspace = await exportWorkspace(configFilePath, executionContext);
  const { logger } = executionContext;

  console.log(chalk.green(`Analyzing ${JSON.stringify(str)}`));

  // const cmd = `git log | grep '^Author\: ' | cut -d ' ' -f 2-3 | sort | uniq -c | sort -rn`;

  const authorsResponse = await runManyAsyncCommand(
    {
      type: 'git',
      cmd: `git log | grep '^Author\: '`,
      config: configFilePath,
      profile,
      sequentially: true,
    },
    options,
  );

  const teamsJsonPath = `C:\\SourceCode\\solo\\src\\data\\teams.json`;
  const teamInfo = JSON.parse(fs.readFileSync(teamsJsonPath, 'utf8')) as TeamsJson;

  const normalizedAuthorResponse = teamInfo.normalizingReplacements.reduce(
    (result, { find, replaceWith }) => result.replace(find, replaceWith),
    authorsResponse,
  );
  fs.writeFileSync(`C:\\SourceCode\\temp\\authors.temp`, normalizedAuthorResponse);

  const otherResponse = await execAsync(`less /c/SourceCode/temp/authors.temp | cut -d ' ' -f 2-3 | sort | uniq -c | sort -rn`, { });

  // const cmd = ` | cut -d ' ' -f 2-3 | sort | uniq -c | sort -rn`;

  console.log(`Response ${otherResponse}`);
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Collect Git repository stats.`,
  options: analyzeCommandOptions,
  impl: analyzeAsyncCommand,
}

interface TeamsJson {
  normalizingReplacements: {
    find: string;
    replaceWith: string;
  }[];

  teamMappings: {
    [teamName: string]: {
      members: string[];
    };
  };
}