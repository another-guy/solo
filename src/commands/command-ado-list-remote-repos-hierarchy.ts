import axios, { AxiosResponse } from 'axios';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { renderTable } from '../cli/render-table';
import { AdoListProjectsResponse, AdoListRepositoriesResponse, AdoRepository } from '../types';
import { commonAdoOptions } from './ado-options';
import { CliCommandMetadata } from './cli-option';

const commandName = `ado-list-remote-repos-hierarchy`;

const { project, ...otherCommonOptions } = commonAdoOptions;
const listRemoteReposCommandOptions = {
  ...otherCommonOptions,
};

async function adoListRemoteReposAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { organization, project, login, token } = str;
  const { logger } = executionContext;

  const org = organization || listRemoteReposCommandOptions.organization.defaultValue;
  const listProjectsResponse = await axios.get<{}, AxiosResponse<AdoListProjectsResponse>>(`https://dev.azure.com/${org}/_apis/projects`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
    },
  });

  const xPromises = listProjectsResponse
    .data
    .value
    .filter((adoProject) => !project ? true : adoProject.name === project)
    .map(async (adoProject) => {
      try {
        const listRepositoriesResponse = await axios.get<{}, AxiosResponse<AdoListRepositoriesResponse>>(`https://dev.azure.com/${org}/${adoProject.id}/_apis/git/repositories`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
          },
        });

        if (listRepositoriesResponse.status < 200 && listRepositoriesResponse.status >= 300)
          // TODO: refactor into axios wrapper?
          throw new Error(`Failed to list repositories. Status: ${listRepositoriesResponse.status}.`);

        return { adoProject, adoRepos: listRepositoriesResponse.data.value };
      } catch (e) {
        return { adoProject, error: e };
      }
    });
  const promiseResults = await Promise.allSettled(xPromises);

  const columnDefs = [
    { title: 'repo id', width: 38, selector: (repo: AdoRepository) => repo.id },
    { title: 'repo name', width: 40, selector: (repo: AdoRepository) => repo.name },
    { title: 'remoteUrl', width: 160, selector: (repo: AdoRepository) => repo.remoteUrl },
  ];

  promiseResults.forEach(promiseResult => {
    if (promiseResult.status === 'rejected') throw promiseResult.reason;

    const { adoProject, adoRepos } = promiseResult.value;
    const repoCount = adoRepos?.length;

    console.log(`${repoCount} repos in ${adoProject.name} (${adoProject.id}):`);
    if (repoCount)
      console.log(renderTable(
        columnDefs,
        adoRepos || [],
      ));
  });
};

export const command: CliCommandMetadata = {
  name: commandName,
  description: `List remote repositories in ADO project.`,
  options: listRemoteReposCommandOptions,
  impl: adoListRemoteReposAsyncCommand,
}
