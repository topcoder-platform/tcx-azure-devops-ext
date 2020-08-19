import React from 'react';
import './App.css';
import ChallengesTable from './components/challenges-table';

/**
 * Render UI for the widget feature
 */
function Widget() {
  return (
    <div className="App">
      <ChallengesTable status="Active"/>
    </div>
  );
}

export default Widget;
