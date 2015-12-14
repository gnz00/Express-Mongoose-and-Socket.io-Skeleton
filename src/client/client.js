import React from 'react';
import ReactDOM from 'react-dom';
import FastClick from 'fastclick';

/** Application Root Component */
import App from './components/Application';

/** Application CSS Entrypoint */
import './less/main.less';

function run() {
  // Make taps on links and buttons work fast on mobiles
  FastClick.attach(document.body);

  // If we wanted to render a SPA
  // ReactDOM.render(<App/>, document.getElementById('app'));
}

// Run the application when both DOM is ready and page content is loaded
if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body) {
  run();
} else {
  document.addEventListener('DOMContentLoaded', run, false);
}
