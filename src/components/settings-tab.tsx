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
  const [repos, setRepos] = React.useState<any[]>([]);

  const fetchRepos = async (token: string) => {
    const github = new GitHub({ token });
    const res: any = await github.getUser().listRepos();
    setRepos(res.data);
    const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
    const githubRepo: string = await dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_REPO', {scopeType: 'User'});
    setRepo(githubRepo);
  };

  React.useEffect(() => {
    (async () => {
      const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
      const githubToken: string = await dataService.getValue(VSS.getWebContext().project.id + '_GITHUB_TOKEN', {scopeType: 'User'});
      setToken(githubToken);
      if (githubToken) {
        fetchRepos(githubToken);
      }
    })();
  }, []);

  const handleSaveButtonClick = async () => {
    const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
    dataService.setValue(VSS.getWebContext().project.id + '_GITHUB_TOKEN', token, {scopeType: 'User'});
    fetchRepos(token);
  };

  const handleRepoSelected = async (event: any) => {
    setRepo(event.target.value);
    const dataService: any = await VSS.getService(VSS.ServiceIds.ExtensionData);
    dataService.setValue(VSS.getWebContext().project.id + '_GITHUB_REPO', event.target.value, {scopeType: 'User'});
  };

  return (
    <div className={classes.root}>
      <div>
        <TextField
          id="filled-basic"
          label="Github Token"
          variant="filled"
          value={token}
          className={classes.text}
          onChange={e => {
            setToken(e.target.value);
          }}
        />
      </div>
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveButtonClick}
          children={'Save'}
        />
      </div>
      <div>
        <FormControl variant="filled" className={classes.formControl}>
          <InputLabel>Select Repository</InputLabel>
          <Select
            value={repo}
            onChange={handleRepoSelected}
            children={
              repos.map((row) => (
                <MenuItem value={row.full_name}>{row.full_name}</MenuItem>
              ))
            }
          />
        </FormControl>
      </div>
    </div>
  );
}
