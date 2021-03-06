/* eslint-disable */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import "azure-devops-ui/Core/override.css";
import App from './App';
import * as serviceWorker from './serviceWorker';

// Polyfill for Edge (Text Encoder/Text Decoder)
(async function () {
  if (!window['TextEncoder']) {
    const { TextEncoder } = await import('text-encoding')
    window.TextEncoder = TextEncoder;
  }

  if (!window['TextDecoder']) {
    const { TextDecoder } = await import('text-encoding')
    window.TextDecoder = TextDecoder;
  }
})();

VSS.init({
  explicitNotifyLoaded: true
});

VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
  VSS.register("tcx-widget", function () {
      return {
          load: function (widgetSettings) {
              return WidgetHelpers.WidgetStatusHelper.Success();
          }
      }
  });
  VSS.notifyLoadSucceeded();
});

ReactDOM.render(

  <React.StrictMode>
    <App />
  </React.StrictMode>,

  document.getElementById('root')
);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
