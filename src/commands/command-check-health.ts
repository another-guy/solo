import fs from 'fs';
import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { CommandMetadata } from './cli-option';

const commandName = `check-health`;

async function checkHealthAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { logger } = executionContext;

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) {
    const message = 'HOME or USERPROFILE environment variable not set.';
    logger.error(message);
    return;
  }

  const cliConfigLocation = path.join(homeDir, '.fakemonorc.json');
  if (!fs.existsSync(cliConfigLocation)) {
    const message = `Config file not found at ${cliConfigLocation}.`;
    logger.error(message);
    return;
  }

  const config = JSON.parse(fs.readFileSync(cliConfigLocation, 'utf8'));
  const { ado } = config;
  if (!ado) {
    const message = 'ADO config (ado) not found in config.';
    logger.error(message);
    return;
  }

  // TODO: use JSON validator instead
  const { login, token, org, proj } = ado;
  if (!login || !token) {
    const message = 'login or token were not found in ADO config or were empty.';
    logger.error(message);
    return;
  }

  logger.log('ADO config successfully validated.');
};

export const command: CommandMetadata = {
  name: commandName,
  description:
`Self-check the health of the CLI tool.
Validates the presence and the correctness of the config.`,
  options: {},
  impl: checkHealthAsyncCommand,
}
