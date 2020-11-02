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
import AccountTab from './account-tab';
import ChallengeTab from './challenges-tab';
import ProjectsTable from './projects-table';
import SettingsTab from './settings-tab';

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
          <Typography component="div">{children}</Typography>
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

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

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
        <Tab label="Account" {...a11yProps(0)} />
        <Tab label="Projects" {...a11yProps(1)} />
        <Tab label="Challenges" {...a11yProps(2)} />
        <Tab label="Settings" {...a11yProps(3)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <AccountTab />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ProjectsTable />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ChallengeTab />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SettingsTab />
      </TabPanel>
    </div>
  );
}
