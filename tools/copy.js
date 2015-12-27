/**
 * React Starter Kit (http://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2015 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import path from 'path';
import replace from 'replace';
import Promise from 'bluebird';
import watch from './lib/watch';

/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  const ncp = Promise.promisify(require('ncp'));

  await Promise.all([
    ncp('src/public', 'dist/public'),
    ncp('src/server/views', 'dist/views'),
    ncp('package.json', 'dist/package.json')
  ]);

  replace({
    regex: '"start".*',
    replacement: '"start": "node server.js"',
    paths: ['dist/package.json'],
    recursive: false,
    silent: false,
  });

  if (global.WATCH) {
    const watcher = await watch('src/server/views/**/*.*');
    watcher.on('changed', async (file) => {
      const relPath = file.substr(path.join(__dirname, '../src/server/views/').length);
      await ncp(`src/server/views/${relPath}`, `dist/views/${relPath}`);
    });
  }
}

export default copy;
