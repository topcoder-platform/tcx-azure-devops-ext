import axios from 'axios';
import get from 'lodash/get';
import { DLPConfig, DLPScannerResults } from '../types/dlp';

export const defaultDlpConfig: DLPConfig = {
  dlpForWorkItems: false,
  dlpForCode: false,
  blockChallengeCreation: false,
  dlpEndpoint: '',
  dlpEndpointCode: '',
};

export const getDlpConfigKey = () => `${VSS.getWebContext().project.id}_DLP_CONFIG`;

export const getDlpConfig = async () => {
  // Get Extension Data service.
  const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
  // Set up document tracking variable.
  let dlpConfig = defaultDlpConfig;
  try {
    dlpConfig = await dataService.getValue<DLPConfig>(
      getDlpConfigKey(),
      { scopeType: 'User' }
    );
  } catch (err) {
    return defaultDlpConfig;
  }
  return dlpConfig;
};

export const saveDlpConfig = async (newDlpConfig: DLPConfig) => {
  const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
  dataService.setValue(
    getDlpConfigKey(),
    newDlpConfig,
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
      code: dlpConfig.dlpEndpointCode,
      project_id: projectId,
      resource_id: workItemId
    }
  });
  return get(piiRes, 'data.data') as DLPScannerResults;
};
