const { defineConfig } = require("cypress");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5500",
    specPattern: "cypress/e2e/features/**/*.feature",
    supportFile: "cypress/support/e2e.js",
  screenshotsFolder: "cypress/reports/cucumber/screenshots",
    videosFolder: "cypress/videos",
    video: false,
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      // Delegate JSON report writing to a small plugin module for single responsibility
      const attachCucumberReporter = require("./cypress/plugins/cucumber-reporter");
      attachCucumberReporter(on, config);
      return config;
    },
  },
});
