import React from 'react';
import clsx from 'clsx';
import sortBy from 'lodash/sortBy';
import get from 'lodash/get';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import AccountIcon from '@material-ui/icons/Person';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import { poll } from '../utils/token-poll';
import { getDeviceAuthentication, getDeviceToken } from '../services/account';
import { fetchMemberProjects } from '../services/projects';
import { POLL_TIMEOUT, POLL_INTERVAL } from '../config';

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
  },
  formControl: {
    margin: theme.spacing(1),
    width: 300
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  menu: {
    height: 200
  }
}));

export default function AccountTab() {
  const classes = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [projectId, setProjectId] = React.useState('');

  const buttonClassname = clsx({
    [classes.buttonSuccess]: loggedIn,
  });

  const getProjects = async () => {
    const filters = {
      sort: 'lastActivityAt desc',
      memberOnly: false
    };

    const projects = await fetchMemberProjects(filters);
    try {
        console.log(projects);
        setProjects(projects);
        const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
        const topcoderProjectId = await dataService.getValue(VSS.getWebContext().project.id + '_TOPCODER_PROJECT', {scopeType: 'User'});
        setProjectId(topcoderProjectId);
    } catch (e) {
        console.error(e);
        alert('Failed to fetch projects. ' + e.message);
    };
  };

  const handleProjectIdChange = async (event: React.ChangeEvent<{
    name?: string | undefined;
    value: any;
  }>) => {
    setProjectId(event.target.value);
    const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
    dataService.setValue(VSS.getWebContext().project.id + '_TOPCODER_PROJECT', event.target.value, {scopeType: 'User'});
  };

  React.useEffect(() => {
    // Get data service
    VSS.getService(VSS.ServiceIds.ExtensionData).then(async function (dataService: any) {
      // Get value in user scope
      const value = await dataService.getValue('access-token', {scopeType: 'User'});
        console.log('User scoped key value is ' + value);
        if (value) {
          setLoggedIn(true);
          getProjects();
        }
    });
  }, []);

  const handleButtonClick = async () => {
    if (!loading) {
      setLoading(true);
      try {
        const response = await getDeviceAuthentication();
        if (response.data) {
          window.open(response.data.verification_uri_complete, "_blank");
          const pollingFn = getDeviceToken.bind(null, response.data.device_code);
          try {
            const res = await poll(pollingFn, POLL_INTERVAL, POLL_TIMEOUT);
            debugger;
            setLoggedIn(true);
            getProjects();
            setLoading(false);
            // Get data service
            const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
            // Set value in user scope
            const accessToken = get(res, 'data.access_token');
            const refreshToken = get(res, 'data.refresh_token');
            const tokenData = {
              'access-token': accessToken,
              'refresh-token': refreshToken
            };
            await dataService.setValues(tokenData, {scopeType: 'User'});
          } catch (e) {
            alert(e);
            setLoading(false);
          }
        }
      } catch (e) {
        setLoading(false);
        console.error(e);
        alert('Error: ' + e.message);
      };
    }
  };

  return (
    <div>
      <div className={classes.root}>
        <div className={classes.wrapper}>
          <Fab
            aria-label="save"
            color="primary"
            className={buttonClassname}
            // disabled={loggedIn}
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
            // disabled={loading || loggedIn}
            onClick={handleButtonClick}
          >
            {loading ? 'Waiting for authentication' : loggedIn ? 'Logged In.': 'Login'}
          </Button>
        </div>
      </div>
      <div>
          <FormControl className={classes.formControl}>
          <InputLabel id="demo-simple-select-helper-label">Select Project</InputLabel>
          <Select
            MenuProps={{ className: classes.menu }}
            labelId="demo-simple-select-helper-label"
            id="demo-simple-select-helper"
            value={projectId}
            onChange={handleProjectIdChange}
          >
              {sortBy(projects, ['name']).map((row, idx) =>
                  <MenuItem key={idx} value={row.id}>{row.name}</MenuItem>
              )}
            </Select>
            <FormHelperText>Please select a project</FormHelperText>
          </FormControl>
        </div>
    </div>
  );
}
