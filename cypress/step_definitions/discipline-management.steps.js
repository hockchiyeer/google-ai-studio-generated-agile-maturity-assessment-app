const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user types {string} into the add discipline input", (name) => {
  cy.get(SEL.addDisciplineInput).clear().type(name);
});

When("the user submits the add discipline form", () => {
  cy.get(SEL.addDisciplineSubmit).click();
});

When("the user submits the add discipline form without a name", () => {
  cy.get(SEL.addDisciplineInput).clear();
  cy.get(SEL.addDisciplineSubmit).click();
});

When("the user clicks Rename on the first discipline", () => {
  cy.get(".list-card")
    .first()
    .find('[data-action="start-discipline-edit"]')
    .click();
});

When("the user types {string} into the rename input", (name) => {
  cy.get(".inline-editor__actions")
    .closest("form[data-action='rename-discipline']")
    .find('input[name="name"]')
    .clear()
    .type(name);
});

When("the user saves the rename", () => {
  cy.get("form[data-action='rename-discipline'] button[type='submit']").click();
});

When("the user deletes the last discipline in the list", () => {
  cy.get(".list-card")
    .last()
    .find('[data-action="delete-discipline"]')
    .click();
});

Then("the discipline list should show {string} disciplines", (count) => {
  cy.get(SEL.modal).find(".list-card").should("have.length", parseInt(count));
});

Then("the discipline list should contain {string}", (name) => {
  cy.get(SEL.modal).find(".list-card").should("contain.text", name);
});

Then("the discipline list should not contain {string}", (name) => {
  cy.get(SEL.modal).find(".list-card").should("not.contain.text", name);
});
