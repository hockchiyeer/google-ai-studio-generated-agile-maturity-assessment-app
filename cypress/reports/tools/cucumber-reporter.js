const fs = require("fs");
const path = require("path");

module.exports = function attachCucumberReporter(on, config) {
  on("after:spec", (spec, results) => {
    try {
      const projectRoot = config.projectRoot || process.cwd();
      const reportsDir = path.join(projectRoot, "cypress", "reports", "cucumber", "json");
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      const fileName = spec.name.replace(/[^a-z0-9.\-_]/gi, "_") + ".json";
      const out = {
        spec: spec,
        results: results,
        generatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(reportsDir, fileName), JSON.stringify(out, null, 2));
    } catch (err) {
      // don't let report writing break the run
      // eslint-disable-next-line no-console
      console.error("cucumber-reporter: error writing json report", err && err.message ? err.message : err);
    }
  });
};
