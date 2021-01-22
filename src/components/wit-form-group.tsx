import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import get from 'lodash/get';
import axios from 'axios';
import { ConditionalChildren } from 'azure-devops-ui/ConditionalChildren';

import { getChallenge } from '../services/challenges';
import {
  challengeUrl,
  onlineReviewUrl,
  challengeDirectUrl
} from '../utils/url-utils';
import { DLP_CONFIG } from '../config';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left'
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
    width: '100%'
  },
  label: {
    color: grey[800],
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'normal'
  },
  value: {
    color: 'black',
    lineHeight: '22px',
    fontSize: '14px',
    fontWeight: 500,
    verticalAlign: 'middle',
    width: '100%'
  },
  valueLink: {
    color: 'black !important',
    textDecoration: 'underline !important',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
    width: 'available',
    display: 'inline-block',
    overflow: 'hidden'
  }
}));

// TYPES
enum DLPStatus {
  UNSCANNED = 'UNSCANNED',
  NO_ISSUES = 'NO_ISSUES',
  ISSUES_FOUND = 'ISSUES_FOUND',
  OVERRIDE = 'OVERRIDE'
}

const DLPStatusLabel = {
  [DLPStatus.UNSCANNED]: 'Unscanned',
  [DLPStatus.NO_ISSUES]: 'No Issues',
  [DLPStatus.ISSUES_FOUND]: 'Issues Found',
  [DLPStatus.OVERRIDE]: 'Override'
};

interface DLPIssue {
  score: Number
  text: String
}

