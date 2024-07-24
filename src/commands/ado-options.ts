import { CliOption } from './cli-option';

const login: CliOption = {
  short: 'l',
  long: `login`,
  codeName: `login`,
  description: `ADO login.`,
  exampleValue: `isoloydenko@ah4r.com`,
};

const token: CliOption = {
  short: 't',
  long: `token`,
  codeName: `token`,
  description: `ADO personal access token.`,
  exampleValue: `<PERSONAL_ACCESS_TOKEN>`,
};

const organization: CliOption = {
  short: 'o',
  long: `organization`,
  codeName: `organization`,
  description: `ADO organization name.`,
  exampleValue: `americanhomes4rent`,
  defaultValue: `americanhomes4rent`,
};

const project: CliOption = {
  short: 'p',
  long: `project`,
  codeName: `project`,
  description: `ADO project name.`,
  exampleValue: `oculos`,
  defaultValue: `oculos`,
};

export const commonAdoOptions = { login, token, organization, project };
