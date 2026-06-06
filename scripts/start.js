#!/usr/bin/env node
// Wrapper: sets env vars via process.env (no trailing space) and runs expo.
// Solves the Windows "getenv.noboolean: 1 is not a boolean" issue without
// patching expo itself.

const { spawn } = require('child_process');
const path = require('path');

process.env.EXPO_OFFLINE = '1';
process.env.EXPO_NO_TELEMETRY = '1';
// Intentionally NOT setting CI=true — that disables Metro file watching, which
// would break hot reload during development.

const args = process.argv.slice(2);
const isWin = process.platform === 'win32';
const child = isWin
  ? spawn('npx.cmd', ['expo', ...args], { stdio: 'inherit', shell: true, env: process.env })
  : spawn('npx', ['expo', ...args], { stdio: 'inherit', shell: false, env: process.env });

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to start expo:', err.message);
  process.exit(1);
});
