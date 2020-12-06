import React from 'react';
import TurndownService from 'turndown';
import sortBy from 'lodash/sortBy';
import get from 'lodash/get';
import find from 'lodash/find';
import isEqual from 'lodash/isEqual';
import findIndex from 'lodash/findIndex';

import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { Button } from "azure-devops-ui/Button";
import { makeStyles } from '@material-ui/core/styles';

import { createOrUpdateChallenge } from '../services/challenges';
import { fetchMemberProjects } from '../services/projects';

// Turndown Service (Used to convert HTML into MarkDown)
const turndownService = new TurndownService();


const projectSelection = new DropdownSelection();

// Styles
const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
    width: 400
  },
  formControl: {
    margin: theme.spacing(1.5),
    width: '100%'
  },
  sendButton: {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    margin: theme.spacing(1.5)
  },
  dropdownLabel: {
    display: 'block',
    marginBottom: '8px'
  }
}));

export default function WITFormPage() {
  const classes = useStyles();

  const [saving, setSaving] = React.useState(false);
  const [id, setId] = React.useState();
  const [witId, setWitId] = React.useState('');
  const [challengeId, setChallengeId] = React.useState('-');
  const [projectId, setProjectId] = React.useState(-1);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [privateDescription, setPrivateDescription] = React.useState('');
  const [prize, setPrize] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [isEdited, setIsEdited] = React.useState(false);
  const [initialValues, setInitialValues] = React.useState({ prize: '', title: '', description: '', privateSpecificaton: '' });

  /**
   * Builds a URL for a Work Item
   * @param id Work Item ID
   */
  const buildWorkItemUrl = (id: string) => {
    return `https://dev.azure.com/${VSS.getWebContext().host.name}/${VSS.getWebContext().project.name}/_workitems/edit/${id}`;
  };

  /**
   * Creates a TC challenge, given a set of parameters
   * @param params Challenge Parameters
   * @param params.id Work Item's ID
   * @param params.challengeId (Optional) Challrnge ID
   * @param params.title Challenge's Title
   * @param params.body Challenge's Description
   * @param params.privateDescription Challenge's Private Description
   * @param params.prize Challenge's Prize
   * @param params.projectId Project ID udder which Challenge will be created
   */
  const createOrUpdateTopcoderChallenge = async (params: {
    id: string,
    challengeId: string,
    title: string,
    body: string,
    privateDescription: string,
    prize: number,
    projectId: number
  }) => {
    // Get Extension Data service
    const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
    try {
      setSaving(true);
      // Format body and create challenge
      const bodyWithRef = `${params.body}\n\n### Reference: ${buildWorkItemUrl(params.id)}`;
      const res = await createOrUpdateChallenge({
        name: params.title,
        challengeId: params.challengeId,
        detailedRequirements: bodyWithRef,
        projectId: Number(params.projectId),
        directProjectId: get(find(projects, { id: Number(params.projectId) }), 'directProjectId'),
        prize: params.prize,
        privateDescription: params.privateDescription
      });
      // Set Initial Value
      setInitialValues({
        description,
        privateSpecificaton: privateDescription,
        prize,
        title
      });
      // Update UI
      setSent(true);
      setChallengeId(res.data.id);
      // Save challenge details in Azure
      const ctxProjectId = VSS.getWebContext().project.id;
      const values = {
        [`${ctxProjectId}_${id}`]: res.data.id,
        [`${ctxProjectId}_${id}_PRIZE`]: prize.toString(),
        [`${ctxProjectId}_${id}_TITLE`]: params.title,
        [`${ctxProjectId}_${id}_DESC`]: params.body,
        [`${ctxProjectId}_${id}_PRIVATE_DESC`]: params.privateDescription,
        [`${ctxProjectId}_${id}_TC_PROJECT`]: params.projectId,
      };
      await dataService.setValues(values, { scopeType: 'User' });
    } catch (error) {
      console.error(error);
      alert(`Error sending work item to Topcoder. ${get(error, 'response.status')} ${get(error, 'response.data')}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * This effect runs when the value of the "id" variable changes (on initial page load)
   * This retrieves the values for the various input fields and assigns them.
   * The "Select Project" field is not handled here.
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
      // Set values for the challenge ID, title, description, prize, private description and project ID fields.
      const dataKeys = {
        challengeIdKey: `${ctxProjectId}_${id}`,
        titleKey: `${ctxProjectId}_${id}_TITLE`,
        descKey: `${ctxProjectId}_${id}_DESC`,
        prizeKey: `${ctxProjectId}_${id}_PRIZE`,
        privateDescriptionKey: `${ctxProjectId}_${id}_PRIVATE_DESC`,
        projectIdKey: `${ctxProjectId}_${id}_TC_PROJECT`,
        defaultProjectIdKey: `${ctxProjectId}_TOPCODER_PROJECT`
      };
      const res = await dataService.getValues(Object.values(dataKeys), { scopeType: 'User' });
      const cId = res[dataKeys.challengeIdKey];
      if (cId) {
        setSent(true);
        setTitle(res[dataKeys.titleKey]);
        setDescription(res[dataKeys.descKey]);
        setPrize(res[dataKeys.prizeKey]);
        setPrivateDescription(res[dataKeys.privateDescriptionKey]);
        setProjectId(res[dataKeys.projectIdKey]);
        setInitialValues({
          title: res[dataKeys.titleKey],
          description: res[dataKeys.descKey],
          prize: res[dataKeys.prizeKey],
          privateSpecificaton: res[dataKeys.privateDescriptionKey]
        });
      } else {
        // Set default Project ID
        setProjectId(res[dataKeys.defaultProjectIdKey]);
      }
      setChallengeId(cId || '-');
    }
    initFields();
  }, [id]);

  /**
   * This is run on the page's initial render.
   * It populates the project select input.
   */
  React.useEffect(() => {
    async function getProjects() {
      try {
        // Fetch the user's projects.
        const filters = {
          sort: 'lastActivityAt desc',
          memberOnly: false
        };
        const projects = await fetchMemberProjects(filters);
        // Sort the projects and set their value
        setProjects(sortBy(projects, ['name']).map(o => ({ ...o, id: `${o.id}`, text: o.name })));
      } catch (e) {
        console.error(e);
        alert('Failed to fetch projects. ' + e.message);
      }
    }
    getProjects();
  }, []);

  React.useEffect(() => {
    // debugger;
    const idx = findIndex(projects, { id: `${projectId}` });
    if (idx >= 0) {
      projectSelection.select(idx);
    }
  }, [projectId, projects]);

  /**
   * Checks if values can be saved
   */
  React.useEffect(() => {
    const alteredInitialValue: typeof initialValues = {
      description,
      privateSpecificaton: privateDescription,
      prize,
      title
    };
    setIsEdited(!isEqual(alteredInitialValue, initialValues));
  }, [description, privateDescription, prize, title, initialValues]);

  /**
   * This effect is run on the page's initial render.
   * It retrieves WorkItem/DevOps Project-related information using the VSS Extension SDK.
   */
  React.useEffect(() => {
    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices: any) {
      /**
       * This function extracts the default title and description for the challenge from the work-item.
       */
      async function updateField() {
        // Register a listener for the work item group contribution.
        const service = await _WorkItemServices.WorkItemFormService.getService();
        // Get the current values for a few of the common fields
        const fieldValues = await service.getFieldValues(["System.Id", "System.Title", "System.Description", "System.Tags"]);
        // Set the work-item ID, title and description
        setWitId(fieldValues["System.Id"]);
        setTitle(fieldValues["System.Title"]);
        setDescription(turndownService.turndown(fieldValues["System.Description"]));
      }
      updateField();

      VSS.register("tcx-wit-form-page", function () {
        return {
          onFieldChanged: () => updateField(),
          onLoaded: function (args: any) {
            if (!args.id) {
              return;
            }
            setId(args.id);
          },
          onUnloaded: () => {},
          onSaved: () => updateField(),
          onReset: () => {},
          onRefreshed: () => {}
        };
      });
      VSS.notifyLoadSucceeded();
    });
  }, []);

  /**
   * This is called when the "Send to Topcoder" button is clicked.
   * Validates the user-entered parameters, and creates a Topcoder challenge if validation succeeds.
   */
  const handleSendButtonClick = () => {
    if (!witId) {
      alert('Unable to send unsaved work items. Please save it first.');
      return;
    }
    if (!projectId) {
      alert('Please select a project.');
      return;
    }
    // Validation succeeded. Create a Topcoder challenge.
    createOrUpdateTopcoderChallenge({
      id: witId,
      challengeId,
      title,
      body: description,
      privateDescription,
      prize: prize ? parseInt(prize) : 0,
      projectId
    });
  };

  const handleDiscardButtonClicked = () => {
    const { description, privateSpecificaton, prize, title } = initialValues;
    setDescription(description);
    setPrivateDescription(privateSpecificaton);
    setPrize(prize);
    setTitle(title);
  };

  return (
    <div className={classes.root}>
      {/* Work Item ID text field */}
      <TextField
        disabled
        label="Work Item Id"
        className={classes.formControl}
        value={witId}
        width={TextFieldWidth.auto}
        onChange={event => setWitId(event.target.value)}
      />
      {/* Challenge ID text field */}
      <TextField
        disabled
        readOnly
        label="Topcoder Challenge Id"
        className={classes.formControl}
        value={challengeId}
        width={TextFieldWidth.auto}
      />
      {/* Project selector */}
      <div className={classes.formControl}>
        <label className={classes.dropdownLabel}>Select Project</label>
        <Dropdown
          placeholder="Select Project"
          items={projects}
          disabled={sent || saving}
          selection={projectSelection}
          onSelect={(_event, item) => setProjectId(+get(item, 'id'))}
        />
      </div>
      {/* Title text Field */}
      <TextField
        label="Title"
        value={title}
        className={classes.formControl}
        onChange={event => setTitle(event.target.value)}
        readOnly={saving}
      />
      {/* Description text field */}
      <TextField
        label="Description"
        multiline
        rows={6}
        value={description}
        className={classes.formControl}
        onChange={event => setDescription(event.target.value)}
        readOnly={saving}
      />
      {/* Private Specifications text field */}
      <TextField
        label="Private Specification"
        multiline
        rows={6}
        value={privateDescription}
        className={classes.formControl}
        onChange={event => setPrivateDescription(event.target.value)}
        readOnly={saving}
      />
      {/* Prize text field */}
      <TextField
        label="Prize (Optional)"
        value={prize}
        className={classes.formControl}
        onChange={event => setPrize(event.target.value)}
        readOnly={saving}
      />
      {/* Submit button */}
      <Button
        text={sent ? 'Edit Challenge' : 'Send to Topcoder'}
        className={classes.sendButton}
        primary={true}
        disabled={(sent && !isEdited) || saving}
        onClick={handleSendButtonClick}
      />
      {sent && <Button
        text='Discard Changes'
        className={classes.sendButton}
        primary={false}
        disabled={!isEdited || saving}
        onClick={handleDiscardButtonClicked}
      />}
    </div>
  );
}
