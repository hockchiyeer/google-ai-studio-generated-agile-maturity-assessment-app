const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user clicks the bar chart toggle", () => {
  cy.get(SEL.toggleBar).click();
});

When("the user clicks the line chart toggle", () => {
  cy.get(SEL.toggleLine).click();
});

Then("the bar toggle button should be active", () => {
  cy.get(SEL.toggleBar).should("have.class", "is-active");
});

Then("the line toggle button should be active", () => {
  cy.get(SEL.toggleLine).should("have.class", "is-active");
});
