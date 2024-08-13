import { compareStrings, sort } from '../algos/sort';
import { command as analyze } from './command-analyze';
import { command as auditNpm } from './command-audit-npm';
import { command as checkHealth } from './command-check-health';
import { command as gitRepoStats } from './command-git-repo-stats';
import { command as listDeploys } from './command-list-deploys';
import { command as listRemoteRepos } from './command-list-remote-repos';
import { command as runMany } from './command-run-many';

export const allCommands = sort(
  [
    analyze,
    auditNpm,
    checkHealth,
    gitRepoStats,
    listDeploys,
    listRemoteRepos,
    runMany,
  ],
  (a, b) => compareStrings(a.name, b.name),
);
