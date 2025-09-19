import axios, { AxiosResponse } from 'axios';
import { createExecutionContext, parseCommonOptions } from '../cli';
import { commonAdoOptions } from './ado-options';
import { CliCommandMetadata, CliOption } from './cli-option';

const commandName = `ado-list-deploys`;

const stagesOption: CliOption = {
  short: 's',
  long: `stages`,
  codeName: `stages`,
  description: `Stages to list ('PRIVATE', 'SIT', 'QA', 'UAT', 'PROD'). If empty, lists all.`,
};

const listRemoteReposCommandOptions = {
  ...commonAdoOptions,
  stagesOption,
};

async function adoListDeploysAsyncCommand(this: any, str: any, options: any) {
  const executionContext = createExecutionContext(parseCommonOptions(options));
  const { organization, project, login, token, stages } = str;
  const { logger } = executionContext;

  const org = organization || listRemoteReposCommandOptions.organization.defaultValue;
  const proj = project || listRemoteReposCommandOptions.project.defaultValue;
  const stagesToList = ((stages as string) ?? 'PRIVATE,SIT,QA,UAT,PROD').split(',').map((s) => (s as string).toUpperCase());

  const {
    listReleaseDefinitions,
    listReleasesByReleaseDefinitionID,
    listReleaseDetails,
  } = createAzureDevOpsClient({ organization: org, project: proj, login, token });

  // Should come from CSV
  const projectsOfInterest = [
    'api-mf-user',
    'app-mf-lifecycle',
    'api-mf-lifecycle',
    'module-view-model-turn',
    'service-lifecycle',
    'app-4services',
    'app-mf-work-order',
    'app-mf-maintenance',
    'api-mf-maintenance',
    'api-mf-resident-maintenance',
    'app-mf-asset',
    'api-mf-asset',
    'app-mf-vendor-exp',
  ];

  const releaseDefinitions = (
    await listReleaseDefinitions({ sortBy: 'no-sort' })
  )
    .list
    .filter(({ name }) => projectsOfInterest.includes(name));

  const result = await Promise.all(releaseDefinitions.map(async ({ id: releaseDefinitionId }) => listReleasesByReleaseDefinitionID({ releaseDefinitionId })));

  for (const [index, releases] of result.entries()) {
    const releaseDefinition = releaseDefinitions[index];

    const results = await Promise.all(
      releases
        .environments
        .filter(({ name }) => stagesToList.some(stage => name.toUpperCase().includes(stage)))
        .sort((a, b) => b.rank - a.rank)
        .map((env) =>
          listReleaseDetails({ releaseId: env.currentRelease.id })
            .then((releaseDetails) => {
              return {
                releaseDefinition,
                env,
                releaseDetails,
              };
            })
        )
    );

    console.log(`${releaseDefinition.name.padEnd(30, ' ')} ${releaseDefinition.url}`);
    results
      .forEach(({ env, releaseDetails }) => {
        const artifacts = releaseDetails.artifacts;
        const buildArtifact = artifacts.find(a => a.type === 'Build')!;
        const { artifactSourceVersionUrl, version } = buildArtifact.definitionReference;
        console.log(`    ${env.name} (release-id ${env.currentRelease.id}) ${env.currentRelease.ui}`);
        console.log(`        ${version.name}`);
        console.log(`        ${artifactSourceVersionUrl.id}`);
        console.log();
      });
  }
}

export const command: CliCommandMetadata = {
  name: commandName,
  description: `[WIP] List deployments in ADO project.`,
  options: listRemoteReposCommandOptions,
  impl: adoListDeploysAsyncCommand,
}

