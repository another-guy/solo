import { command as analyze } from './command-analyze';
import { command as checkHealth } from './command-check-health';
import { command as listRemoteRepos } from './command-list-remote-repos';
import { command as runMany } from './command-run-many';

export const allCommands = [
  analyze,
  checkHealth,
  listRemoteRepos,
  runMany,
];