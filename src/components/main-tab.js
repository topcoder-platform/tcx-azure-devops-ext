/**
 * Create view for showing the projects or challenges options.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ChallengeTab from './challenges-tab';
import ProjectsTable from './projects-table'
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: 224,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tokenTextEdit: {
    width: 500
  }
}));

export default function VerticalTabs() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const [token, setToken] = React.useState("");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    // Get data service
    VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) { // eslint-disable-line no-undef
      // Get value in user scope
      dataService.getValue("token", {scopeType: "User"}).then(function(value) {
        console.log("User scoped key value is " + value);
        setToken(value)
      });
    });
  }, []);

  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        className={classes.tabs}
      >
        <Tab label="Login" {...a11yProps(0)} />
        <Tab label="Projects" {...a11yProps(1)} />
        <Tab label="Challenges" {...a11yProps(2)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <TextField id="filled-basic" label="Token" variant="filled" className={classes.tokenTextEdit} value={token} onChange={
          e => {
            setToken(e.target.value)
          }
        }/>
        <br/>
        <br/>
        <Button variant="contained" color="primary" onClick={() => { 
          // Get data service
          VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) { // eslint-disable-line no-undef
            // Set value in user scope
            dataService.setValue("token", this.token, {scopeType: "User"}).then(function(value) {
              console.log("Set User scoped key value is " + value);
            });
          }.bind({token}));
         }}>
          Save
        </Button>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ProjectsTable />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ChallengeTab />
      </TabPanel>
    </div>
  );
}
