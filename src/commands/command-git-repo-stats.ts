import chalk from 'chalk';
import { compareNumbers, compareStrings, reverseComparator, sort } from '../algos/sort';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { pad } from '../cli/pad';
import { renderTable } from '../cli/render-table';
import { NormalizingReplacement, TeamMappings, TeamName, teams as teamsJson } from '../data/teams';
import { exportWorkspace } from '../load-workspace';
import { CliCommandMetadata, CliOption, CliOptionsSet } from './cli-option';
import { monoRunManyAsyncCommand } from './command-mono-run-many';
import { commonOptions } from './common-options';

const commandName = 'git-repo-stats';

const after: CliOption = {
  short: 'a',
  long: 'after',
  codeName: 'after',
  description: 'Date after which to analyze the commits.',
  defaultValue: '',
  exampleValue: '2024-01-01',
};

const before: CliOption = {
  short: 'b',
  long: 'before',
  codeName: 'before',
  description: 'Date before which to analyze the commits.',
  defaultValue: '',
  exampleValue: '2024-06-01',
};

const analyzeCommandOptions: CliOptionsSet = {
  profile: commonOptions.profile,
  configFilePath: commonOptions.configFilePath,
  after,
  before,
};

async function gitRepoStatsAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { profile, config: configFilePath, after: afterDate, before: beforeDate } = str;
  const workspace = await exportWorkspace(configFilePath, executionContext);
  const { logger } = executionContext;

  console.log(chalk.green(`Analyzing ${JSON.stringify(str)}`));

  const jcGitLogCmd = [
    `python -m jc git log`,
    afterDate ? `--after="${afterDate}"` : undefined,
    beforeDate ? `--before="${beforeDate}"` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const authorsResponse = await monoRunManyAsyncCommand(
    {
      type: 'git',
      cmd: jcGitLogCmd,
      config: configFilePath,
      profile,
      sequentially: false,
      quiet: true,
    },
    options,
  );

  const { teamMappings, normalizingReplacements, teamMemberNameExceptions } = teamsJson;
  const memberToTeam = pivot(teamMappings, normalizingReplacements);

  const dirs = Array.from(Object.keys(authorsResponse));
  const membersWithUnknownTeam = new Set<string>();
  const nonStandardAuthorNames = new Map<string, { dir: string, notExactlyTwoParts: boolean, hasSpecialCharacters: boolean }>();

  const allAggregatedStats = dirs.map(dir => {
    const logEntries = JSON.parse(authorsResponse[dir].output) as GitLogEntry[];
    if (!logEntries.length) {
      logger.warn(`No log entries for ${dir}`);
      return {
        dir,
        orderedAuthorStatsList: [],
        orderedTeamStatList: [],
      };
    }

    const authorStatObject = logEntries
      .map((entry) => (entry.author || '???'))
      .map((author) => author.toLowerCase())
      .map((author) => normalize(author, normalizingReplacements))
      .reduce(
        (result, author) => {
          const nameIssues = nonstandardGitAuthorName(author, teamMemberNameExceptions);
          if (nameIssues) {
            console.error(`Non-standard author name: ${author} in ${dir}`);
            nonStandardAuthorNames.set(author, { dir, ...nameIssues });
          }

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

    const teamStatObject = orderedAuthorStatsList
      .reduce(
        (result, { author, count }) => {
          const team = memberToTeam[author] || 'other';
          if (team === 'other') membersWithUnknownTeam.add(author);

          if (!result[team]) result[team] = count;
          else result[team] += count;

          return result;
        },
        {} as { [team: string]: number },
      );
    const total = Object.values(teamStatObject).reduce((sum, count) => sum + count, 0);
    const orderedTeamStatList = sort(
      Object
        .entries(teamStatObject)
        .reduce(
          (result, [team, count]) => {
            result.push({ team, count, ratio: Math.round(count / total * 100) });
            return result;
          },
          [] as { team: string, count: number, ratio: number }[],
        ),
      reverseComparator((teamStatsA, teamStatsB) => compareNumbers(teamStatsA.count, teamStatsB.count)),
    );

    const allStats = {
      dir,
      orderedAuthorStatsList,
      orderedTeamStatList,
    };

    return allStats;
  });

  const allAggregatedStatsSorted = sort(allAggregatedStats, (a, b) => compareStrings(a.dir, b.dir));

  const nonStandardAuthorNameList = Object
    .entries(nonStandardAuthorNames)
    .reduce((result, [author, { dir, notExactlyTwoParts, hasSpecialCharacters }]) => {
      result.push({ name: author, dir, notExactlyTwoParts, hasSpecialCharacters });
      return result;
    }, [] as { name: string, dir: string, notExactlyTwoParts: boolean, hasSpecialCharacters: boolean }[])


  const totalResult = {
    allAggregatedStats: allAggregatedStatsSorted,
    nonStandardAuthorNames: nonStandardAuthorNameList,
    membersWithUnknownTeam: sort(Array.from(membersWithUnknownTeam), compareStrings),
  };

  console.log(renderTable(
    [
      {
        title: 'dir',
        selector: v => v.dir.replaceAll(workspace.root, ''),
        width: 40,
      },
      {
        title: 'author',
        selector: v => {
          return v
            .orderedAuthorStatsList
            .map(({ author, count }) => {
              const team = memberToTeam[author] || 'other';
              const color = teamColors[team as TeamName];
              return `${pad(count, 4)}  ${color(author)}`;
            })
            .join('\n');
        },
        width: 40,
      },
      {
        title: 'team',
        selector: v => v.orderedTeamStatList.map(({ team, count, ratio }) => `${teamColors[team as TeamName](team)}`).join('\n'),
        width: 40,
      },
      {
        title: 'team-stats',
        selector: v => v.orderedTeamStatList.map(({ team, count, ratio }) => `${pad(ratio, 3)}% (${pad(count, 3)})`).join('\n'),
        width: 15,
      },
    ],
    totalResult.allAggregatedStats,
  ));

  if (nonStandardAuthorNameList.length)
    console.log(chalk.yellow(renderTable([{ title: 'Non-standard author names', selector: v => `${v.name} in ${v.dir}`, width: 100 }], nonStandardAuthorNameList)));

  if (totalResult.membersWithUnknownTeam.length)
    console.log(chalk.yellow(renderTable([{ title: 'Members with no team assigned', selector: v => v, width: 50 }], totalResult.membersWithUnknownTeam)));
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
  return normalizingReplacements
    .reduce(
      (result, { find, replaceWith, log }) => {
        const newResult = result.replace(new RegExp(find, 'g'), replaceWith);
        if (log && newResult !== result)
          console.log(`Replacing ${find} with ${replaceWith} in ${result} -> ${newResult}`);
        return newResult;
      },
      author,
    )
    .toLowerCase();
};

function pivot(teamMappings: TeamMappings, normalizingReplacements: NormalizingReplacement[]): { [member: string]: string } {
  const result: { [member: string]: string } = {};
  for (const teamName of Object.keys(teamMappings))
    for (const member of teamMappings[teamName as TeamName])
      result[normalize(member, normalizingReplacements)] = teamName;
  return result;
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Collect Git repository stats.
This command depends on jc to be installed from https://github.com/kellyjonbrazil/jc.`,
  options: analyzeCommandOptions,
  impl: gitRepoStatsAsyncCommand,
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

const teamColors: { [team in TeamName]: chalk.Chalk } = {
  "4platform: core-services": chalk.red,
  "4platform: integ & system design": chalk.green,
  "4rent": chalk.yellow,
  "4services: 4vendors": chalk.blue,
  "4services: turn": chalk.magenta,
  "4services: maintenance-experience": chalk.cyan,
  "4resident-management": chalk.redBright,
  "4apply": chalk.greenBright,
  "4properties": chalk.yellowBright,
  "devops": chalk.blueBright,
  "fuzzy": chalk.grey,
  "architects": chalk.grey,
  "developer-left": chalk.grey,
  "other": chalk.grey,
}