export function createAzureDevOpsClient({
  organization,
  project,
  login,
  token
}: {
  organization: string;
  project: string;
  login: string;
  token: string;
}) {
  const baseUrl = `https://vsrm.dev.azure.com/${organization}/${project}`;

  async function listReleaseDefinitions({
    sortBy,
  }: {
    sortBy?: 'name' | 'id' | 'no-sort';
  }) {
    // const filter = nameFilters ? `&$filter=contains(name,'${nameFilters.join("') or contains(name,'")}')` : '';
    const sortByToUse = sortBy ?? 'no-sort';
    const sortByFunction =
      sortByToUse === 'no-sort' ? () => 0 :
        sortByToUse === 'name'
          ? (a: ReleaseDefinition, b: ReleaseDefinition) => a.name.localeCompare(b.name) :
          sortByToUse === 'id' ? (a: ReleaseDefinition, b: ReleaseDefinition) => a.id - b.id :
            sortByToUse;

    // https://learn.microsoft.com/en-us/rest/api/azure/devops/release/definitions/list?view=azure-devops-rest-7.0&tabs=HTTP
    const url = `${baseUrl}/_apis/release/definitions?api-version=7.0`;
    const { status, data } = await axios.get<{}, AxiosResponse<ReleaseDefinitions>>(
      url,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
        },
      },
    );
    if (status < 200 || status >= 300) throw new Error(`Failed to retrieve release definitions: ${status} ${data}`);

    const list = data
      .value
      .map(def => ({
        id: def.id,
        name: def.name,
        url: def.url,
      }))
      .sort((a, b) => sortByFunction(a, b));

    const map = list.reduce(
      (result, item) => {
        result.set(item.id, item);
        return result;
      },
      new Map<number, ReleaseDefinition>(),
    );

    return {
      list,
      map
    };
  }

  async function listReleasesByReleaseDefinitionID({
    releaseDefinitionId,
  }: {
    releaseDefinitionId: number;
  }): Promise<ReleasesForReleaseDefinition> {

    const url = `${baseUrl}/_apis/Release/definitions/${releaseDefinitionId}`;
    const { status, data } = await axios.get<{}, AxiosResponse<ReleasesForReleaseDefinition>>(
      url,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
        },
      },
    );

    if (status < 200 || status >= 300) throw new Error(`Failed to retrieve release definitions: ${status} ${data}`);

    const result = {
      lastRelease: {
        id: data.lastRelease.id,
        name: data.lastRelease.name,
        description: data.lastRelease.description,
      },
      environments: data.environments.map(env => ({
        id: env.id,
        name: env.name,
        rank: env.rank,
        currentRelease: {
          id: env.currentRelease.id,
          url: env.currentRelease.url,
          ui: `https://dev.azure.com/americanhomes4rent/oculos/_releaseProgress?_a=release-pipeline-progress&releaseId=${env.currentRelease.id}`,
        },
      })),
    };

    return result;
  }

  async function listReleaseDetails({
    releaseId,
  }: {
    releaseId: number;
  }): Promise<ReleaseDetails> {
    const url = `${baseUrl}/_apis/release/releases/${releaseId}?api-version=7.1-preview.8`;
    const { status, data } = await axios.get<{}, AxiosResponse<ReleaseDetails>>(
      url,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString('base64')}`,
        },
      },
    );

    if (status < 200 || status >= 300) throw new Error(`Failed to retrieve artifacts: ${status} ${data}`);

    return data;
  }

  return {
    listReleaseDefinitions,
    listReleasesByReleaseDefinitionID,
    listReleaseDetails,
  };
}

type ReleaseDetails = {
  artifacts: Artifact[];
}

type Artifact = GitArtifact | BuildArtifact;

interface GitArtifact {
  sourceId: string;
  type: "Git",
  alias: string;
  definitionReference: {
    branches: {
      id: string;
      name: string;
    },
    definition: {
      id: string;
      name: string;
    },
    project: {
      id: string;
      name: string;
    },
    version: {
      id: string;
      name: string;
    },
    branch: {
      id: string;
      name: string;
    }
  },
  "isRetained": false
}

interface BuildArtifact {
  sourceId: string;
  type: "Build";
  alias: string;
  definitionReference: {
    artifactSourceDefinitionUrl: {
      id: string;
      name: string;
    };
    buildUri: {
      id: string;
      name: string;
    };
    definition: {
      id: string;
      name: string;
    };
    definitions: {
      id: string;
      name: string;
    };
    IsMultiDefinitionType: {
      id: string;
      name: string;
    };
    IsXamlBuildArtifactType: {
      id: string;
      name: string;
    };
    project: {
      id: string;
      name: string;
    };
    "repository.provider": {
      id: string;
      name: string;
    };
    repository: {
      id: string;
      name: string;
    };
    requestedFor: {
      id: string;
      name: string;
    };
    requestedForId: {
      id: string;
      name: string;
    };
    sourceVersion: {
      id: string;
      name: string;
    };
    version: {
      id: string;
      name: string;
    };
    branch: {
      id: string;
      name: string;
    };
    artifactSourceVersionUrl: {
      id: string;
      name: string;
    }
  };
  isPrimary: boolean;
  isRetained: boolean;
}

type ReleaseDefinition = {
  id: number,
  name: string,
  url: string,
};

type ReleaseDefinitions = {
  count: number;
  value: ReleaseDefinition[];
};

type ReleasesForReleaseDefinition = {
  lastRelease: {
    id: number,
    name: string,
    description: string,
  },
  environments: {
    id: number,
    name: string,
    rank: number,
    currentRelease: {
      id: number,
      url: string,
      ui: string,
    },
  }[],
};