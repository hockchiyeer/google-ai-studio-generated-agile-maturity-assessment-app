const { Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

Then("the legend should contain exactly {int} cards", (count) => {
  cy.get(SEL.legendCards).should("have.length", count);
});

Then("the legend card at position {int} should contain text {string}", (position, text) => {
  cy.get(SEL.legendCards).eq(position - 1).should("contain.text", text);
});

Then("the legend should contain text {string}", (text) => {
  cy.get(SEL.legendGrid).should("contain.text", text);
});
