import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Dialog } from "azure-devops-ui/Dialog";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { Dropdown } from "azure-devops-ui/Dropdown";
import find from 'lodash/find';

import { ITopcoderProjectType } from "../../../types/tc-projects";
import { getProjectTypes, createProject } from "../../../services/projects";
import get from "lodash/get";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";

export interface INewProjectDialogProps {
  isOpen: boolean;
  onClose: (success?: string) => any;
}

const useStyles = makeStyles({
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px'
  },
  textFieldContainer: {
    marginTop: '14px',
    flex: '1'
  },
  textField: {
    padding: '4px 0'
  },
  dropdown: {
    marginTop: 18,
    marginBottom: 18,
    '& .bolt-textfield': {
      height: 37
    }
  },
  messageBox: {
    width: '100%',
  }
});

export function NewProjectDialog(props: INewProjectDialogProps) {
  const classes = useStyles();

  const [projectName, setProjectName] = useState<string | undefined>();
  const [projectDescription, setProjectDescription] = useState<string | undefined>();
  const [projectType, setProjectType] = useState<string | undefined>();
  const [projectTypes, setProjectTypes] = useState<ITopcoderProjectType[]>([]);
  const [creationError, setCreationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!props.isOpen) {
        return;
      }
      const projectTypes = await getProjectTypes();
      const extendedProjectTypes = (projectTypes || []).map(projectType => ({
        ...projectType,
        id: projectType.key,
        text: projectType.displayName
      }));
      setProjectTypes(extendedProjectTypes);
    })();
  }, [props.isOpen]);

  async function onCreateProjectClicked () {
    try {
      const selectedProjectType = find(projectTypes, { displayName: projectType });
      if (!selectedProjectType) {
        throw new Error('Couldn\'t find the select project type.');
      }
      await createProject({
        name: projectName!,
        description: projectDescription!,
        type: get(selectedProjectType, 'key', ''),
        version: 'v3'
      });
      props.onClose(projectName);
    } catch (err) {
      setCreationError(err.toString());
    }
  }

  return (
    <ConditionalChildren renderChildren={props.isOpen}>
      <Dialog
        titleProps={{ text: 'Create New Project' }}
        onDismiss={() => props.onClose()}
        children={
          <div className={classes.panelContent}>
            <ConditionalChildren renderChildren={!!(creationError)}>
            <MessageCard
              className={classes.messageBox}
              severity={MessageCardSeverity.Error}
              children={<div>
                <div>Error occurred while trying to create project.</div>
                <div>{creationError}</div>
              </div>}
              />
            </ConditionalChildren>
            <TextField
              className={classes.textField}
              containerClassName={classes.textFieldContainer}
              placeholder="What is the project's name?"
              // style={TextFieldStyle.inline}
              width={TextFieldWidth.auto}
              required={true}
              value={projectName}
              onChange={(_e, v) => setProjectName(v)}
            />
            <TextField
              className={classes.textField}
              containerClassName={classes.textFieldContainer}
              placeholder="Describe the project..."
              // style={TextFieldStyle.inline}
              width={TextFieldWidth.auto}
              required={true}
              value={projectDescription}
              onChange={(_e, v) => setProjectDescription(v)}
            />
            <Dropdown
              placeholder="Select Project Type"
              items={projectTypes as any}
              className={classes.dropdown}
              onSelect={(_, e) => setProjectType(e.text)}
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
            text: 'Create the project',
            onClick: () => onCreateProjectClicked(),
            primary: true,
            disabled: !(projectName) || !(projectDescription) || !(projectType)
          }
        ]}
      />
    </ConditionalChildren>
  );
}
