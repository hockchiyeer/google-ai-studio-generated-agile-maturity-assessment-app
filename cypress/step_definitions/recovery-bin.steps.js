const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user clicks Recover on the first deleted question card", () => {
  cy.get(SEL.modal)
    .find('[data-action="recover-question"]')
    .first()
    .scrollIntoView()
    .click({ force: true });
});

When("the user clicks the Clear Bin button", () => {
  cy.get(SEL.btnClearBin).click();
});

When("the user confirms the clear bin", () => {
  cy.get(SEL.btnConfirmClearBin).click();
});

When("the user cancels the clear bin", () => {
  cy.get(SEL.btnCancelClearBin).click();
});

Then("the recovery modal should contain at least one deleted question card", () => {
  cy.get(SEL.modal).find(".list-card").should("have.length.greaterThan", 0);
});
