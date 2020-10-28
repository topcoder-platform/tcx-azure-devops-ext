import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import CheckIcon from '@material-ui/icons/Check';
import AccountIcon from '@material-ui/icons/Person';
import poll from '../utils/token-poll';
import { getDeviceAuthentication } from '../services/account';
import { fetchMemberProjects } from '../services/projects';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

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

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export default function AccountTab() {
  const classes = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [projects, setProjects] = React.useState([]);
  const [projectId, setProjectId] = React.useState('');

  const buttonClassname = clsx({
    [classes.buttonSuccess]: loggedIn,
  });

  const getProjects = () => {
    const filters = {};
    filters['sort'] = 'lastActivityAt desc';
    filters['memberOnly'] = false;

    fetchMemberProjects(filters)
      .then(projects => {
        console.log(projects);
        setProjects(projects);
        VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService) => {
          dataService.getValue(VSS.getWebContext().project.id + '_TOPCODER_PROJECT', {scopeType: 'User'}).then(topcoderProjectId => {
            setProjectId(topcoderProjectId);
          });
        });
      })
      .catch((e) => {
        console.error(e);
        alert('Failed to fetch projects. ' + e.message);
    });
  };

  const handleProjectIdChange = (event) => {
    setProjectId(event.target.value);
    VSS.getService(VSS.ServiceIds.ExtensionData).then(dataService => {
      dataService.setValue(VSS.getWebContext().project.id + '_TOPCODER_PROJECT', event.target.value, {scopeType: 'User'});
    });
  };

  React.useEffect(() => {
    // Get data service
    VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
      // Get value in user scope
      dataService.getValue('access-token', {scopeType: 'User'}).then(function(value) {
        console.log('User scoped key value is ' + value);
        if (value) {
          setLoggedIn(true);
          getProjects();
        }
      });
    });
  }, []);

  const handleButtonClick = () => {
    if (!loading) {
      setLoading(true);
      getDeviceAuthentication().then(response => {
        if (response.data) {
          window.open(response.data.verification_uri_complete, "_blank");
          poll(response.data.device_code).then((data) => {
            setLoggedIn(true);
            getProjects();
            setLoading(false);
            // Get data service
            VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
              // Set value in user scope
              dataService.setValue('access-token', this.token, {scopeType: 'User'}).then(function(value) {
                console.log('Set User scoped key value is ' + value);
              });
              dataService.setValue('refresh-token', this.refreshToken, {scopeType: 'User'}).then(function(value) {
                console.log('Set User scoped key value is ' + value);
              });
            }.bind(data));
          }).catch(e => {
            alert(e);
            setLoading(false);
          });
        }
      }).catch(e => {
        setLoading(false);
        console.error(e);
        alert('Error: ' + e.message);
      });
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
            disabled={loggedIn}
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
            disabled={loading || loggedIn}
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
              {stableSort(projects, getComparator('asc', 'name'))
              .map((row) => {
                return (
                  <MenuItem value={row.id}>{row.name}</MenuItem>
                  );
              })}
            </Select>
            <FormHelperText>Please select a project</FormHelperText>
          </FormControl>
        </div>
    </div>
  );
}
