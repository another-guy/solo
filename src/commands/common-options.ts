import { CliOption } from './cli-option';

const profile: CliOption = {
  short: 'p',
  long: `profile`,
  codeName: `profile`,
  description: `profile to use to filter target projects.`,
  exampleValue: `4vendors`,
};

const configFilePath: CliOption = {
  short: 'c',
  long: `config`,
  codeName: `configFilePath`,
  description: `path to the fakemono.json config file.`,
  exampleValue: `/c/SourceCode/fakemono.json`,
};

export const commonOptions = { profile, configFilePath };
