import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import AccountIcon from '@material-ui/icons/Person';
import poll from '../utils/token-poll'
import { getDeviceAuthentication } from '../services/account'

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

export default function AccountTab() {
  const classes = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);

  const buttonClassname = clsx({
    [classes.buttonSuccess]: loggedIn,
  });

  React.useEffect(() => {
    // Get data service
    VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) { // eslint-disable-line no-undef
      // Get value in user scope
      dataService.getValue('access-token', {scopeType: 'User'}).then(function(value) {
        console.log('User scoped key value is ' + value);
        if (value) {
          setLoggedIn(true)
        }
      });
    });
  }, []);

  const handleButtonClick = () => {
    if (!loading) {
      setLoading(true);
      getDeviceAuthentication().then(response => {
        if (response.data) {
          window.open(response.data.verification_uri_complete, "_blank")
          poll(response.data.device_code).then((data) => {
            setLoggedIn(true);
            setLoading(false);
            // Get data service
            VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) { // eslint-disable-line no-undef
              // Set value in user scope
              dataService.setValue('access-token', this.token, {scopeType: 'User'}).then(function(value) {
                console.log('Set User scoped key value is ' + value);
              });
              dataService.setValue('refresh-token', this.refreshToken, {scopeType: 'User'}).then(function(value) {
                console.log('Set User scoped key value is ' + value);
              });
            }.bind(data));
          }).catch(e => {
            alert(e)
            setLoading(false);
          })
        }
      }).catch(e => {
        setLoading(false);
        console.error(e)
        alert('Error: ' + e.message)
      })
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <Fab
          aria-label="save"
          color="primary"
          className={buttonClassname}
          onClick={handleButtonClick}
        >
          {loading || !loggedIn ? <AccountIcon /> : <CheckIcon />}
        </Fab>
        {loading && <CircularProgress size={68} className={classes.fabProgress} />}
      </div>
      <div className={classes.wrapper}>
        <Button
          variant="contained"
          color="primary"
          className={buttonClassname}
          disabled={loading}
          onClick={handleButtonClick}
        >
          {loading? 'Waiting for authentication' : loggedIn? 'Refresh': 'Login'}
        </Button>
      </div>
    </div>
  );
}
