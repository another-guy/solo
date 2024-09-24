import fs from 'fs';
import path from 'path';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { CliCommandMetadata } from './cli-option';
import { SoloRcConfig } from './solorc';

const commandName = `solo-init`;

async function soloInitAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { logger } = executionContext;

  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) {
    const message = 'HOME or USERPROFILE environment variable not set.';
    logger.error(message);
    return;
  }

  const cliConfigLocation = path.join(homeDir, '.solorc.json');
  if (fs.existsSync(cliConfigLocation)) {
    const message = `Config file ${cliConfigLocation} already exists.`;
    logger.error(message);
    return;
  }

  const newConfig: SoloRcConfig = {
    ado: {
      login: '<your-email-login-here>',
      token: '<your-personal-access-token-here>',
      org: '<OPTIONAL-your-organization-here>',
      proj: '<OPTIONAL-your-project-here>',
    },
  };
  fs.writeFileSync(cliConfigLocation, JSON.stringify(newConfig, null, 2));
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `Initialize CLI tool.`,
  options: {},
  impl: soloInitAsyncCommand,
}
