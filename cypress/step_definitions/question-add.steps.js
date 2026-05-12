const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user fills in the principle with {string}", (principle) => {
  cy.get(SEL.addQuestionPrincipleInput).clear().type(principle);
});

When("the user fills in the question text with {string}", (questionText) => {
  cy.get(SEL.addQuestionTextarea).clear().type(questionText);
});

When("the user submits the add-question form", () => {
  cy.get(SEL.addQuestionSubmit).click();
  // Submission triggers modal close; test should wait for app-driven UI changes where necessary
});

Then("the add-question form should have a discipline select", () => {
  cy.get(SEL.addQuestionDisciplineSelect).should("exist");
});

Then("the add-question form should have a principle input", () => {
  cy.get(SEL.addQuestionPrincipleInput).should("exist");
});

Then("the add-question form should have a question textarea", () => {
  cy.get(SEL.addQuestionTextarea).should("exist");
});

Then("the add-question discipline select should contain {string}", (option) => {
  cy.get(SEL.addQuestionDisciplineSelect).should("contain.text", option);
});
