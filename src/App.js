import React from 'react';
import './App.css';
import MainTab from './components/main-tab';
import Widget from './Widget';
import ReportWidget from './ReportWidget';
import ReportWidgetConfiguration from './ReportWidgetConfiguration';
import WITFormGroup from './components/wit-form-group';
import WITFormPage from './components/wit-form-page';
import ActionsGithubController from './components/actions-github-controller';
import ActionsTopcoderController from './components/actions-topcoder-controller';

/**
 * Main App React hooks function
 */
function App() {

  function useQuery() {
    return new URLSearchParams(window.location.search);
  }

  let query = useQuery();
  console.log(query);
  let context = query.get('context');
  console.log(context);

  if (context === 'widget') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <Widget />
      </div>
    );
  }
  else if (context === 'widget-report') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ReportWidget />
      </div>
    );
  }
  else if (context === 'wit-form-group') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <WITFormGroup />
      </div>
    );
  }
  else if (context === 'wit-form-page') {
    return (
      <div>
        <header className="App-header">
        </header>
        <WITFormPage />
      </div>
    );
  }
  else if (context === 'widget-report-configuration') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ReportWidgetConfiguration />
      </div>
    );
  }
  else if (context === 'actions-send-github') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ActionsGithubController />
      </div>
    );
  }
  else if (context === 'actions-send-topcoder') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ActionsTopcoderController />
      </div>
    );
  }
  else {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <MainTab />
      </div>
    );
  }
}

export default App;
