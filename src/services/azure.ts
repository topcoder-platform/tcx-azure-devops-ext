import axios from 'axios';
import { PartialDeep } from 'type-fest';

import get from 'lodash/get';
import isNil from 'lodash/isNil';
import find from 'lodash/find';

import GitRestClient from 'TFS/VersionControl/GitRestClient';
import VersionControlContracts from 'TFS/VersionControl/Contracts';
import BuildRestClient from 'TFS/Build/RestClient';
import BuildContracts from 'TFS/Build/Contracts';


import {
  HOST_URL,
  AZURE_URL,
  AZURE_CONFIG
} from '../config';
import { poll } from '../utils/token-poll';

export const axiosInstance = axios.create({
  headers: {
    'Origin': HOST_URL,
    'Access-Control-Request-Method': 'POST',
  },
  timeout: 20000
});

let _fetchingClients = false;
let _adoBuildClient: BuildRestClient.BuildHttpClient5;
let _adoGitClient: GitRestClient.GitHttpClient4_1;


// request interceptor to pass auth token
axiosInstance.interceptors.request.use(async (config) => {
  const token = await VSS.getAccessToken();
  config.headers['Authorization'] = `Bearer ${token.token}`;
  return config;
});

/**
 * Api request for Work Item
 * @returns {Promise<*>}
 */
export function getWorkItemRelations(project: string, id: string) {
  return axiosInstance.get(`${AZURE_URL}/${project}/_apis/wit/workitems/${id}?api-version=6.0&$expand=relations`);
}

/**
 * Fetches the ADO Git Client
 */
export async function getAdoClients(): Promise<{
  adoGitClient: typeof _adoGitClient,
  adoBuildClient: typeof _adoBuildClient
}> {
  if (_adoGitClient && _adoBuildClient) {
    return {
      adoGitClient: _adoGitClient,
      adoBuildClient: _adoBuildClient
    };
  }
  if (_fetchingClients) {
    try {
      const pollingFn = () =>  {
        if (_adoGitClient && _adoBuildClient) {
          return {
            adoGitClient: _adoGitClient,
            adoBuildClient: _adoBuildClient
          };
        }
        throw new Error('Waiting for ADO clients.');
      };
      return poll(pollingFn, 0.1, 5);
    } catch (e) {}
  }
  _fetchingClients = true;
  return new Promise(resolve => {
    VSS.require(
      ['VSS/Service', 'TFS/VersionControl/GitRestClient', 'TFS/Build/RestClient'],
      (
        vssService: any,
        gitRestClient: typeof GitRestClient,
        buildRestClient: typeof BuildRestClient
      ) => {
        _fetchingClients = false;
        _adoGitClient = vssService.getCollectionClient(gitRestClient.GitHttpClient4_1);
        _adoBuildClient = vssService.getCollectionClient(buildRestClient.BuildHttpClient5);
        resolve({
          adoBuildClient: _adoBuildClient,
          adoGitClient: _adoGitClient
        });
      }
    );
  });
}

/**
 * Gets metadata for a file
 * @param azureRepo Azure Repo Object
 * @param filePath Path of file
 * @param branch Name of Branch
 */
export async function getFileInfo(
  azureRepo: VersionControlContracts.GitRepository,
  filePath: string,
  branch: string
) {
  return _adoGitClient.getItem(
    azureRepo.id,
    filePath,
    get(azureRepo, 'project.id'),
    undefined,
    0,
    true,
    false,
    false,
    { version: branch, versionOptions: 0, versionType: 0},
    false,
    false
  );
}

/**
 * Creates or updates a file in a ADO Git repo
 * @param filePath Path of the file
 * @param fileContents Contents of the file
 * @param azureRepo Azure repo
 * @param azureBranch Azure repo branch
 */
