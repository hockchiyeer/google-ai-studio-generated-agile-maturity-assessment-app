/**
 * cypress/support/commands.js
 *
 * Custom Cypress commands used across all step definitions.
 * Every command is self-contained and idempotent.
 */

const { APP_STORAGE_KEY, SEL } = require("./selectors");

// ─────────────────────────────────────────────────────────────────────────────
// Data Seeding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds localStorage with a fixture and visits the root page.
 * The fixture is injected via `onBeforeLoad` so the app scripts pick it
 * up during their first load — exactly as a real user's returning session.
 *
 * @param {string} fixtureName - Name of the fixture file (without .json)
 */
Cypress.Commands.add("seedAndVisit", (fixtureName = "seed-data-minimal") => {
  cy.fixture(fixtureName).then((seedData) => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seedData));
      },
    });
  });
  cy.get(SEL.appShell, { timeout: 10000 }).should("be.visible");
});

/**
 * Visits the root page with an empty localStorage (fresh-start user).
 */
Cypress.Commands.add("visitFresh", () => {
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.removeItem(APP_STORAGE_KEY);
    },
  });
  cy.get(SEL.appShell, { timeout: 10000 }).should("be.visible");
});

/**
 * Clears the app's localStorage key without navigating away.
 */
Cypress.Commands.add("clearAppStorage", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem(APP_STORAGE_KEY);
  });
});

/**
 * Reads and returns the parsed app data from localStorage.
 */
Cypress.Commands.add("getStoredData", () => {
  return cy.window().then((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens a named modal by clicking its trigger button.
 * @param {string} modalName - value of data-modal attribute
 */
Cypress.Commands.add("openModal", (modalName) => {
  cy.get(`[data-action="open-modal"][data-modal="${modalName}"]`).first().click();
  cy.get(SEL.modal).should("be.visible");
});

/**
 * Closes the currently open modal via the Close button.
 */
Cypress.Commands.add("closeModal", () => {
  cy.get(SEL.btnCloseModal).first().click();
  cy.get(SEL.modal).should("not.exist");
});

/**
 * Closes the currently open modal by pressing the Escape key.
 */
Cypress.Commands.add("closeModalWithEscape", () => {
  cy.get("body").trigger("keydown", { key: "Escape", bubbles: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Switches the snapshot form to single mode (if not already).
 */
Cypress.Commands.add("switchToSingleSnapshotMode", () => {
  cy.get(SEL.btnToggleSnapshotMode).then(($btn) => {
    if ($btn.text().trim().includes("Switch to Single")) {
      cy.wrap($btn).click();
    }
  });
});

/**
 * Switches the snapshot form to bulk mode (if not already).
 */
Cypress.Commands.add("switchToBulkSnapshotMode", () => {
  cy.get(SEL.btnToggleSnapshotMode).then(($btn) => {
    if ($btn.text().trim().includes("Switch to Bulk")) {
      cy.wrap($btn).click();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Score Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clicks the score chip for a given score value on the first question row.
 * @param {number} score - Score value 1-5
 */
Cypress.Commands.add("setFirstQuestionScore", (score) => {
  cy.get(SEL.questionRows)
    .first()
    .find(SEL.scoreChip(score))
    .click();
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Waits for any notice/toast to disappear (auto-dismiss is 4.2 s).
 */
Cypress.Commands.add("waitForNoticeToDismiss", () => {
  cy.get(SEL.notice, { timeout: 6000 }).should("not.exist");
});
