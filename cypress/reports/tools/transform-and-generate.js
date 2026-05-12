const fs = require('fs');
const path = require('path');
const { generate } = require('multiple-cucumber-html-reporter');

const projectRoot = process.cwd();
const reportsDir = path.join(projectRoot, 'cypress', 'reports', 'cucumber');

// Possible locations where the test run plugin may have written wrapper JSON files
const pluginJsonDir = path.join(reportsDir, 'json');
const possibleSrcDirs = [pluginJsonDir, reportsDir];

// Output directory for the transformed cucumber JSON files that the reporter expects
const reporterJsonOut = path.join(reportsDir, 'json-for-reporter');
if (!fs.existsSync(reporterJsonOut)) fs.mkdirSync(reporterJsonOut, { recursive: true });

// Find source files from either pluginJsonDir or top-level reportsDir
let sourceFiles = [];
for (const d of possibleSrcDirs) {
  if (!fs.existsSync(d)) continue;
  const found = fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => ({ dir: d, file: f }));
  sourceFiles = sourceFiles.concat(found);
}

if (sourceFiles.length === 0) {
  // eslint-disable-next-line no-console
  console.warn('No wrapper JSON files found in', possibleSrcDirs);
}

sourceFiles.forEach(({ dir, file }) => {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  try {
    const data = JSON.parse(raw);
    // Validate wrapper JSON shape
    if (!data || !data.spec || !data.results) {
      // eslint-disable-next-line no-console
      console.warn('Skipping malformed wrapper JSON:', path.join(dir, file));
      return;
    }
    // data.results has Cypress run result structure; map to a simple cucumber json
    const feature = {
      uri: file.replace(/\.json$/, '.feature'),
      id: file.replace(/\.json$/, ''),
      keyword: 'Feature',
      name: data.spec.name || file,
      elements: [],
    };
    if (Array.isArray(data.results.tests)) {
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
    fs.writeFileSync(path.join(reporterJsonOut, file), JSON.stringify([feature], null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('transform error for', file, err && err.message);
  }
});

// Now generate HTML
generate({
  jsonDir: reporterJsonOut,
  reportPath: path.join(reportsDir, 'html'),
  metadata: { browser: { name: 'chrome' }, device: 'Local', platform: { name: process.platform } },
});
