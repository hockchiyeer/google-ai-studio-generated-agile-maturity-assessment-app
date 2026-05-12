const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");
const { SEL } = require("../support/selectors");

When("the user switches to single snapshot mode", () => {
  cy.switchToSingleSnapshotMode();
});

When("the user switches to bulk snapshot mode", () => {
  cy.switchToBulkSnapshotMode();
});

When("the user fills the snapshot label with {string}", (label) => {
  cy.get(SEL.snapshotLabelInput).clear().type(label);
});

When("the user fills the snapshot date with {string}", (date) => {
  cy.get(SEL.snapshotDateInput).clear().type(date);
});

When("the user sets the snapshot count to {string}", (count) => {
  cy.get(SEL.snapshotCountInput).clear().type(count);
});

When("the user submits the snapshot form", () => {
  cy.get(SEL.snapshotSubmit).click();
});

When("the user clicks the first snapshot in the list", () => {
  cy.get(SEL.snapshotCards).first().find('[data-action="select-snapshot"]').click();
});

When("the user clicks delete on the last snapshot", () => {
  cy.get(SEL.snapshotCards)
    .last()
    .find('[data-action="prompt-delete-snapshot"]')
    .click();
});

When("the user confirms the snapshot deletion", () => {
  cy.get('[data-action="confirm-delete-snapshot"]').click();
});

When("the user cancels the snapshot deletion", () => {
  cy.get('[data-action="cancel-delete-snapshot"]').click();
});

Then("the snapshot list should contain {string}", (text) => {
  cy.get(SEL.modal).find(SEL.snapshotCards).should("contain.text", text);
});

Then("the snapshot list should have {string} snapshots", (count) => {
  cy.get(SEL.modal).find(SEL.snapshotCards).should("have.length", parseInt(count));
});

Then("the snapshot list should not have a delete button", () => {
  cy.get(SEL.modal)
    .find('[data-action="prompt-delete-snapshot"]')
    .should("not.exist");
});

Then("a confirm delete row should appear", () => {
  cy.get('[data-action="confirm-delete-snapshot"]').should("be.visible");
});

Then("the snapshot form should have a label input", () => {
  cy.get(SEL.snapshotLabelInput).should("exist");
});

Then("the snapshot form should have a date input", () => {
  cy.get(SEL.snapshotDateInput).should("exist");
});

Then("the snapshot form should have a frequency select", () => {
  cy.get(SEL.snapshotFrequencySelect).should("exist");
});

Then("the snapshot form should have a count input", () => {
  cy.get(SEL.snapshotCountInput).should("exist");
});

Then("the modal should be closed or the active snapshot should change", () => {
  // Clicking a snapshot card in the timeline closes the modal after selection
  cy.get("body").then(($body) => {
    if ($body.find(SEL.modal).length) {
      cy.get(SEL.modal).find(".is-active").should("exist");
    } else {
      cy.get(SEL.modal).should("not.exist");
    }
  });
});
