const fs = require('fs');
const path = require('path');
const { generate } = require('multiple-cucumber-html-reporter');

const projectRoot = process.cwd();
const reportsDir = path.join(projectRoot, 'cypress', 'reports', 'cucumber');
const jsonOutDir = path.join(reportsDir, 'json');
if (!fs.existsSync(jsonOutDir)) fs.mkdirSync(jsonOutDir, { recursive: true });

// Read all .json files in reportsDir (flat) and transform them
const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
files.forEach((file) => {
  const raw = fs.readFileSync(path.join(reportsDir, file), 'utf8');
  try {
    const data = JSON.parse(raw);
    // data.results has Cypress run result structure; map to a simple cucumber json
    const feature = {
      uri: file.replace(/\.json$/, '.feature'),
      id: file.replace(/\.json$/, ''),
      keyword: 'Feature',
      name: data.spec.name || file,
      elements: [],
    };
    if (data.results && Array.isArray(data.results.tests)) {
      data.results.tests.forEach((test) => {
        const status = test.state === 'passed' ? 'passed' : (test.state === 'failed' ? 'failed' : 'skipped');
        feature.elements.push({
          keyword: 'Scenario',
          name: test.title.join(' '),
          steps: [
            {
              name: test.title.join(' '),
              result: { status },
            },
          ],
        });
      });
    }
    // write as an array (Cucumber JSON expects array of features)
    fs.writeFileSync(path.join(jsonOutDir, file), JSON.stringify([feature], null, 2));
  } catch (err) {
    console.error('transform error for', file, err && err.message);
  }
});

// Now generate HTML
generate({
  jsonDir: jsonOutDir,
  reportPath: path.join(reportsDir, 'html'),
  metadata: { browser: { name: 'chrome' }, device: 'Local', platform: { name: process.platform } },
});
