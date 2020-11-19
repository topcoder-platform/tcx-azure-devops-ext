import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { CustomDialog } from "azure-devops-ui/Dialog";
import { PanelFooter } from "azure-devops-ui/Panel";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import React from "react";

export function LoadingDialog(props: ILoadingDialogProps) {
  return (
    <ConditionalChildren renderChildren={props.open}>
      <CustomDialog onDismiss={() => {}} modal={true}>
        <PanelFooter showSeparator className="body-m">
          <Spinner size={SpinnerSize.large} />
        </PanelFooter>
      </CustomDialog>
    </ConditionalChildren>
  );
}

export interface ILoadingDialogProps {
  open: boolean;
}
