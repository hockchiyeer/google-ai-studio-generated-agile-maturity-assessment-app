const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user imports the question text {string}", (importText) => {
  // Replace literal \n in step with actual newlines for multi-line imports
  const text = importText.replace(/\\n/g, "\n");
  cy.get(SEL.bulkImportDefaultDiscipline).select(0); // pick first discipline
  cy.get(SEL.bulkImportTextarea).clear().type(text, { parseSpecialCharSequences: false });
  cy.get(SEL.bulkImportSubmit).click();
});

When("the user submits the bulk import form with empty text", () => {
  cy.get(SEL.bulkImportTextarea).clear();
  cy.get(SEL.bulkImportSubmit).click();
});

Then("the bulk import textarea should be visible", () => {
  cy.get(SEL.bulkImportTextarea).should("be.visible");
});

Then("the bulk import discipline select should be visible", () => {
  cy.get(SEL.bulkImportDefaultDiscipline).should("be.visible");
});
