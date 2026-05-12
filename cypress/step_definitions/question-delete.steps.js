const { Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

// Delete question steps — the main delete When is in shared.steps.js

Then("the recovery modal should contain at least one deleted question card", () => {
  cy.get(SEL.modal).find(".list-card").should("have.length.greaterThan", 0);
});
