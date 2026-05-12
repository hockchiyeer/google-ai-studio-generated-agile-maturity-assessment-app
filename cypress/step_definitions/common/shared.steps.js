/**
 * cypress/step_definitions/common/shared.steps.js
 *
 * Step definitions shared across ALL feature files.
 * Covers: seeding, visiting, generic element assertions,
 * modal open/close, and common UI interactions.
 */

const { Given, When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL, APP_STORAGE_KEY } = require("../../support/selectors");

// ── Given ─────────────────────────────────────────────────────────────────────

Given("the app is seeded with {string} and visited", (fixtureName) => {
  cy.seedAndVisit(fixtureName);
});

Given("the app is visited with no saved data", () => {
  cy.visitFresh();
});

Given("the overall score stat shows {string}", (value) => {
  cy.get(SEL.statOverallScore).should("contain.text", value);
});

Given("the question count stat shows {string}", (count) => {
  cy.get(SEL.statQuestions).should("contain.text", count);
});

// ── When ──────────────────────────────────────────────────────────────────────

When("the user opens the {string} modal", (modalName) => {
  cy.openModal(modalName);
});

When("the user closes the modal", () => {
  cy.closeModal();
});

When("the user closes the modal via the Close button", () => {
  cy.get(SEL.btnCloseModal).first().click();
  cy.get(SEL.modal).should("not.exist");
});

When("the user clicks inside the modal body", () => {
  cy.get(".modal__body").click();
});

When("the user presses Escape", () => {
  cy.get("body").trigger("keydown", { key: "Escape", bubbles: true });
});

When("the user reloads the page", () => {
  cy.reload();
  cy.get(SEL.appShell).should("be.visible");
});

When("the user clicks the audit log link", () => {
  cy.get(SEL.btnAuditLog).click();
  cy.get(SEL.modal).should("be.visible");
});

When("the user deletes the first question in the table", () => {
  cy.get(SEL.questionRows)
    .first()
    .find('[data-action="delete-question"]')
    .click();
});

When("the user clicks the score chip {string} on the first question row", (score) => {
  cy.get(SEL.questionRows)
    .first()
    .find(`[data-action="set-score"][data-score="${score}"]`)
    .click();
});

When("the user selects {string} in the filter dropdown", (disciplineName) => {
  cy.get(SEL.filterSelect).select(disciplineName);
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then("the element {string} should be visible", (selector) => {
  cy.get(selector).should("be.visible");
});

Then("the element {string} should not exist in the DOM", (selector) => {
  cy.get(selector).should("not.exist");
});

Then("the element {string} should exist in the DOM", (selector) => {
  cy.get(selector).should("exist");
});

Then("the element {string} should contain text {string}", (selector, text) => {
  cy.get(selector).should("contain.text", text);
});

Then("the element {string} should not contain text {string}", (selector, text) => {
  cy.get(selector).should("not.contain.text", text);
});

Then("the element {string} should have class {string}", (selector, className) => {
  cy.get(selector).should("have.class", className);
});

Then("the page title should be {string}", (title) => {
  cy.title().should("eq", title);
});

Then("the button with action {string} should be visible", (action) => {
  cy.get(`[data-action="${action}"]`).should("be.visible");
});

Then("the button with action {string} should exist in the DOM", (action) => {
  cy.get(`[data-action="${action}"]`).should("exist");
});

Then("the modal should be closed", () => {
  cy.get(SEL.modal).should("not.exist");
});

Then("the modal should still be open", () => {
  cy.get(SEL.modal).should("be.visible");
});

Then("the modal title should be {string}", (title) => {
  cy.get(SEL.modalTitle).should("contain.text", title);
});

Then("the modal should contain {string}", (text) => {
  cy.get(SEL.modal).should("contain.text", text);
});

Then("the overall score stat should show {string}", (value) => {
  cy.get(SEL.statOverallScore).should("contain.text", value);
});

Then("the target score stat should show {string}", (value) => {
  cy.get(SEL.statTargetScore).should("contain.text", value);
});

Then("the discipline count stat should show {string}", (count) => {
  cy.get(SEL.statDisciplines).should("contain.text", count);
});

Then("the question count stat should show {string}", (count) => {
  cy.get(SEL.statQuestions).should("contain.text", count);
});

Then("the overall score stat should be greater than {string}", (value) => {
  cy.get(SEL.statOverallScore)
    .invoke("text")
    .then((text) => {
      expect(parseFloat(text.trim())).to.be.greaterThan(parseFloat(value));
    });
});

Then("the overall score stat should be less than {string}", (value) => {
  cy.get(SEL.statOverallScore)
    .invoke("text")
    .then((text) => {
      expect(parseFloat(text.trim())).to.be.lessThan(parseFloat(value));
    });
});

Then("the question table should contain {string}", (text) => {
  cy.get(SEL.questionTable).should("contain.text", text);
});

Then("the question table should not contain {string}", (text) => {
  cy.get(SEL.questionTable).should("not.contain.text", text);
});

Then("the section header should show {string}", (partialText) => {
  cy.get(".section-toolbar h2").should("contain.text", partialText);
});

Then("the filter dropdown should contain {string}", (option) => {
  cy.get(SEL.filterSelect).should("contain.text", option);
});

Then("the filter dropdown should not contain {string}", (option) => {
  cy.get(SEL.filterSelect).should("not.contain.text", option);
});

Then("the audit log modal should contain an entry with action {string}", (action) => {
  cy.get(SEL.auditEntries)
    .find(".meta-badge")
    .should("contain.text", action);
});

Then("every audit entry should have a meta badge", () => {
  cy.get(SEL.auditEntries).each(($entry) => {
    cy.wrap($entry).find(".meta-badge").should("exist");
  });
});

Then("every audit entry should have a meta time element", () => {
  cy.get(SEL.auditEntries).each(($entry) => {
    cy.wrap($entry).find(".meta-time").should("exist");
  });
});

Then("exactly one {string} element should exist", (selector) => {
  cy.get(selector).should("have.length", 1);
});

Then("the app localStorage key should contain valid JSON", () => {
  cy.window().then((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    expect(raw).to.be.a("string");
    expect(() => JSON.parse(raw)).not.to.throw();
  });
});

Then("the app localStorage data should reflect a score of {int} for question {string}", (score, questionId) => {
  cy.window().then((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    const data = JSON.parse(raw);
    const question = data.questions.find((q) => q.id === questionId);
    if (question) {
      const scores = Object.values(question.scores);
      expect(scores).to.include(score);
    }
  });
});
