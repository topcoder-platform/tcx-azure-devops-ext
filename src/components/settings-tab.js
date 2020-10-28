import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import GitHub from 'github-api';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
    width: '100%'
  },
  formControl: {
    margin: theme.spacing(1),
    width: '100%'
  },
  text: {
    margin: theme.spacing(1),
    width: '100%'
  }
}));

export default function SettingsTab() {
  const classes = useStyles();
  const [token, setToken] = React.useState('');
  const [repo, setRepo] = React.useState('');
  const [repos, setRepos] = React.useState([]);

  const fetchRepos = (token) => {
    const github = new GitHub({
      token
    });
    github.getUser().listRepos().then(res => {
      setRepos(res.data);
      VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService) => {
        dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_REPO', {scopeType: 'User'}).then(githubRepo => {
          setRepo(githubRepo);
        });
      });
    });
  };

  React.useEffect(() => {
    VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService) => {
      dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_TOKEN', {scopeType: 'User'}).then(githubToken => {
        setToken(githubToken);
        if (githubToken) {
          fetchRepos(githubToken);
        }
      });
    });
  }, []);

  const handleSaveButtonClick = () => {
    VSS.getService(VSS.ServiceIds.ExtensionData).then(dataService => {
      dataService.setValue(VSS.getWebContext().project.id + '_GITHUB_TOKEN', token, {scopeType: 'User'});
    });
    fetchRepos(token);
  };
  const handleRepoSelected = (event) => {
    setRepo(event.target.value);
    VSS.getService(VSS.ServiceIds.ExtensionData).then(dataService => {
      dataService.setValue(VSS.getWebContext().project.id + '_GITHUB_REPO', event.target.value, {scopeType: 'User'});
    });
  };

  return (
    <div className={classes.root}>
      <div>
        <TextField id="filled-basic" label="Github Token" variant="filled" value={token} className={classes.text} onChange={
          e => {
            setToken(e.target.value);
          }
        }/>
      </div>
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveButtonClick}
        >
          Save
        </Button>
      </div>
      <div>
        <FormControl variant="filled" className={classes.formControl}>
          <InputLabel id="demo-simple-select-filled-label">Select Repository</InputLabel>
          <Select
            labelId="demo-simple-select-filled-label"
            id="demo-simple-select-filled"
            value={repo}
            onChange={handleRepoSelected}
          >
          {repos
            .map((row) => {
              return (
                <MenuItem value={row.full_name}>{row.full_name}</MenuItem>
                );
            })}
          </Select>
        </FormControl>
      </div>
    </div>
  );
}
