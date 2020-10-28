import React from 'react';
import TurndownService from 'turndown';
import sortBy from 'lodash/sortBy';
import get from 'lodash/get';
import find from 'lodash/find';

import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';

import { createChallenge } from '../services/challenges';
import { fetchMemberProjects } from '../services/projects';

// Turndown Service (Used to convert HTML into MarkDown)
const turndownService = new TurndownService();

// Styles
const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
    width: 400
  },
  formControl: {
    margin: theme.spacing(1),
    width: '100%'
  },
  text: {
    margin: theme.spacing(1),
    width: 400
  }
}));

export default function WITFormPage() {
  const classes = useStyles();
  const [id, setId] = React.useState();
  const [witId, setWitId] = React.useState('');
  const [challengeId, setChallengeId] = React.useState('');
  const [projectId, setProjectId] = React.useState(-1);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [privateDescription, setPrivateDescription] = React.useState('');
  const [prize, setPrize] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [projects, setProjects] = React.useState([]);

  /**
   * Builds a URL for a Work Item
   * @param {string} id Work Item ID
   */
  const buildWorkItemUrl = (id) => {
    return `https://dev.azure.com/${VSS.getWebContext().host.name}/${VSS.getWebContext().project.name}/_workitems/edit/${id}`;
  };

  /**
   * Creates a TC challenge, given a set of parameters
   * @param {Object} params Challenge Parameters
   * @param {string} params.id Work Item's ID
   * @param {string} params.title Challenge's Title
   * @param {string} params.body Challenge's Description
   * @param {string} params.privateDescription Challenge's Private Description
   * @param {string} params.prize Challenge's Prize
   * @param {string} params.projectId Project ID udder which Challenge will be created
   */
  const createTopcoderChallenge = async ({
    id,
    title,
    body,
    privateDescription,
    prize,
    projectId
  }) => {
    // Get Extension Data service
    const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData);
    try {
      // Format body and create challenge
      const bodyWithRef = body + `\n\n### Reference: ${buildWorkItemUrl(id)}`;
      const res = await createChallenge({
        name: title,
        detailedRequirements: bodyWithRef,
        projectId,
        directProjectId: get(find(projects, { id: projectId }), 'directProjectId'),
        prize,
        privateDescription
      });
      // Update UI
      setSent(true);
      setChallengeId(res.data.id);
      // Save challenge details in Azure
      const ctxProjectId = VSS.getWebContext().project.id;
      const values = {
        [`${ctxProjectId}_${id}`]: res.data.id,
        [`${ctxProjectId}_${id}_PRIZE`]: prize.toString(),
        [`${ctxProjectId}_${id}_TITLE`]: title,
        [`${ctxProjectId}_${id}_DESC`]: body,
        [`${ctxProjectId}_${id}_PRIVATE_DESC`]: privateDescription,
        [`${ctxProjectId}_${id}_TC_PROJECT`]: projectId,
      };
      await dataService.setValues(values, { scopeType: 'User' });
    } catch (error) {
      console.error(error);
      alert(`Error sending work item to Topcoder. ${get(error, 'response.status')} ${get(error, 'response.data')}`);
    }
  };

  /**
   * This effect runs when the value of the "id" variable changes (on initial page load)
   * This retrieves the values for the various input fields and assigns them.
   * The "Select Project" field is not handled here.
   */
  React.useEffect(() => {
    async function initFields () {
      if (!id) {
        return;
      }
      // Get Extension Data service
      const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData);
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
        setProjects(sortBy(projects, ['name']));
      } catch (e) {
        console.error(e);
        alert('Failed to fetch projects. ' + e.message);
      }
    }

    getProjects();
  }, []);


  /**
   * This effect is run on the page's initial render.
   * It retrieves WorkItem/DevOps Project-related information using the VSS Extension SDK.
   */
  React.useEffect(() => {
    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices) {
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
          onLoaded: function (args) {
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
    // Validation
    if (sent) {
      alert('Work item already sent to Topcoder.');
      return;
    }
    if (!witId) {
      alert('Unable to send unsaved work items. Please save it first.');
      return;
    }
    if (!prize) {
      alert('Please fill the prize field.');
      return;
    }
    if (!projectId) {
      alert('Please select a project.');
      return;
    }
    // Validation succeeded. Create a Topcoder challenge.
    createTopcoderChallenge({
      id: witId,
      title,
      body: description,
      privateDescription,
      prize: parseInt(prize),
      projectId
    });
  };

  return (
    <div className={classes.root}>
      {/* Work Item ID text field */}
      <div>
        <TextField
          id="filled-basic"
          disabled
          label="Work Item Id"
          variant="filled"
          value={witId}
          className={classes.text}
          onChange={event => setWitId(event.target.value)}
        />
      </div>
      {/* Challenge ID text field */}
      <div>
        <TextField
          id="filled-basic"
          disabled
          label="Topcoder Challenge Id"
          variant="filled"
          value={challengeId}
          className={classes.text}
          onChange={event => setTitle(event.target.value)}
          InputProps={{ readOnly: true }}
        />
      </div>
      {/* Project selector */}
      <div>
        <FormControl variant="filled" disabled={sent} className={classes.formControl}>
          <InputLabel>Select Project</InputLabel>
          <Select value={projectId} onChange={event => setProjectId(event.target.value)}>
            {projects.map((row) => (
              <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      {/* Title text Field */}
      <div>
        <TextField
          id="filled-basic"
          label="Title"
          variant="filled"
          value={title}
          className={classes.text}
          onChange={event => setTitle(event.target.value)}
          InputProps={{ readOnly: sent }}
        />
      </div>
      {/* Description text field */}
      <div>
        <TextField
          id="filled-basic"
          label="Description"
          multiline
          rows={6}
          variant="filled"
          value={description}
          className={classes.text}
          onChange={event => setDescription(event.target.value)}
          InputProps={{ readOnly: sent }}
        />
      </div>
      {/* Private Specifications text field */}
      <div>
        <TextField
          id="filled-basic"
          label="Private Specification"
          multiline
          rows={6}
          variant="filled"
          value={privateDescription}
          className={classes.text}
          onChange={event => setPrivateDescription(event.target.value)}
          InputProps={{ readOnly: sent }}
        />
      </div>
      {/* Prize text field */}
      <div>
        <TextField
          id="filled-basic"
          label="Prize"
          variant="filled"
          value={prize}
          className={classes.text}
          onChange={event => setPrize(event.target.value)}
          InputProps={{ readOnly: sent }}
        />
      </div>
      {/* Submit button */}
      <Box mx={1} my={2}>
        <Button variant="contained" color="primary" onClick={handleSendButtonClick} disabled={sent}>
          {sent ? 'Sent to Topcoder' : 'Send to Topcoder'}
        </Button>
      </Box>
    </div>
  );
}
