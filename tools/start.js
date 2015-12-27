require('babel-polyfill');

/**
 * React Starter Kit (http://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2015 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import BrowserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import run from './run';

global.WATCH = true;
const clientConfig = require('../config/webpack/client').default; // Client-side bundle configuration
const bundler = webpack(clientConfig);

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
async function start() {
  await run(require('./build'));
  await run(require('./serve'));

  const browserSync = BrowserSync.create();

  /**
   * Reload all devices when bundle is complete
   * or send a fullscreen error message to the browser instead
   */
  bundler.plugin('done', function (stats) {
      if (stats.hasErrors() || stats.hasWarnings()) {
          return browserSync.sockets.emit('fullscreen:message', {
              title: "Webpack Error:",
              body:  stripAnsi(stats.toString()),
              timeout: 100000
          });
      }
      browserSync.reload();
  });

  /**
   * Run Browsersync and use middleware for Hot Module Replacement
   */
  browserSync.init({
      proxy: {
        target: 'localhost:3000',
        middleware: [
            webpackDevMiddleware(bundler, {
                publicPath: clientConfig.output.publicPath,
                stats: {colors: true}
            }),
            webpackHotMiddleware(bundler)
        ]
      },
      open: true,
      logFileChanges: false,
      plugins: ['bs-fullscreen-message']
  });

}

export default start;