export async function createOrUpdateAzureFile(
  filePath: string,
  fileContents: string,
  azureRepo: VersionControlContracts.GitRepository,
  azureBranch: VersionControlContracts.GitBranchStats,
  commitMessage: string
) {
  const { adoGitClient } = await getAdoClients();
  let changeType = 'add';
  let branchHeadSHA: string;
  try {
    const existingFileDataRef = await getFileInfo(azureRepo, filePath, azureBranch.name);
    changeType = 'edit';
    branchHeadSHA = existingFileDataRef.commitId;
  } catch (err) {
    const branchData = await adoGitClient.getBranch(
      get(azureRepo, 'id'),
      get(azureBranch, 'name')
    );
    branchHeadSHA = get(branchData, 'commit.commitId');
  }
  const pushData = {
    refUpdates: [{
      name: `refs/heads/${azureBranch.name}`,
      oldObjectId: branchHeadSHA
    }],
    commits: [{
      comment: commitMessage,
      changes: [{
        changeType,
        item: {
          path: filePath
        },
        newContent: {
          contentType: 'rawtext',
          content: fileContents
        }
      }]
    }]
  };
  return adoGitClient.createPush(pushData as any, azureRepo.id);
}

/**
 * Creates a Build Definition (Pipeline) for the repo
 * @param manifestPath Path to the yaml manifest
 * @param azureRepo Azure repo
 * @param azureBranch Azure Branch
 * @param githubToken GitHub Token (for authorization pushes)
 */
export async function createBuildDefinition(
  manifestPath: string,
  azureRepo: VersionControlContracts.GitRepository,
  azureBranch: VersionControlContracts.GitBranchStats,
  githubToken: string
) {
  const { adoBuildClient } = await getAdoClients();
  let buildDefinition: PartialDeep<BuildContracts.BuildDefinition> = {
    project: get(azureRepo, 'project.id'),
    name: AZURE_CONFIG.PIPELINE_NAME,
    repository: {
      url: get(azureRepo, 'webUrl'),
      defaultBranch: `refs/heads/${azureBranch.name}`,
      id: get(azureRepo, 'id'),
      type: 'TfsGit'
    },
    variables: {
      [AZURE_CONFIG.SECRET_NAME]: {
        value: githubToken,
        isSecret: true,
        allowOverride: false
      }
    },
    triggers: [{
      branchFilters: [`refs/heads/${azureBranch.name}`],
      triggerType: 'continuousIntegration'
    }] as any,
    process: {
      yamlFilename: manifestPath,
      type: 2
    } as any,
    path: '\\\\',
    type: 'build' as any,
    queue: {
      name: 'Hosted Ubuntu 1804',
      pool: {
        name: 'Hosted Ubuntu 1804',
        isHosted: true
      }
    }
  };
  const definitions = await adoBuildClient.getDefinitions(get(azureRepo, 'project.id'));
  const existingDefinition = find(definitions, { name: AZURE_CONFIG.PIPELINE_NAME });
  const isNew = isNil(existingDefinition);
  if (isNew) {
    return adoBuildClient.createDefinition(
      buildDefinition as any,
      get(azureRepo, 'project.id')
    );
  } else {
    buildDefinition = {
      ...existingDefinition,
      ...buildDefinition,
      revision: existingDefinition!.revision
    };
    return adoBuildClient.updateDefinition(
      buildDefinition as any,
      existingDefinition!.id,
      get(azureRepo, 'project.id')
    );
  };
}

/**
 * Trigger a build
 * @param buildDefinitionId The Build Definition ID
 * @param azureRepo Azure Repo
 * @param azureBranch Azure Branch
 */
export async function triggerBuild(
  buildDefinitionId: number,
  azureRepo: VersionControlContracts.GitRepository,
  azureBranch: VersionControlContracts.GitBranchStats,
) {
  const { adoBuildClient } = await getAdoClients();
  const projectId = get(azureRepo, 'project.id');
  const build: PartialDeep<BuildContracts.Build> = {
    definition: { id: buildDefinitionId },
    project: { id: projectId },
    reason: 1,
    sourceBranch: get(azureBranch, 'name')
  };
  return adoBuildClient.queueBuild(build as any, projectId);
}

/**
 * Wait for a build to complete
 * @param build ADO Build
 */
export async function waitForBuild(
  build: BuildContracts.Build,
  intervalInS: number,
  timeoutInS: number
) {
  const { adoBuildClient } = await getAdoClients();
  const pollingFn = async () => {
    const _build = await adoBuildClient.getBuild(
      get(build, 'id'),
      get(build, 'project.id')
    );
    if ([2, 4, 8].includes(_build.status)) {
      return _build;
    }
    throw new Error('Waiting for ADO pipeline to conclude.');
  };
  return poll(pollingFn, intervalInS, timeoutInS);
};