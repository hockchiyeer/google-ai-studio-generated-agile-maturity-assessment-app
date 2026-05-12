const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user clicks the Clear All Questions button", () => {
  cy.get(SEL.btnClearAll).click();
});

When("the user confirms the clear all", () => {
  cy.get(SEL.btnConfirmClearAll).click();
});

When("the user cancels the clear all", () => {
  cy.get(SEL.btnCancelClearAll).click();
});

// Recovery modal check reused from question-delete.steps.js — covered there
