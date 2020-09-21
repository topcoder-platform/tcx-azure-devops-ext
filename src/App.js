import React from 'react';
import './App.css';
import MainTab from './components/main-tab';
import Widget from './Widget';
import ReportWidget from './ReportWidget';
import ReportWidgetConfiguration from './ReportWidgetConfiguration';
import WITFormGroup from './components/wit-form-group';
import ActionsController from './components/actions-controller';

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
  else if (context === 'widget-report-configuration') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ReportWidgetConfiguration />
      </div>
    );
  }
  else if (context === 'actions') {
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <ActionsController />
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
