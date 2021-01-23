export interface DLPConfig {
  dlpForWorkItems: boolean;
  dlpForCode: boolean;
  blockChallengeCreation: boolean;
  dlpEndpoint: string;
  dlpEndpointCode: string;
}

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
