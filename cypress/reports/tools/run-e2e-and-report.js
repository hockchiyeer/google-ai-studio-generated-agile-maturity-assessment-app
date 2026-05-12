#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

function run(command, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...opts });
    proc.on('close', (code) => resolve(code));
    proc.on('error', () => resolve(1));
  });
}

async function main() {
  // Run the existing npm script that starts server and runs Cypress
  console.log('Running E2E tests via: npm run cy:run (through start-server-and-test)');
  // Use npx start-server-and-test to ensure local dev dep usage when executed from npm
  const ssat = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const ssatArgs = ['start-server-and-test', 'serve', 'http://localhost:5500', 'cy:run'];
  const testExit = await run(ssat, ssatArgs, { cwd: process.cwd() });

  // Always attempt to generate the HTML report from the per-spec JSON artifacts
  console.log('\nE2E tests finished with exit code:', testExit);
  console.log('Running transformer + HTML generator: node ./cypress/reports/tools/transform-and-generate.js');
  const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const transformer = path.join('cypress', 'reports', 'tools', 'transform-and-generate.js');
  const transformExit = await run(nodeCmd, [transformer], { cwd: process.cwd() });

  if (transformExit !== 0) {
    console.error('Warning: transformer exited with code', transformExit);
  }

  // Exit with the original test exit code so CI detects failures when tests fail.
  process.exit(testExit);
}

main().catch((err) => {
  console.error('Unexpected error in run-e2e-and-report:', err);
  process.exit(1);
});
