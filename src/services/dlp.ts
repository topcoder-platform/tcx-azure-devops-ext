import axios, { AxiosError, AxiosResponse } from 'axios';
import get from 'lodash/get';
import { v4 as uuid } from 'uuid';
import sha256 from 'crypto-js/sha256';

import { BranchSyncHubDocument } from '../components/branch-sync-hub';
import { DLPConfig, DLPScannerResults } from '../types/dlp';
import { createWebHooks, deleteWebHooks } from './ado-web-hooks';
import { WebHookItem } from '../types/ado-web-hooks';

export const defaultDlpConfig: DLPConfig = {
  dlpForWorkItems: false,
  dlpForCode: false,
  blockChallengeCreation: false,
  dlpEndpoint: '',
  webHooks: []
};

export const getDlpConfigKey = () => `${VSS.getWebContext().project.id}_DLP_CONFIG`;
export const getBranchSyncHubConfigKey = () => `${VSS.getWebContext().project.id}_BRANCH_SYNC_HUB_STATE`;

export const getDlpConfig = async () => {
  // Get Extension Data service.
  const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
  // Set up document tracking variable.
  let dlpConfig = defaultDlpConfig;
  let azurePersonalAccessToken = '';
  // Fetch the config
    try {
      const docName = getBranchSyncHubConfigKey();
      const docValue = await dataService.getValue<BranchSyncHubDocument>(
        docName,
        { scopeType: 'User' }
      );
    azurePersonalAccessToken = docValue.azurePersonalAccessToken;
  } catch (err) {
    console.error(err);
  }
  try {
    dlpConfig = await dataService.getValue<DLPConfig>(
      getDlpConfigKey(),
      { scopeType: 'User' }
    );
  } catch (err) {
    console.error(err);
  }
  return {
    ...dlpConfig,
    azurePersonalAccessToken
  };
};

const checkDlpEndpoint = async (dlpConfig: DLPConfig) => {
  const _uuid = uuid();
  try {
    const res = await axios({
      method: 'OPTIONS',
      url: dlpConfig.dlpEndpoint,
      headers: {
        'x-handshake-request-data': _uuid
      }
    });
    const uuidHash = sha256(_uuid).toString();
    const handshakeResponse = res.headers['x-handshake-response-data'];
    return uuidHash === handshakeResponse;
  } catch (err) {
    console.error(err);
    return false;
  }

};

export const saveDlpConfig = async (newDlpConfig: Partial<DLPConfig>) => {
  const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
  const existingConfig = await dataService.getValue<DLPConfig>(
    getDlpConfigKey(),
    { scopeType: 'User' }
  );
  // Check DLP Endpoint
  const isEndpointValid = await checkDlpEndpoint(newDlpConfig as DLPConfig);
  if (!isEndpointValid) {
    throw new Error('Couldn\'t verify the DLP endpoint. Please check the URL.');
  }
  // Remove previous web hooks
  if (existingConfig.webHooks && existingConfig.webHooks.length > 0) {
    await deleteWebHooks(existingConfig.webHooks);
  }
  // Create the web hooks
  let workItems: (AxiosResponse<WebHookItem> | AxiosError<any>)[] = [];
  if (newDlpConfig.dlpForWorkItems) {
    workItems = await createWebHooks(newDlpConfig.dlpEndpoint!);
  }
  // Save state
  const workitemIds = workItems.map(workItemRes => get(workItemRes, 'data.id')).filter(Boolean);
  dataService.setValue(
    getDlpConfigKey(),
    {
      ...newDlpConfig,
      webHooks: workitemIds
    },
    { scopeType: 'User' }
  );
};

export const saveAzurePatToken = async (azurePersonalAccessToken: string) => {
  const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
  const docName = getBranchSyncHubConfigKey();
  const docValue = await dataService.getValue<BranchSyncHubDocument>(
    docName,
    { scopeType: 'User' }
  );
  await dataService.setValue(
    docName,
    { ...docValue, azurePersonalAccessToken },
    { scopeType: 'User' }
  );
};

export const getDlpStatus = async (workItemId: string) => {
  const projectId = VSS.getWebContext().project.id;
  const dlpConfig = await getDlpConfig();
  if (dlpConfig.dlpForWorkItems === false) {
    return null;
  }
  const piiRes = await axios({
    method: 'GET',
    url: dlpConfig.dlpEndpoint,
    params: {
      project_id: projectId,
      resource_id: workItemId
    }
  });
  return get(piiRes, 'data.data') as DLPScannerResults;
};
