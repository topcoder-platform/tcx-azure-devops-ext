import React from 'react';
import './App.css';
import Iframe from 'react-iframe'
import { getReport } from './services/projects'

/**
 * Render UI for the widget feature
 */
function Widget() {

  const [projectId, setProjectId] = React.useState(null);
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    VSS.init({ // eslint-disable-line no-undef
      explicitNotifyLoaded: true,
      usePlatformStyles: true
    });

    VSS.require(["TFS/Dashboards/WidgetHelpers"], function (WidgetHelpers) { // eslint-disable-line no-undef
			WidgetHelpers.IncludeWidgetStyles();
            VSS.register("tcx-widget-report", function () { // eslint-disable-line no-undef
                var getQueryInfo = function (widgetSettings) {
                    // Extract query path from widgetSettings.customSettings and ask user to configure one if none is found
                    console.log('This is my log a');
                    console.log(widgetSettings);
                    if (widgetSettings.customSettings.data) {
                      var settings = JSON.parse(widgetSettings.customSettings.data);
                      console.log('This is my log b');
                      console.log(settings);
                      if (settings) {
                        setProjectId(settings.projectId)
                        getReport(settings.projectId).then(url => {
                          console.log('This is my log c');
                          console.log(url);
                          setUrl(url)
                        }).catch(e => {
                          console.error(e);                          
                        })
                      }
                    }
                    return WidgetHelpers.WidgetStatusHelper.Success();
                }
                return {
                    load: function (widgetSettings) {
                        // // Set your title
                        // var $title = $('h2.title');
                        // $title.text('Hello World');

                        return getQueryInfo(widgetSettings);
                    },
                    reload: function (widgetSettings) {
                        return getQueryInfo(widgetSettings);
                    }
                }
            });
            VSS.notifyLoadSucceeded(); // eslint-disable-line no-undef
        });
  }, []);

  return (
    <div className="App">
      {projectId ? 
      <Iframe url={url} width="100%" height="100%"/> : 'No project selected. Please select at the configure menu.'}
    </div>
  );
}

export default Widget;
