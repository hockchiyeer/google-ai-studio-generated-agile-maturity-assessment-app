const { Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

Then("every visible question row should belong to discipline {string}", (disciplineName) => {
  cy.get(SEL.questionRows).each(($row) => {
    cy.wrap($row).find(".tag").should("contain.text", disciplineName);
  });
});
