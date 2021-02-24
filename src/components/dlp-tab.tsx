import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { Checkbox, FormControl, FormControlLabel, FormGroup } from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';

import { defaultDlpConfig, getDlpConfig, saveAzurePatToken, saveDlpConfig } from '../services/dlp';
import { DLPConfig } from '../types/dlp';
import { AlertDialog, getDefaultState as getAlertDialogDefaultState } from './branch-sync-hub/dialogs/alert-dialog';
import {
  getDefaultState as getTokenDialogDefaultState,
  TokenDialog
} from './branch-sync-hub/dialogs/token-dialog';
import { setAzurePatToken } from '../services/ado-web-hooks';
import { LoadingDialog } from './branch-sync-hub/dialogs/loading-dialog';

type DlpConfigWithoutWebHooks = Omit<DLPConfig, 'webHooks'>

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%'
  },
  formControl: {
    margin: theme.spacing(1),
    width: '100%'
  },
  text: {
    margin: theme.spacing(1),
    width: '100%'
  },
  saveButton: {
    marginTop: 16,
    marginRight: 16,
    width: 100
  },
  discardButton: {
    marginTop: 16,
    width: 100
  }
}));

export default function DLPConfigTab() {
  const classes = useStyles();
  const [document, setDocument] = React.useState<DlpConfigWithoutWebHooks | null>(null);
  const [dlpForWorkItems, setDlpForWorkItem] = React.useState(defaultDlpConfig.dlpForWorkItems);
  const [dlpForCode, setDlpForCode] = React.useState(defaultDlpConfig.dlpForCode);
  const [blockChallengeCreation, setBlockChallengeCreation] = React.useState(defaultDlpConfig.blockChallengeCreation);
  const [dlpEndpoint, setDlpEndpoint] = React.useState(defaultDlpConfig.dlpEndpoint);
  const [isEdited, setIsEdited] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [azurePersonalAccessToken, setAzurePersonalAccessToken] = React.useState('');
  const [tokenDialogState, setTokenDialogState] = React.useState(getTokenDialogDefaultState());
  const [alertDialogState, setAlertDialogState] = React.useState(getAlertDialogDefaultState());

  React.useEffect(() => {
    (async () => {
      const dlpConfig = await getDlpConfig();
      setDlpForWorkItem(dlpConfig.dlpForWorkItems);
      setDlpForCode(dlpConfig.dlpForCode);
      setBlockChallengeCreation(dlpConfig.blockChallengeCreation);
      setDlpEndpoint(dlpConfig.dlpEndpoint);
      setAzurePersonalAccessToken(dlpConfig.azurePersonalAccessToken);
      setDocument(omit(dlpConfig, ['webHooks', 'azurePersonalAccessToken']));
      setIsLoading(false);
    })();
  }, []);

  React.useEffect(() => {
    const newDocument = {
      blockChallengeCreation,
      dlpEndpoint,
      dlpForCode,
      dlpForWorkItems
    };
    setIsEdited(!isEqual(document, newDocument));
  }, [document, dlpForWorkItems, dlpForCode, blockChallengeCreation, dlpEndpoint]);

  const handleSaveButtonClick = async () => {
    try {
      let _azurePat: string = azurePersonalAccessToken;
      if (!_azurePat) {
        _azurePat = await showAzurePatDialog();
      }
      if (!_azurePat) {
        return;
      }
      setIsLoading(true);
      await setAzurePatToken(_azurePat);
      const newDocValue: DlpConfigWithoutWebHooks = {
        dlpForWorkItems,
        dlpForCode,
        blockChallengeCreation,
        dlpEndpoint
      };
      await saveDlpConfig(newDocValue);
      setDocument(newDocValue);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      showDLPEnableFailureDialog();
    }
  };

  const handleDiscardButtonClick = async () => {
    setDlpForWorkItem(document?.dlpForWorkItems!);
    setDlpForCode(document?.dlpForCode!);
    setBlockChallengeCreation(document?.blockChallengeCreation!);
    setDlpEndpoint(document?.dlpEndpoint!);
  };

  /**
   * Shows a dialog that accepts an Azure PAT token
   */
   async function showAzurePatDialog(): Promise<string> {
     return new Promise(resolve => {
       setTokenDialogState({
         isOpen: true,
         mode: 'ADO-DLP',
         externalLink: `${VSS.getWebContext().account.uri}_usersSettings/tokens`,
         onClose: (val) => {
            if (val) {
              setAzurePersonalAccessToken(val);
              saveAzurePatToken(val);
            }
            setTokenDialogState(val => ({
              ...val,
              isOpen: false
            }));
            resolve(val || '');
          }
        });
    });
  }

  /**
   * Show the failure dialog
   */
   function showDLPEnableFailureDialog() {
    setAlertDialogState({
      isOpen: true,
      text: (
        <p>Uh oh! Error occurred while trying to set up DLP web hooks. Please try again.</p>
      ),
      title: 'DLP Setup Error',
      onClose: () => {
        setAlertDialogState((val) => ({ ...val, isOpen: false }));
      },
      danger: true,
      primaryButtonText: 'OK',
      secondaryButtonText: '',
    });
  }

  return (<>
    <div className={classes.root}>
      <div>
        <TextField
          label="DLP Endpoint"
          value={dlpEndpoint}
          className={classes.text}
          placeholder='https://dlp-site.com/api/DLPTrigger?code=123123123'
          onChange={e => setDlpEndpoint(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
      <FormControl component="fieldset">
        <FormGroup aria-label="position" row>
          <FormControlLabel
            label="DLP Check for Work Items"
            control={
              <Checkbox
                color="primary"
                onChange={(_e, checked) => setDlpForWorkItem(checked)}
                checked={dlpForWorkItems}
                disabled={isLoading}
              />}
            />
          </FormGroup>
        </FormControl>
      </div>
      <div>
      <FormControl component="fieldset">
        <FormGroup aria-label="position" row>
          <FormControlLabel
            label="DLP Check for Code"
            control={
              <Checkbox
                color="primary"
                onChange={(_e, checked) => setDlpForCode(checked)}
                checked={dlpForCode}
                disabled={isLoading}
              />}
            />
          </FormGroup>
        </FormControl>
      </div>
      <div>
      <FormControl component="fieldset">
        <FormGroup aria-label="position" row>
          <FormControlLabel
            label="Block Challenge Creation on DLP Check Failure"
            control={
              <Checkbox
                color="primary"
                onChange={(_e, checked) => setBlockChallengeCreation(checked)}
                checked={blockChallengeCreation}
                disabled={isLoading}
              />}
            />
          </FormGroup>
        </FormControl>
      </div>
      <div>
        <Button
          className={classes.saveButton}
          variant="contained"
          color="primary"
          onClick={handleSaveButtonClick}
          disabled={!isEdited || !dlpEndpoint || isLoading}
          children={'Save'}
        />
        <Button
          className={classes.discardButton}
          variant="contained"
          color="primary"
          onClick={handleDiscardButtonClick}
          disabled={!isEdited || isLoading}
          children={'Discard'}
        />
      </div>
    </div>
    {/* Azure PAT Token */}
    <TokenDialog {...tokenDialogState} />
    {/* Alert Dialog */}
    <AlertDialog {...alertDialogState} />
    {/* Simple Loading Dialog */}
    <LoadingDialog open={isLoading} />
  </>);
}
