import React from "react";
import { makeStyles } from "@material-ui/core";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Dialog } from "azure-devops-ui/Dialog";

export interface IAlertDialogProps {
  isOpen: boolean;
  title: string;
  danger: boolean;
  primaryButtonText: string;
  secondaryButtonText: string | false;
  text: string | JSX.Element;
  onClose: (success?: boolean) => any;
}

const useStyles = makeStyles({
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px'
  },
  alertButton: {
    background: 'var(--palette-error, rgba(232, 17, 35, 1)) !important'
  }
});

export function getDefaultState(): IAlertDialogProps {
  return {
    isOpen: false,
    text: <></>,
    title: '',
    onClose: (_affirmation?: boolean) => {},
    primaryButtonText: '',
    secondaryButtonText: '',
    danger: false
  };
}

export function AlertDialog(props: IAlertDialogProps) {
  const classes = useStyles();

  return (
    <ConditionalChildren renderChildren={props.isOpen}>
      <Dialog
        titleProps={{ text: props.title }}
        onDismiss={() => props.onClose()}
        children={
          <div className={classes.panelContent}>
            {props.text}
          </div>
        }
        footerButtonProps={[
          ...(props.secondaryButtonText ? [{
            text: props.secondaryButtonText,
            onClick: () => props.onClose(false),
            primary: false
          }] : []),
          {
            text: props.primaryButtonText,
            onClick: () => props.onClose(true),
            primary: true,
            className: props.danger ? classes.alertButton  : undefined
          }
        ]}
      />
    </ConditionalChildren>
  );
}
