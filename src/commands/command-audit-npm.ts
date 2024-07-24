import * as fs from 'fs';
import * as path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { PackageJson } from '../types';
import { CliCommandMetadata, CliOption, CliOptionsSet } from './cli-option';

const commandName = 'audit-npm';

const directoryOption: CliOption = {
  short: 'd',
  long: 'directory',
  codeName: 'directory',
  description: 'directory containing the package.json file.',
  exampleValue: '/c/SourceCode/app-mf-vendor',
  defaultValue: process.cwd(),
};

const auditCommandOptions: CliOptionsSet = {
  directoryOption,
};

async function auditAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { directory } = str;
  const { logger } = executionContext;
  logger.log(`Analyzing the directory: ${directory}`);

  const packageJsonPath = path.join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logger.error(`package.json not found in the directory: ${directory}`);
    return;
  }
  
  const config = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  const { dependencies, devDependencies } = config;
  console.log(dependencies);
  console.log(devDependencies);
};

function join(...paths: string[]): string {
  const p = path.join(...paths);
  return p.charAt(p.length - 1) === path.sep ? p.slice(0, -1) : p;
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `[WIP] Audit NPM packages.`,
  options: auditCommandOptions,
  impl: auditAsyncCommand,
}
