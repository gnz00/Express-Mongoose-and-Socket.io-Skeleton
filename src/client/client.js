/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import 'babel-core/polyfill';
import ReactDOM from 'react-dom';
import FastClick from 'fastclick';
import App from './components/Application';
const appContainer = document.getElementById('app');

function run() {
  // Make taps on links and buttons work fast on mobiles
  FastClick.attach(document.body);
  ReactDOM.render(App, appContainer);
}

// Run the application when both DOM is ready and page content is loaded
if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body) {
  run();
} else {
  document.addEventListener('DOMContentLoaded', run, false);
}
