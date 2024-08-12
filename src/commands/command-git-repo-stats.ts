import chalk from 'chalk';
import * as fs from 'fs';
import { compareNumbers, compareStrings, reverseComparator, sort } from '../algos/sort';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { exportWorkspace } from '../load-workspace';
import { CliCommandMetadata, CliOptionsSet } from './cli-option';
import { runManyAsyncCommand } from './command-run-many';
import { commonOptions } from './common-options';

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
      cmd: `python -m jc git log`,
      config: configFilePath,
      profile,
      sequentially: false,
    },
    options,
  );

  const teamsJsonPath = `C:\\SourceCode\\solo\\src\\data\\teams.json`;
  const { teamMappings, normalizingReplacements, teamMemberNameExceptions } = JSON.parse(fs.readFileSync(teamsJsonPath, 'utf8')) as TeamsJson;
  const memberToTeam = pivot(teamMappings, normalizingReplacements);

  const dirs = Array.from(Object.keys(authorsResponse));
  const uniqueAuthors = new Set<string>();

  const allAggregatedStats = dirs.map(dir => {
    const logEntries = JSON.parse(authorsResponse[dir].output) as GitLogEntry[];
    const authorStatObject = logEntries
      .map((entry) => (entry.author || '???'))
      .map((author) => author.toLowerCase())
      .map((author) => normalize(author, normalizingReplacements))
      .reduce(
        (result, author) => {
          uniqueAuthors.add(author);

          if (!result[author]) result[author] = 0;
          result[author]++;
          return result;
        },
        {} as { [author: string]: number },
      );
    const authorStatList = Object
      .entries(authorStatObject)
      .reduce(
        (result, [author, count]) => {
          result.push({ author, count });
          return result;
        },
        [] as { author: string, count: number }[],
      );
    const orderedAuthorStatsList = sort(authorStatList, reverseComparator((authorStatsA, authorStatsB) => compareNumbers(authorStatsA.count, authorStatsB.count)));
    console.log(chalk.green(`Authors for ${dir}: ${JSON.stringify(orderedAuthorStatsList, null, 2)}`));

    const teamStatObject = orderedAuthorStatsList
      .reduce(
        (result, { author, count }) => {
          const team = memberToTeam[author] || 'other';

          if (!result[team]) result[team] = count;
          else result[team] += count;

          return result;
        },
        {} as { [team: string]: number },
      );
    const total = Object.values(teamStatObject).reduce((sum, count) => sum + count, 0);
    const orderedTeamStatList = Object
      .entries(teamStatObject)
      .reduce(
        (result, [team, count]) => {
          result.push({ team, count, ratio: Math.round(count / total * 100) });
          return result;
        },
        [] as { team: string, count: number, ratio: number }[],
      )
      .sort(reverseComparator((teamStatsA, teamStatsB) => compareNumbers(teamStatsA.count, teamStatsB.count)));

    const allStats = {
      dir,
      orderedAuthorStatsList,
      orderedTeamStatList,
    };
    return allStats;
  });

  const strangeAuthorNames =
    sort(
      Array.from(uniqueAuthors),
      compareStrings,
    )
      .filter((author) => nonstandardGitAuthorName(author, teamMemberNameExceptions));
  if (strangeAuthorNames.length)
    console.log(chalk.red(`Strange names: ${JSON.stringify(strangeAuthorNames, null, 2)}`));

  // TODO: format as table
  console.log(chalk.green(`All stats: ${JSON.stringify(allAggregatedStats, null, 2)}`));
};

function nonstandardGitAuthorName(fullName: string, teamMemberNameExceptions: string[]) {
  if (teamMemberNameExceptions.includes(fullName)) return false;

  const notExactlyTwoParts = fullName.split(' ').length !== 2;
  const hasSpecialCharacters = fullName.match(/[^a-zA-Z\s]/) !== null;
  return notExactlyTwoParts || hasSpecialCharacters ?
    { notExactlyTwoParts, hasSpecialCharacters } :
    false;
}

// FIXME: TODO: normalizingReplacements should be in JS regex syntax.
function normalize(author: string, normalizingReplacements: NormalizingReplacement[]): string {
  return normalizingReplacements.reduce(
    (result, { find, replaceWith }) => result.replace(find, replaceWith),
    author,
  )
};

function pivot(teamMappings: TeamMappings, normalizingReplacements: NormalizingReplacement[]): { [member: string]: string } {
  const result: { [member: string]: string } = {};
  for (const teamName of Object.keys(teamMappings))
    for (const member of teamMappings[teamName].members)
      result[normalize(member, normalizingReplacements)] = teamName;
  return result;
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Collect Git repository stats.
This command depends on jc to be installed from https://github.com/kellyjonbrazil/jc.`,
  options: analyzeCommandOptions,
  impl: analyzeAsyncCommand,
}

interface TeamsJson {
  normalizingReplacements: NormalizingReplacement[];
  teamMappings: TeamMappings;
  teamMemberNameExceptions: string[];
}

interface NormalizingReplacement {
  find: string;
  replaceWith: string;
};

interface TeamMappings {
  [teamName: string]: {
    members: string[];
  };
}

interface GitLogEntry {
  commit: string;
  author: string;
  author_email: string;
  date: string;
  message: string;
  epoch: number;
  epoch_utc: null;
}
