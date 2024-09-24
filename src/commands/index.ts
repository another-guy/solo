import { compareStrings, sort } from '../algos/sort';
import { command as analyze } from './command-analyze';
import { command as auditNpm } from './command-audit-npm';
import { command as csvStats } from './command-csv-stats';
import { command as gitRepoStats } from './command-git-repo-stats';
import { command as listDeploys } from './command-list-deploys';
import { command as listRemoteRepos } from './command-list-remote-repos';
import { command as runMany } from './command-run-many';
import { command as checkHealth } from './command-solo-check-health';
import { command as soloInit } from './command-solo-init';

export const allCommands = sort(
  [
    analyze,
    auditNpm,
    checkHealth,
    csvStats,
    gitRepoStats,
    listDeploys,
    listRemoteRepos,
    runMany,
    soloInit,
  ],
  (a, b) => compareStrings(a.name, b.name),
);
