import { Dirent } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { compareNumbers, reverseComparator, sort } from '../algos/sort';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { pad } from '../cli/pad';
import { renderTable } from '../cli/render-table';
import { CliCommandMetadata, CliOption, CliOptionsSet } from './cli-option';

const commandName = 'csv-stats';

const dir: CliOption = {
  short: 'd',
  long: 'directory',
  codeName: 'directory',
  description: 'Base directory from where CSV files are discoverable.',
  defaultValue: '',
  exampleValue: '/c/SourceCode/oculos-deploy/Versions',
};
const include: CliOption = {
  short: 'i',
  long: 'include',
  codeName: 'include',
  description: 'Comma-separated subdirectory names to include in the search.',
  defaultValue: '',
  exampleValue: '4Services,4Vendors',
};
const exclude: CliOption = {
  short: 'e',
  long: 'exclude',
  codeName: 'exclude',
  description: 'Comma-separated subdirectory names to exclude from the search.',
  defaultValue: '',
  exampleValue: 'rollback',
};
const files: CliOption = {
  short: 'f',
  long: 'files',
  codeName: 'files',
  description: 'Comma-separated pairs of file names and corresponding CSV columns to aggregate.',
  defaultValue: '',
  exampleValue: 'state-machines.csv:ServiceName,functions.csv:FunctionName,services.csv:ServiceName',
};

const csvStatsCommandOptions: CliOptionsSet = {
  dir,
  include,
  exclude,
  files,
};

async function csvStatsCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { directory: directoryRaw, include, exclude, files } = str;

  const directory = directoryRaw as string;
  const includeDirs = (include as string).split(',');
  const excludeDirs = (exclude as string).split(',');
  const fileColumnPairs = (files as string)
    .split(',')
    .map((pair) => {
      const splitResult = pair.split(':');
      if (splitResult.length !== 2) throw new Error(`Invalid pair: ${pair}`);
      return { file: splitResult[0], columnName: splitResult[1] };
    });

  const subdirectoriesFound =
    (await readdir(directory, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .filter((dirent) =>
        includeDirs.some((dir) => dirent.name.includes(dir)) &&
        !excludeDirs.some((dir) => dirent.name.includes(dir))
      );
  // console.log('Subdirectories found:');
  // subdirectoriesFound.forEach((subDir) => {
  //   console.log(subDir.name);
  // });

  const filePatternsAndFoundFiles = await Promise.all(
    fileColumnPairs.map(async ({ file }) => {
      const fileSearchResults = subdirectoriesFound
        .map((subDir) => {
          return findFileInDirectory(join(directory, subDir.name), file);
        });
      const foundFiles = (await Promise.all(fileSearchResults))
        .filter(dirent => dirent !== undefined);
      return {
        file,
        foundFiles,
      };
    }),
  );

  // console.log('Found files:');
  // filePatternsAndFoundFiles.forEach(({ file, foundFiles }) => {
  //   console.log(file);
  //   foundFiles.forEach((foundFile) => {
  //     console.log(`  ${join(foundFile?.parentPath, foundFile?.name)}`);
  //   });
  // });

  const allData = await Promise.all(
    filePatternsAndFoundFiles.map(async ({ file, foundFiles }) => {
      const columnName = fileColumnPairs.find((pair) => pair.file === file)?.columnName;
      if (!columnName) throw new Error(`Column name not found for file: ${file}`);

      const columnData = await Promise.all(
        foundFiles.map(async (foundFile) => {
          const filePath = join(foundFile.parentPath, foundFile.name);
          const fileAsString = await readFile(filePath, 'utf8');
          const fileLines = fileAsString.split('\n');
          const [header, ...data] = fileLines;
          const columnIndex = header.split(';').indexOf(columnName);
          if (columnIndex < 0) {
            console.error(`Column ${columnName} not found in header "${header}" of file ${filePath}`);
            return [];
          }
          const columnValues = data
            .map((line) => line.split(';')[columnIndex])
            .filter(Boolean);

          if (data.indexOf('\r') >= 0)
            console.error(`File ${filePath} contains carriage return characters.`);

          return columnValues;
        }),
      );
      return {
        file,
        columnData,
      };
    })
  );

  const result = allData
    .reduce(
      (acc, { file, columnData }) => {
        const countedData = columnData
          .flat()
          .reduce(
            (result, data) => {
              const entry = result.find((entry) => entry.entry === data);
              if (entry) entry.count++;
              else result.push({ entry: data, count: 1 });
              return result;
            },
            [] as { entry: string, count: number }[],
          );

        acc[file] = sort(countedData, reverseComparator((a, b) => compareNumbers(a.count, b.count)));
        return acc;
      },
      {} as { [file: string]: { entry: string; count: number; }[] },
    );

  console.log(
    renderTable(
      [
        {
          title: 'File',
          selector: ([file]) => file,
          width: 30,
        },
        {
          title: 'Stats',
          selector: ([, stats]) => stats.map(({ entry, count }) => `${pad(count, 3)} ${entry}`).join('\n'),
          width: 30,
        },
      ],
      Object.entries(result),
      {
        chars: {},
        style: {},
      },
    ),
  );
}

async function findFileInDirectory(directory: string, fileName: string): Promise<Dirent | undefined> {
  const dirents = await readdir(directory, { withFileTypes: true })
  const foundFile = dirents.find((dirent) => dirent.isFile() && dirent.name === fileName);
  return foundFile;
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Analyze CSV files.`,
  options: csvStatsCommandOptions,
  impl: csvStatsCommand,
}
