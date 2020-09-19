import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  }
}));

export default function WITFormGroup() {
  const classes = useStyles();
  const [challengeId, setChallengeId] = React.useState("");
  const [id, setId] = React.useState(0);

  React.useEffect(() => {

    if (id && challengeId) {
      (async function run() {
        const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData); // eslint-disable-line no-undef
        await dataService.setValue(VSS.getWebContext().project.id + '_' + id, challengeId, {scopeType: 'User'}); // eslint-disable-line no-undef
      })();
    }

    VSS.require(["TFS/WorkItemTracking/Services"], function (_WorkItemServices) { // eslint-disable-line no-undef
      // Register a listener for the work item group contribution.
      function getWorkItemFormService() {
          return _WorkItemServices.WorkItemFormService.getService();
      }
  
      getWorkItemFormService().then(function(service) {            
        // Get the current values for a few of the common fields
        service.getFieldValues(["System.Id", "System.Title", "System.State", "System.CreatedDate"]).then(
            function (value) {
              console.log(value);  
            });
      });

      VSS.register("tcx-wit-form-group", function () { // eslint-disable-line no-undef
        return {
          onFieldChanged: function(args) {
            console.log('onFieldChanged');
            console.log(args);
          },
          onLoaded: function (args) {
            if (args.id) {
              setId(args.id);
              (async function run() {
                const dataService = await VSS.getService(VSS.ServiceIds.ExtensionData); // eslint-disable-line no-undef
                const cId = await dataService.getValue(VSS.getWebContext().project.id + '_' + args.id, {scopeType: 'User'}); // eslint-disable-line no-undef
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
            setId(args.id)
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

  }, [challengeId, id]);

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <TextField id="filled-basic" label="Challenge Id" variant="filled" value={challengeId} onChange={
          e => {
            setChallengeId(e.target.value)
          }
        }/>
      </div>
    </div>
  );
}
