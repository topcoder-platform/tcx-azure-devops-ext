import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import isEqual from 'lodash/isEqual';
import { Checkbox, FormControl, FormControlLabel, FormGroup } from '@material-ui/core';
import { defaultDlpConfig, DLPConfig, getDlpConfig, saveDlpConfig } from '../services/dlp';

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
  const [document, setDocument] = React.useState<DLPConfig | null>(null);
  const [dlpForWorkItems, setDlpForWorkItem] = React.useState(defaultDlpConfig.dlpForWorkItems);
  const [dlpForCode, setDlpForCode] = React.useState(defaultDlpConfig.dlpForCode);
  const [blockChallengeCreation, setBlockChallengeCreation] = React.useState(defaultDlpConfig.blockChallengeCreation);
  const [dlpEndpoint, setDlpEndpoint] = React.useState(defaultDlpConfig.dlpEndpoint);
  const [dlpEndpointCode, setDlpEndpointCode] = React.useState(defaultDlpConfig.dlpEndpointCode);
  const [isEdited, setIsEdited] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const dlpConfig = await getDlpConfig();
      setDocument(dlpConfig);
      setDlpForWorkItem(dlpConfig.dlpForWorkItems);
      setDlpForCode(dlpConfig.dlpForCode);
      setBlockChallengeCreation(dlpConfig.blockChallengeCreation);
      setDlpEndpoint(dlpConfig.dlpEndpoint);
      setDlpEndpointCode(dlpConfig.dlpEndpointCode);
    })();
  }, []);

  React.useEffect(() => {
    const newDocument = {
      blockChallengeCreation,
      dlpEndpoint,
      dlpEndpointCode,
      dlpForCode,
      dlpForWorkItems
    };
    setIsEdited(!isEqual(document, newDocument));
  }, [document, dlpForWorkItems, dlpForCode, blockChallengeCreation, dlpEndpoint, dlpEndpointCode]);

  const handleSaveButtonClick = async () => {
    const newDocValue = {
      dlpForWorkItems,
      dlpForCode,
      blockChallengeCreation,
      dlpEndpoint,
      dlpEndpointCode
    };
    setDocument(newDocValue);
    saveDlpConfig(newDocValue);
  };

  const handleDiscardButtonClick = async () => {
    setDlpForWorkItem(document?.dlpForWorkItems!);
    setDlpForCode(document?.dlpForCode!);
    setBlockChallengeCreation(document?.blockChallengeCreation!);
    setDlpEndpoint(document?.dlpEndpoint!);
    setDlpEndpointCode(document?.dlpEndpointCode!);
  };

  return (
    <div className={classes.root}>
      <div>
        <TextField
          label="DLP Endpoint"
          value={dlpEndpoint}
          className={classes.text}
          onChange={e => setDlpEndpoint(e.target.value)}
        />
      </div>
      <div>
        <TextField
          label="DLP Endpoint Code"
          value={dlpEndpointCode}
          className={classes.text}
          onChange={e => setDlpEndpointCode(e.target.value)}
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
          disabled={!isEdited}
          children={'Save'}
        />
        <Button
          className={classes.discardButton}
          variant="contained"
          color="primary"
          onClick={handleDiscardButtonClick}
          disabled={!isEdited}
          children={'Discard'}
        />
      </div>
    </div>
  );
}
