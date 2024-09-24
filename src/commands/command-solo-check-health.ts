import fs from 'fs';
import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { CliCommandMetadata } from './cli-option';
import { SoloRcConfig } from './solorc';

const commandName = `solo-check-health`;

async function soloCheckHealthAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { logger } = executionContext;

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) {
    const message = 'HOME or USERPROFILE environment variable not set.';
    logger.error(message);
    return;
  }

  const cliConfigLocation = path.join(homeDir, '.solorc.json');
  if (!fs.existsSync(cliConfigLocation)) {
    const message = `Config file not found at ${cliConfigLocation}.`;
    logger.error(message);
    return;
  }

  const config = JSON.parse(fs.readFileSync(cliConfigLocation, 'utf8')) as SoloRcConfig;
  const { ado } = config;
  if (!ado) {
    const message = 'ADO config (ado) not found in config.';
    logger.error(message);
    return;
  }

  const errorList: { isError: boolean, message: string }[] = [];

  // TODO: use JSON validator instead
  const { login, token, org, proj } = ado;
  if (!login || !token)
    errorList.push({ isError: true, message: 'login or token were not found in ADO config or were empty.' });
  else
    errorList.push({ isError: false, message: 'ADO config successfully validated.' });

  errorList.forEach((error) => {
    if (error.isError) {
      logger.error(error.message);
    } else {
      logger.logHighlight(error.message);
    }
  });
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Self-check the health of the CLI tool.
Validates the presence and the correctness of the config.`,
  options: {},
  impl: soloCheckHealthAsyncCommand,
}
