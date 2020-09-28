import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { createChallenge } from '../services/challenges'
import { WEBSITE } from '../config' 

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
  const [witId, setWitId] = React.useState('');
  const [challengeId, setChallengeId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [prize, setPrize] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const buildWorkItemUrl = (id) => {
    return 'https://dev.azure.com/' + 
      VSS.getWebContext().host.name + '/' +  // eslint-disable-line no-undef
      VSS.getWebContext().project.name + '/_workitems/edit/' + id; // eslint-disable-line no-undef
  };

  const createTopcoderChallenge = (id, title, body, prize) => {
    (async function run() {
      let isProcessed = false;
      const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData); // eslint-disable-line no-undef
      const projectId = await dataService.getValue(VSS.getWebContext().project.id + '_TOPCODER_PROJECT', {scopeType: 'User'}); // eslint-disable-line no-undef
      if (projectId) {
        var bodyWithRef = body + '\n\n### Reference ' + buildWorkItemUrl(id);
        const res = await createChallenge({
          name: title,
          detailedRequirements: bodyWithRef,
          projectId,
          prize
        });
        window.open(`${WEBSITE}/challenges/${res.data.id}`, "_blank");
        setSent(true);
        setChallengeId(res.data.id);
        await dataService.setValue(VSS.getWebContext().project.id + '_' + id, res.data.id, {scopeType: 'User'}); // eslint-disable-line no-undef
        await dataService.setValue(VSS.getWebContext().project.id + '_' + id + '_PRIZE', prize.toString(), {scopeType: 'User'}); // eslint-disable-line no-undef
        await dataService.setValue(VSS.getWebContext().project.id + '_' + id + '_TITLE', title, {scopeType: 'User'}); // eslint-disable-line no-undef
        await dataService.setValue(VSS.getWebContext().project.id + '_' + id + '_DESC', body, {scopeType: 'User'}); // eslint-disable-line no-undef
        isProcessed = true;
      }
      if (!isProcessed) {
        alert('No topcoder project configured. Please configure at Topcoder X Hub -> Account.')
      }
    })();
  };  

  React.useEffect(() => {

    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices) { // eslint-disable-line no-undef
      // Register a listener for the work item group contribution.
      function getWorkItemFormService() {
          return _WorkItemServices.WorkItemFormService.getService();
      }

      function updateField() {
        getWorkItemFormService().then(function(service) {
          // Get the current values for a few of the common fields
          service.getFieldValues(["System.Id", "System.Title", "System.Description", "System.Tags"]).then(
            function (value) {
              setWitId(value["System.Id"]);
              setTitle(value["System.Title"]);
              setDescription(value["System.Description"]);
          });
        });
      }
      updateField();

      VSS.register("tcx-wit-form-page", function () { // eslint-disable-line no-undef
        return {
          onFieldChanged: function(args) {
            console.log('onFieldChanged');
            console.log(args);
            updateField();
          },
          onLoaded: function (args) {
            if (args.id) {
              (async function run() {
                const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData); // eslint-disable-line no-undef
                const cId = await dataService.getValue(VSS.getWebContext().project.id + '_' + args.id, {scopeType: 'User'}); // eslint-disable-line no-undef
                if (cId) {
                  setSent(true);
                  const title = await dataService.getValue(VSS.getWebContext().project.id + '_' + args.id + '_TITLE', {scopeType: 'User'}); // eslint-disable-line no-undef
                  const desc = await dataService.getValue(VSS.getWebContext().project.id + '_' + args.id + '_DESC', {scopeType: 'User'}); // eslint-disable-line no-undef
                  const prize = await dataService.getValue(VSS.getWebContext().project.id + '_' + args.id + '_PRIZE', {scopeType: 'User'}); // eslint-disable-line no-undef
                  setTitle(title);
                  setDescription(desc);
                  setPrize(prize);
                }
                setChallengeId(cId);
              })();
            }
            console.log('onloaded');
            console.log(args);
          },
          onUnloaded: function (args) {
            console.log('onUnloaded');
            console.log(args);
          },
          onSaved: function (args) {
            console.log('onSaved');
            console.log(args);
            updateField();
          },
          onReset: function (args) {
            console.log('onReset');
            console.log(args);
          },
          onRefreshed: function (args) {
            console.log('onRefreshed');
            console.log(args);
          }
        }
      });
      VSS.notifyLoadSucceeded(); // eslint-disable-line no-undef
    });
  }, []);

  const handleSendButtonClick = () => {
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
    createTopcoderChallenge(witId, title, description, parseInt(prize));
  };

  return (
    <div className={classes.root}>
      <div>
        <TextField id="filled-basic" disabled label="Work Item Id" variant="filled" value={witId} className={classes.text} onChange={
          e => {
            setWitId(e.target.value)
          }
        }/>
      </div>

      <div>
        <TextField id="filled-basic" label="Topcoder Challenge Id" variant="filled" value={challengeId} className={classes.text} onChange={
            e => {
              setTitle(e.target.value)
            }
          }
          InputProps={{
            readOnly: true
          }}
        />
      </div>


      <div>
        <TextField id="filled-basic" label="Title" variant="filled" value={title} className={classes.text} onChange={
          e => {
            setTitle(e.target.value)
          }
        }
        InputProps={{
          readOnly: sent
        }}
        />
      </div>
      <div>
        <TextField id="filled-basic" label="Description" multiline rows={6} variant="filled" value={description} className={classes.text} onChange={
          e => {
            setDescription(e.target.value)
          }
        }
        InputProps={{
          readOnly: sent
        }}
        />
      </div>
      <div>
        <TextField id="filled-basic" label="Prize" variant="filled" value={prize} className={classes.text} onChange={
          e => {
            setPrize(e.target.value)
          }
        }
        InputProps={{
          readOnly: sent
        }}
        />
      </div>
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendButtonClick}
        >
          Send to topcoder
        </Button>
      </div>
    </div>
  );
}
