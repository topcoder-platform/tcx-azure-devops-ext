import React, { useState } from "react";
import { makeStyles } from "@material-ui/core";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Dialog } from "azure-devops-ui/Dialog";
import { TextField, TextFieldStyle, TextFieldWidth } from "azure-devops-ui/TextField";

export interface IAzurePATTokenDialogProps {
  isOpen: boolean;
  onClose: (success?: string) => any;
  patManagerLink: string;
}

export function getDefaultState(): IAzurePATTokenDialogProps {
  return {
    isOpen: false,
    onClose: () => {},
    patManagerLink: ''
  };
}

const useStyles = makeStyles({
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px'
  },
  alertButton: {
    background: 'var(--palette-error, rgba(232, 17, 35, 1)) !important'
  },
  textFieldContainer: {
    marginTop: '14px',
    flex: '1'
  },
  textField: {
    padding: '4px 0'
  },
  midParagraph: {
    marginTop: 0
  }
});

export function AzurePatTokenDialog(props: IAzurePATTokenDialogProps) {
  const classes = useStyles();
  const [azurePat, setAzurePat] = useState<string | undefined>();

  return (
    <ConditionalChildren renderChildren={props.isOpen}>
      <Dialog
        titleProps={{ text: 'Azure Personal Access Token' }}
        onDismiss={() => props.onClose()}
        children={
          <div className={classes.panelContent}>
            <p>
              The Personal Access Token is required to allow the GitHub commits to be pushed to your selected Azure DevOps repo.
            </p>
            <p className={classes.midParagraph}>
              <span>You can generate a PAT </span>
              <a href={props.patManagerLink} target="_blank" rel="noopener noreferrer">here</a>.
            </p>
            <TextField
              className={classes.textField}
              containerClassName={classes.textFieldContainer}
              placeholder="Enter the PAT token here"
              style={TextFieldStyle.inline}
              width={TextFieldWidth.auto}
              value={azurePat}
              onChange={(_e, v) => setAzurePat(v)}
            />
          </div>
        }
        footerButtonProps={[
          {
            text: 'Cancel',
            onClick: () => props.onClose(),
            primary: false
          },
          {
            text: 'Set Value',
            onClick: () => props.onClose(azurePat),
            primary: true,
            disabled: !(azurePat)
          }
        ]}
      />
    </ConditionalChildren>
  );
}
