/**
 * Create view for showing the challenge options, active, new, draft, completed.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ChallengesTable from './challenges-table';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function ChallengesTabs() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: any, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
          <Tab label="Active" {...a11yProps(0)} />
          <Tab label="New" {...a11yProps(1)} />
          <Tab label="Draft" {...a11yProps(2)} />
          <Tab label="Completed" {...a11yProps(3)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <ChallengesTable status="Active"/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ChallengesTable status="New"/>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ChallengesTable status="Draft"/>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <ChallengesTable status="Completed"/>
      </TabPanel>
    </div>
  );
}
