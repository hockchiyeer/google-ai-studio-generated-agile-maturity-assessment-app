const { generate } = require('multiple-cucumber-html-reporter');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
let jsonDir = path.join(projectRoot, 'cypress', 'reports', 'cucumber', 'json');
// if plugin previously wrote to cypress/reports/cucumber (flat), support that location too
if (!fs.existsSync(jsonDir)) {
  const alt = path.join(projectRoot, 'cypress', 'reports', 'cucumber');
  jsonDir = alt;
}
const outDir = path.join(projectRoot, 'cypress', 'reports', 'cucumber', 'html');

generate({
  jsonDir,
  reportPath: outDir,
  metadata:{
    browser: {
      name: 'chrome',
    },
    device: 'Local test',
    platform: {
      name: process.platform,
    }
  },
  customData: {
    title: 'Cypress Cucumber Reports',
    data: [
      { label: 'Project', value: 'Agile Maturity Assessment' },
      { label: 'Generated', value: new Date().toISOString() }
    ]
  }
});
