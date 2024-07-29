import { createExecutionContext, parseCommonOptions } from '../cli';
import { commonAdoOptions } from './ado-options';
import { CliCommandMetadata, CliOption } from './cli-option';

const commandName = `list-deploys`;

const pipelines: CliOption = {
  short: 'TODO:rename',
  long: `pipelines`,
  codeName: `pipelines`,
  description: `Pipelines to list. If empty, lists all.`,
};

const listRemoteReposCommandOptions = {
  ...commonAdoOptions,
};

async function listDeploysAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { organization, project, login, token } = str;
  const { logger } = executionContext;

  const org = organization || listRemoteReposCommandOptions.organization.defaultValue;
  const proj = project || listRemoteReposCommandOptions.project.defaultValue;
  // TODO: ...
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `[WIP] List deployments in ADO project.`,
  options: listRemoteReposCommandOptions,
  impl: listDeploysAsyncCommand,
}

// // TODO:
// program
//   .command('list-deployments')
//   .description('List deployments in ADO project.')
//   .option(...describeCliOption(commonAdoOptions.organization))
//   .option(...describeCliOption(commonAdoOptions.project))
//   .option(...describeCliOption(commonAdoOptions.login))
//   .option(...describeCliOption(commonAdoOptions.token))
//   .addHelpText('after', provideExamples('$ npm start -- list-remote-repos -l isoloydenko@ah4r.com -t <PERSONAL_ACCESS_TOKEN> | grep https'))
//   .action(async function (this: any, str, options) {
//     const executionContext = createExecutionContext(parseCommonOptions(options));
//     const { organization, project, login, token } = str;
//     const { logger } = executionContext;

//     const org = organization || 'americanhomes4rent';
//     const proj = project || 'oculos';
//     const listReposResponse = await axios.get<{}, AxiosResponse<any>>(`https://vsrm.dev.azure.com/${org}/${proj}/_apis/release/deployments?api-version=7.1-preview.2`, {
//       headers: {
//         Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
//       },
//     });

//     if (listReposResponse.status < 200 && listReposResponse.status >= 300)
//       throw new Error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);

//     console.log(listReposResponse.status + ' ' + listReposResponse.statusText);
//     console.log(listReposResponse.data);
//   });