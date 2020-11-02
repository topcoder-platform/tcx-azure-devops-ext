import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import './App.css';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { fetchMemberProjects } from './services/projects';

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

const useStyles = makeStyles((theme) => ({
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

/**
 * Render UI for the report widget configuration feature
 */
function Widget() {
  const classes = useStyles();
  const [data, setData] = React.useState([]);
  const [projectId, setProjectId] = React.useState('');
  const [widgetHelpers, setWidgetHelpers] = React.useState(null);

  const handleChange = (event) => {
    setProjectId(event.target.value);
    var customSettings = {
      data : JSON.stringify({ projectId: event.target.value })
    };
    console.log(widgetHelpers);

    if (widgetHelpers) {
      var eventName = widgetHelpers.WidgetHelpers.WidgetEvent.ConfigurationChange;
      var eventArgs = widgetHelpers.WidgetHelpers.WidgetEvent.Args(customSettings);
      widgetHelpers.widgetConfigurationContext.notify(eventName, eventArgs);
    }
  };

  React.useEffect(() => {
    VSS.init({
      explicitNotifyLoaded: true,
      usePlatformStyles: true
    });
    VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
      VSS.register("tcx-widget-report.configuration", function () {
        return {
          load: function (widgetSettings, widgetConfigurationContext) {

            setWidgetHelpers({ WidgetHelpers, widgetSettings, widgetConfigurationContext });
            const filters = {};
            filters['sort'] = 'lastActivityAt desc';
            filters['memberOnly'] = false;

            fetchMemberProjects(filters)
              .then(projects => {
                console.log(projects);
                setData(projects);
              })
              .catch((e) => {
                console.error(e);
                alert('Failed to fetch projects. ' + e.message);
            });
            return WidgetHelpers.WidgetStatusHelper.Success();
          },
          onSave: function() {
            var customSettings = {
              data : JSON.stringify({})
            };
            return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
          }
        };
      });
      VSS.notifyLoadSucceeded();
    });
  }, []);

  return (
    <div className="App">
      <FormControl className={classes.formControl}>
      <InputLabel id="demo-simple-select-helper-label">Select Project</InputLabel>
      <Select
        MenuProps={{ className: classes.menu }}
        labelId="demo-simple-select-helper-label"
        id="demo-simple-select-helper"
        value={projectId}
        onChange={handleChange}
      >
        {stableSort(data, getComparator('asc', 'name'))
        .map((row) => {
          return (
            <MenuItem value={row.id}>{row.name}</MenuItem>
            );
        })}
      </Select>
      <FormHelperText>Please select a project</FormHelperText>
    </FormControl>
  </div>
  );
}

export default Widget;
