import { ProjectDef, WorkspaceDef } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { execAsync, nonZeroCode } from '../exec-promise';
import { exportWorkspace } from '../load-workspace';
import { CliCommandMetadata, CliCommandPolyResult, CliOption } from './cli-option';
import { commonOptions } from './common-options';

const commandName = `mono-init`;

const root: CliOption = {
  short: 'r',
  long: `root`,
  codeName: `root`,
  description: `root directory of the monorepo.`,
  exampleValue: `C:\\SourceCode\\mono`,
};

const quiet: CliOption = {
  short: 'q',
  long: `quiet`,
  codeName: `quiet`,
  description: `suppress output.`,
  exampleValue: `true`,
};

const initCommandOptions = {
  root,
  configFilePath: commonOptions.configFilePath,
  quiet,
};

interface StrParams {
  root: string;
  config: string;
  quiet: boolean;
}

export async function monoInitAsyncCommand(this: any, str: StrParams, options: any) {
  const { root, config: configFilePath, quiet } = str;

  console.log(JSON.stringify({ root, configFilePath, quiet }, null, 2));

  const rootDir = fs.opendirSync(root);
  const repoAlike: fs.Dirent[] = [];
  const allProjectDefs: ProjectDef[] = [];
  for await (const repoCandidate of rootDir) {
    if (repoCandidate.isDirectory()) {
      const dotGitDir = path.join(root, repoCandidate.name, '.git');
      const isGitRepo = fs.existsSync(dotGitDir);
      if (isGitRepo)
        console.log(chalk.green(`${repoCandidate.name} has ${dotGitDir}`));
      else
        console.log(chalk.red(`${repoCandidate.name} misses ${dotGitDir}`));

      if (isGitRepo) {
        repoAlike.push(repoCandidate);

        const hasProjectJsonFile = fs.existsSync(path.join(root, repoCandidate.name, 'package.json'));

        const directory = fs.opendirSync(path.join(root, repoCandidate.name));
        let hasSolutionFile = false;
        for await (const slnFileCandidate of directory) {
          if (slnFileCandidate.isFile() && slnFileCandidate.name.endsWith('.sln')) {
            hasSolutionFile = true;
            break;
          }
        }

        const projectDef: ProjectDef = {
          type:
            hasProjectJsonFile ? 'node-web' :
              hasSolutionFile ? 'dotnet' :
                'FIXME' as any,
          gitDir: repoCandidate.name,
          projectDir: 'FIXME',
          projectFile: 'FIXME',
        };
        allProjectDefs.push(projectDef);
      }
    }
  }

  const workspace: WorkspaceDef = {
    root: root,
    projectProfiles: {
      all: allProjectDefs.map(projectDef => projectDef.gitDir),
    },
    projects: allProjectDefs,
    ignoreDirs: [],
  };
  console.warn(JSON.stringify(workspace, undefined, 2));

  // TODO: write to disk configFilePath
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Best-effort attempt to initialize a monorepo in a target location.`,
  options: initCommandOptions,
  impl: monoInitAsyncCommand,
}