interface DLPScannerResults {
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

export default function WITFormGroup() {
  const classes = useStyles();
  const [challengeId, setChallengeId] = React.useState("-");
  const [legacyChallengeId, setLegacyChallengeId] = React.useState("-");
  const [topcoderDirectLink, setTopcoderDirectLink] = React.useState('');
  const [topcoderChallengeLink, setTopcoderChallengeLink] = React.useState('');
  const [onlineReviewLink, setOnlineReviewLink] = React.useState('');
  const [id, setId] = React.useState(0);
  const [piiScannerResults, setPiiScannerResults] = React.useState<DLPScannerResults | null>(null);

  /**
   * This effect runs when the value of the "id" variable changes (on initial page load)
   * This sets the values for the various label fields and links.
   */
  React.useEffect(() => {
    async function initFields() {
      if (!id) {
        return;
      }
      // Get Extension Data service
      const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
      // Project ID is used as prefix in all field keys, store it as constant
      const ctxProjectId = VSS.getWebContext().project.id;
      // Get values for challenge ID and legacy ID fields.
      const dataKeys = {
        challengeIdKey: `${ctxProjectId}_${id}`,
        legacyChallengeIdKey: `${ctxProjectId}_${id}_LEGACY_ID`
      };
      let res = await dataService.getValues([dataKeys.challengeIdKey, dataKeys.legacyChallengeIdKey], {scopeType: 'User'});
      const cId = res[dataKeys.challengeIdKey];
      let legacyId = res[dataKeys.legacyChallengeIdKey];
      // Fetch legacy ID from TC API if it doesn't exist, and store it in Extension Data
      if (cId && cId !== '-' && !legacyId) {
        res = await getChallenge(cId);
        legacyId = get(res, 'data.legacyId');
        if (legacyId) {
          await dataService.setValue(`${`${ctxProjectId}_${id}`}_LEGACY_ID`, legacyId, {scopeType: 'User'});
        }
      }
      // Set Legacy ID label and Legacy ID-related links
      if (legacyId) {
        setLegacyChallengeId(legacyId);
        setTopcoderDirectLink(challengeDirectUrl(legacyId));
        setOnlineReviewLink(onlineReviewUrl(legacyId));
      }
      // Set Challenge ID label and Challenge ID-related links
      if (cId) {
        setTopcoderChallengeLink(challengeUrl(cId));
        setChallengeId(cId);
      }
      VSS.notifyLoadSucceeded();
    }
    initFields();
  }, [id]);

  React.useEffect(() => {
    VSS.require(['TFS/WorkItemTracking/Services'], async function (_WorkItemServices: any) {
      const service = await _WorkItemServices.WorkItemFormService.getService();
      // Get the current values for a few of the common fields
      const fieldList = ['System.Id'];
      const value = await service.getFieldValues(fieldList);
      if (!value['System.Id']) {
        return;
      }
      const workItemId = value['System.Id'];
      const projectId = VSS.getWebContext().project.id;
      const piiRes = await axios({
        method: 'GET',
        url: DLP_CONFIG.DLP_ENDPOINT,
        params: {
          code: DLP_CONFIG.DLP_ENDPOINT_CODE,
          project_id: projectId,
          resource_id: workItemId
        }
      });
      setPiiScannerResults(piiRes.data.data);
    });
  }, []);

  React.useEffect(() => {
    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices: any) {
      VSS.register("tcx-wit-form-group", function () {
        return {
          onFieldChanged: () => {},
          onLoaded: function (args: any) {
            if (args.id) {
              setId(args.id);
            }
          },
          onUnloaded: () => {},
          onSaved: (args: any) => setId(args.id),
          onReset: () => {},
          onRefreshed: () => {}
        };
      });
    });

  }, [challengeId, id]);

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        {/* Challenge ID */}
        <Box pb={0.5}>
          <Box className={classes.label}>Challenge ID</Box>
          <Box mt={0.5} className={classes.value}>{challengeId}</Box>
        </Box>
        {/* Legacy ID */}
        <Box py={0.5}>
          <Box className={classes.label}>Legacy ID</Box>
          <Box mt={0.5} className={classes.value}>
            {legacyChallengeId}
          </Box>
        </Box>
        {/* External Links */}
        <Box py={0.5}>
          <Box className={classes.label}>External Links</Box>
          {!(topcoderChallengeLink || topcoderDirectLink || onlineReviewLink) && <Box mt={0.5} className={classes.value}>-</Box>}
          {(topcoderChallengeLink && <Box mt={0.5} className={classes.value}>
            <Link target="_blank" rel="noreferrer" className={classes.valueLink} href={topcoderChallengeLink}>Topcoder Challenge</Link>
          </Box>)}
          {(topcoderDirectLink && <Box mt={0.5} className={classes.value}>
            <Link target="_blank" rel="noreferrer" className={classes.valueLink} href={topcoderDirectLink}>Topcoder Direct</Link>
          </Box>)}
          {(onlineReviewLink && <Box mt={0.5} className={classes.value}>
            <Link target="_blank" rel="noreferrer" className={classes.valueLink} href={onlineReviewLink}>Online Review</Link>
          </Box>)}
        </Box>
        <ConditionalChildren renderChildren={!!piiScannerResults}>
          <Box py={0.5}>
            <Box className={classes.label}>DLP Results</Box>
            {(piiScannerResults?.dlpStatus && <Box className={classes.value}>
              Workitem Status: { DLPStatusLabel[piiScannerResults!.dlpStatus] }
            </Box>)}
            {(piiScannerResults?.titleStatus?.status && <Box className={classes.value}>
              Title: { DLPStatusLabel[piiScannerResults!.titleStatus.status] }
            </Box>)}
            {(piiScannerResults?.detailsStatus?.status && <Box className={classes.value}>
              Details: { DLPStatusLabel[piiScannerResults!.detailsStatus.status] }
            </Box>)}
            {(piiScannerResults?.acceptanceCriteriaStatus?.status && <Box className={classes.value}>
              Acceptance Criteria: { DLPStatusLabel[piiScannerResults!.acceptanceCriteriaStatus.status] }
            </Box>)}
            {(piiScannerResults?.reproductionStepsStatus?.status && <Box className={classes.value}>
              Reproduction Steps: { DLPStatusLabel[piiScannerResults!.reproductionStepsStatus.status] }
            </Box>)}
            {(piiScannerResults?.descriptionStatus?.status && <Box className={classes.value}>
              Description: { DLPStatusLabel[piiScannerResults!.descriptionStatus.status] }
            </Box>)}
            {(piiScannerResults?.systemInfoStatus?.status && <Box className={classes.value}>
              System Info: { DLPStatusLabel[piiScannerResults!.systemInfoStatus.status] }
            </Box>)}
            {(piiScannerResults?.analysisStatus?.status && <Box className={classes.value}>
              Analysis: { DLPStatusLabel[piiScannerResults!.analysisStatus.status] }
            </Box>)}
          </Box>
        </ConditionalChildren>
      </div>
    </div>
  );
}
