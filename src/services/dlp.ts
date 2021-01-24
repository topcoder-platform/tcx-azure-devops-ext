import axios from 'axios';
import get from 'lodash/get';

export interface DLPConfig {
  dlpForWorkItems: boolean;
  dlpForCode: boolean;
  blockChallengeCreation: boolean;
  dlpEndpoint: string;
  dlpEndpointCode: string;
}

export const defaultDlpConfig: DLPConfig = {
  dlpForWorkItems: false,
  dlpForCode: false,
  blockChallengeCreation: false,
  dlpEndpoint: '',
  dlpEndpointCode: '',
};

export enum DLPStatus {
  UNSCANNED = 'UNSCANNED',
  NO_ISSUES = 'NO_ISSUES',
  ISSUES_FOUND = 'ISSUES_FOUND',
  OVERRIDE = 'OVERRIDE'
}

export interface DLPIssue {
  score: Number
  text: String
}

export const DLPStatusLabel = {
  [DLPStatus.UNSCANNED]: 'Unscanned',
  [DLPStatus.NO_ISSUES]: 'No Issues',
  [DLPStatus.ISSUES_FOUND]: 'Issues Found',
  [DLPStatus.OVERRIDE]: 'Override'
};

export interface DLPScannerResults {
  dlpStatus: DLPStatus,
  titleStatus: {
    status: DLPStatus,
    issues: DLPIssue[]
  },
  detailsStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  acceptanceCriteriaStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  reproductionStepsStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  descriptionStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  systemInfoStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  analysisStatus: {
      status: DLPStatus,
      issues: DLPIssue[]
  },
  projectId: string,
  resourceId: string
}

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
