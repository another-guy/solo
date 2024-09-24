import { compareStrings, sort } from '../algos/sort';
import { command as adoListDeploys } from './command-ado-list-deploys';
import { command as adoListRemoteRepos } from './command-ado-list-remote-repos';
import { command as csvStats } from './command-csv-stats';
import { command as gitRepoStats } from './command-git-repo-stats';
import { command as monoAnalyze } from './command-mono-analyze';
import { command as monoRunMany } from './command-mono-run-many';
import { command as npmAudit } from './command-npm-audit';
import { command as soloCheckHealth } from './command-solo-check-health';
import { command as soloInit } from './command-solo-init';

export const allCommands = sort(
  [
    adoListDeploys,
    adoListRemoteRepos,
    csvStats,
    gitRepoStats,
    monoAnalyze,
    monoRunMany,
    npmAudit,
    soloCheckHealth,
    soloInit,
  ],
  (a, b) => compareStrings(a.name, b.name),
);
