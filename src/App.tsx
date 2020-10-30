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
import BranchSyncHub from './components/branch-sync-hub';

/**
 * Main App React hooks function
 */
function App() {
  function useQuery() {
    return new URLSearchParams(window.location.search);
  }

  function renderSwitch(context: string) {
    switch(context) {
      case 'widget':
        return <Widget />;
      case 'widget-report':
        return <ReportWidget />;
      case 'wit-form-group':
        return <WITFormGroup />;
      case 'wit-form-page':
        return <WITFormPage />;
      case 'widget-report-configuration':
        return <ReportWidgetConfiguration />;
      case 'actions-send-github':
        return <ActionsGithubController />;
      case 'actions-send-topcoder':
        return <ActionsTopcoderController />;
      case 'branch-sync':
        return <BranchSyncHub />;
      default:
        return <MainTab />;
    }
  }

  let query = useQuery();
  const context = query.get('context') || '';

  return (
    <div className="App">
      <header className="App-header"></header>
      {renderSwitch(context)}
    </div>
  );
}

export default App;
