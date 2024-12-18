import * as fs from 'fs';
import { ExecutionContext } from './cli';
import { ProjectDef, WorkspaceDef } from './types';

export async function exportWorkspace(
  path: fs.PathLike,
  executionContext: ExecutionContext,
): Promise<WorkspaceDef> {
  const workspace = strToWorkspace(await fs.promises.readFile(path, 'utf8'));
  if (executionContext.verbose)
    console.log(workspace);
  return workspace;
}

function strToWorkspace(str: string): WorkspaceDef {
  const w = JSON.parse(str) as WorkspaceDef;
  w.ignoreDirs = w.ignoreDirs || [];
  return w;
}

export function hasIssuesInConfig(
  project: ProjectDef,
): false | ConfigIssues {
  const hasKeyWithoutValue = Object.values(project).some((value) => !value || (value + '').toLowerCase() === 'fixme');
  const missesGitDir = !project.gitDir;
  const missesProjectDir = !project.projectDir;
  const missesProjectFile = !project.projectFile;
  const isIncomplete = hasKeyWithoutValue || missesGitDir || missesProjectDir || missesProjectFile;
  return isIncomplete ?
    {
      hasKeyWithoutValue,
      missesGitDir,
      missesProjectDir,
      missesProjectFile,
    } :
    false;
}

export interface ConfigIssues {
  hasKeyWithoutValue: boolean;
  missesGitDir: boolean;
  missesProjectDir: boolean;
  missesProjectFile: boolean;
}
