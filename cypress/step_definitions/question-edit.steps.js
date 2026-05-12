const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user clicks the Edit button for the principle of the first question", () => {
  cy.get(SEL.questionRows)
    .first()
    .find('[data-action="start-question-edit"][data-field="principle"]')
    .click();
});

When("the user clicks the Edit button for the question of the first question", () => {
  cy.get(SEL.questionRows)
    .first()
    .find('[data-action="start-question-edit"][data-field="question"]')
    .click();
});

When("the user clears and types {string} into the inline editor", (text) => {
  cy.get(SEL.inlineEditInput).clear().type(text);
});

When("the user clears and types {string} into the inline textarea", (text) => {
  cy.get(SEL.inlineEditTextarea).clear().type(text);
});

When("the user saves the inline edit", () => {
  cy.get(SEL.inlineEditSave).click();
});

When("the user cancels the inline edit", () => {
  cy.get(SEL.inlineEditCancel).click();
});

Then("the inline principle editor should be visible", () => {
  cy.get(SEL.inlineEditInput).should("be.visible");
});

Then("the inline principle editor should not be visible", () => {
  cy.get(SEL.inlineEditInput).should("not.exist");
});

Then("the inline question textarea editor should be visible", () => {
  cy.get(SEL.inlineEditTextarea).should("be.visible");
});
