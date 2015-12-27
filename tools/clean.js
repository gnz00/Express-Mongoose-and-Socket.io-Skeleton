'use strict';
/**
 * React Starter Kit (http://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2015 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import del from 'del';
import fs from './lib/fs';

/**
 * Cleans up the output (dist) directory.
 */
async function clean() {
  await del(['.tmp', 'dist/*', '!dist/.git'], { dot: true });
  await fs.makeDir('dist/public');
}

export default clean;
