const { Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

Then("the first question row should have {int} score chips", (count) => {
  cy.get(SEL.questionRows)
    .first()
    .find('[data-action="set-score"]')
    .should("have.length", count);
});

Then("the first question row should have score chip {string} active", (score) => {
  cy.get(SEL.questionRows)
    .first()
    .find(`[data-action="set-score"][data-score="${score}"]`)
    .should("have.class", "is-active");
});

Then("the first question row should not have score chip {string} active", (score) => {
  cy.get(SEL.questionRows)
    .first()
    .find(`[data-action="set-score"][data-score="${score}"]`)
    .should("not.have.class", "is-active");
});

Then("the score chip {string} title on the first row should contain {string}", (score, label) => {
  cy.get(SEL.questionRows)
    .first()
    .find(`[data-action="set-score"][data-score="${score}"]`)
    .should("have.attr", "title")
    .and("include", label);
});
