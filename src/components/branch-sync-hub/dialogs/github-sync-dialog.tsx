import copy from 'clipboard-copy';
import { makeStyles } from "@material-ui/core";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { CustomDialog } from "azure-devops-ui/Dialog";
import { CustomHeader, HeaderTitleArea } from "azure-devops-ui/Header";
import { IconSize } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { Button } from "azure-devops-ui/Button";
import { PanelContent, PanelFooter } from "azure-devops-ui/Panel";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { TextField, TextFieldStyle, TextFieldWidth } from "azure-devops-ui/TextField";
import React from "react";
import { IGithubAuthInitResponse } from "../../../services/github";

const useStyles = makeStyles({
  title: {
    height: "500px",
    width: "500px",
    maxHeight: "32px"
  },
  panelContentWithMargin: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    marginTop: '16px',
    marginBottom: '16px'
  },
  textParagraph: {
    marginTop: '4px',
    marginBottom: '4px'
  },
  deviceCodeContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: '4px',
  },
  deviceCodeTextFieldContainer: {
    flex: '1'
  },
  deviceCodeTextField: {
    padding: '4px 0'
  },
  label: {
    marginTop: '12px'
  },
  boldFont: {
    fontWeight: 'bold'
  }
});

export function GithubSyncDialog(props: IGithubSyncDialogProps) {
  const classes = useStyles();

  return (
    <ConditionalChildren renderChildren={props.isOpen}>
      <CustomDialog onDismiss={() => props.onClose()} modal={true}>
        <CustomHeader className="bolt-header-with-commandbar" separator>
          <HeaderTitleArea>
            <div className="flex-grow scroll-hidden" style={{ marginRight: "16px" }}>
              <div className={"title-m " + classes.title}>Github Authorization</div>
            </div>
          </HeaderTitleArea>
        </CustomHeader>
        <PanelContent className={classes.panelContentWithMargin}>
          {!props.initResponse && <>
            <div className={classes.textParagraph}>
              Contacting Github to initialize authorization procedure. Please wait.
            </div>
          </>}
          {props.initResponse && <>
            <div className={classes.textParagraph}>
              Please authorize the extension to access the Github repository.
            </div>
            <div className={classes.textParagraph}>
              To authorize, open the Verification link listed below and paste in the User Code to complete the authorization process.
            </div>
            <label className={classes.label}>Verification Link</label>
            <div className={classes.textParagraph}>
              <Link
                className={classes.boldFont}
                href={props.initResponse?.verification_uri}
                target="_blank" rel="noopener noreferrer"
                children={props.initResponse?.verification_uri}
              />
            </div>
            <label className={classes.label}>User Code</label>
            <div className={classes.deviceCodeContainer}>
              <TextField
                readOnly={true}
                className={classes.deviceCodeTextField}
                containerClassName={classes.deviceCodeTextFieldContainer}
                value={props.initResponse?.user_code}
                style={TextFieldStyle.inline}
                width={TextFieldWidth.auto}
              />
              <Button
                primary={true}
                onClick={() => copy(props.initResponse!.user_code)}
                iconProps={{
                  iconName: 'Copy',
                  size: IconSize.medium
                }}
              />
            </div>
          </>}
        </PanelContent>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.medium} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>
  );
}

export interface IGithubSyncDialogProps {
  isOpen: boolean;
  onClose: (...args: any) => any;
  initResponse?: IGithubAuthInitResponse;
}
