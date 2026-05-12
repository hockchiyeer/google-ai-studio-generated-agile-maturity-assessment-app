const { Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

// All steps for 01-app-initialization.feature are covered by shared.steps.js
// This file exists as a placeholder and for any future initialization-specific steps.

Then("the app should render the full question bank", () => {
  cy.get(SEL.questionRows).should("have.length.greaterThan", 0);
});
