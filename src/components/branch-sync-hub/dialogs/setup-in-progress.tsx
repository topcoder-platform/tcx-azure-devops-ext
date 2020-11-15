import React from "react";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { CustomDialog } from "azure-devops-ui/Dialog";
import { CustomHeader, HeaderTitleArea } from "azure-devops-ui/Header";
import { PanelContent, PanelFooter } from "azure-devops-ui/Panel";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  title: {
    height: "500px",
    width: "500px",
    maxHeight: "32px"
  },
  panelContents: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    marginTop: '16px',
    marginBottom: '16px',
    minHeight: '32px !important',
    justifyContent: 'center'
  },
  textParagraph: {
    marginTop: '4px',
    marginBottom: '4px'
  }
});

export function SetupInProgress(props: ISetupInProgressProps) {
  const classes = useStyles();

  return (
    <ConditionalChildren renderChildren={props.open}>
      <CustomDialog onDismiss={() => {}} modal={true}>
        <CustomHeader className="bolt-header-with-commandbar" separator>
          <HeaderTitleArea>
            <div className="flex-grow scroll-hidden" style={{ marginRight: "16px" }}>
              <div className={"title-m " + classes.title}>Working...</div>
            </div>
          </HeaderTitleArea>
        </CustomHeader>
        <PanelContent className={classes.panelContents}>
          <div className={classes.textParagraph}>
            Setting up branch synchronization. Please wait.
          </div>
        </PanelContent>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.medium} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>
  );
}

export interface ISetupInProgressProps {
  open: boolean;
}
