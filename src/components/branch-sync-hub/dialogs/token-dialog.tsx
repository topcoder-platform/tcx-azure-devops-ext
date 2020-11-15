import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Dialog } from "azure-devops-ui/Dialog";
import { TextField, TextFieldStyle, TextFieldWidth } from "azure-devops-ui/TextField";

export interface ITokenDialogProps {
  isOpen: boolean;
  onClose: (success?: string) => any;
  externalLink: string;
  mode: 'GitLab' | 'ADO';
}

export function getDefaultState(): ITokenDialogProps {
  return {
    isOpen: false,
    onClose: () => {},
    externalLink: '',
    mode: 'GitLab'
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

const composeTextData = (mode: ITokenDialogProps["mode"], context: any) => ({
  title: mode === 'ADO'
    ? 'Azure Personal Access Token'
    : 'GitLab Personal Access Token',
  introPara: mode === 'ADO'
    ? 'The Personal Access Token is required to allow the GitHub commits to be pushed to your selected Azure DevOps repo.'
    : 'The Personal Access Token is required to set up the GitLab CI Pipeline.',
}) as typeof defaultTextData;

const defaultTextData = {
  title: '',
  introPara: ''
};

export function TokenDialog(props: ITokenDialogProps) {
  const classes = useStyles();
  const [token, setToken] = useState<string | undefined>();

  const [textData, setTextData] = useState(defaultTextData);

  useEffect(() => {
    setTextData(composeTextData(props.mode, {
      externalLink: props.externalLink
    }));
  }, [props.externalLink, props.mode]);

  return (
    <ConditionalChildren renderChildren={props.isOpen}>
      <Dialog
        titleProps={{ text: textData.title }}
        onDismiss={() => props.onClose()}
        children={
          <div className={classes.panelContent}>
            <p>{textData.introPara}</p>
            <p className={classes.midParagraph}>
              <span>You can generate a PAT </span>
              <a href={props.externalLink} target="_blank" rel="noopener noreferrer">here</a>.
            </p>
            <TextField
              className={classes.textField}
              containerClassName={classes.textFieldContainer}
              placeholder="Enter the PAT token here"
              style={TextFieldStyle.inline}
              width={TextFieldWidth.auto}
              value={token}
              onChange={(_e, v) => setToken(v)}
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
            onClick: () => props.onClose(token),
            primary: true,
            disabled: !(token)
          }
        ]}
      />
    </ConditionalChildren>
  );
}
