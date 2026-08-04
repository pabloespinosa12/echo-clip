'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const commandArgs = args.length > 0 ? args : ['rebuild'];
const nodeDir = path.dirname(process.execPath);
const candidates = [
  'node-gyp',
  path.resolve(nodeDir, '../lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js'),
  path.resolve(nodeDir, '../node_modules/npm/node_modules/node-gyp/bin/node-gyp.js')
];

for (const candidate of candidates) {
  const isBinary = candidate === 'node-gyp';
  if (!isBinary && !fs.existsSync(candidate)) {
    continue;
  }

  const command = isBinary ? candidate : process.execPath;
  const spawnArgs = isBinary ? commandArgs : [candidate, ...commandArgs];
  const result = spawnSync(command, spawnArgs, { stdio: 'inherit', shell: isBinary });

  if (result.status === 0) {
    process.exit(0);
  }

  if (result.error && result.error.code !== 'ENOENT') {
    process.exit(result.status ?? 1);
  }
}

console.error('Unable to find node-gyp.');
process.exit(1);