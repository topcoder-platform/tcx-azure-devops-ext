import React from 'react';
import './App.css';
import MainTab from './components/main-tab';
import Widget from './Widget';

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
