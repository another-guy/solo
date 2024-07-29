import axios, { AxiosResponse } from 'axios';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { renderTable } from '../cli/render-table';
import { AdoListRepositoriesResponse, AdoRepository } from '../types';
import { commonAdoOptions } from './ado-options';
import { CliCommandMetadata } from './cli-option';

const commandName = `list-remote-repos`;

const listRemoteReposCommandOptions = {
  ...commonAdoOptions,
};

async function listRemoteReposAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { organization, project, login, token } = str;
  const { logger } = executionContext;

  const org = organization || listRemoteReposCommandOptions.organization.defaultValue;
  const proj = project || listRemoteReposCommandOptions.project.defaultValue;
  const listRepositoriesResponse = await axios.get<{}, AxiosResponse<AdoListRepositoriesResponse>>(`https://dev.azure.com/${org}/${proj}/_apis/git/repositories`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
    },
  });

  if (listRepositoriesResponse.status < 200 && listRepositoriesResponse.status >= 300)
    // TODO: refactor into axios wrapper?
    throw new Error(`Failed to list repositories. Status: ${listRepositoriesResponse.status}.`);

  const columnDefs = [
    { title: 'repo id', width: 38, selector: (repo: AdoRepository) => repo.id },
    { title: 'repo name', width: 40, selector: (repo: AdoRepository) => repo.name },
    { title: 'remoteUrl', width: 160, selector: (repo: AdoRepository) => repo.remoteUrl },
  ];
  console.log(renderTable(
    columnDefs,
    listRepositoriesResponse.data.value,
  ));
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `List remote repositories in ADO project.`,
  options: listRemoteReposCommandOptions,
  impl: listRemoteReposAsyncCommand,
}
