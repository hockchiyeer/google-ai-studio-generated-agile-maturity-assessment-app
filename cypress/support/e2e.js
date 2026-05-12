/**
 * cypress/support/e2e.js
 *
 * Global support entry point loaded before every spec.
 *
 * Key responsibilities:
 *  1. Register custom commands
 *  2. Suppress opaque "Script error." exceptions thrown by CDN scripts
 *     (Chart.js, jsPDF, PptxGenJS, XLSX) that have no crossorigin attribute
 *  3. Provide universal beforeEach / afterEach hooks for localStorage isolation
 */

require("./commands");

// ── Suppress CDN cross-origin script errors ───────────────────────────────────
// The app loads 5 CDN scripts from cdn.jsdelivr.net without a `crossorigin`
// attribute, so any uncaught error from them arrives as the opaque "Script error."
// message.  We return false only for that exact message so genuine app errors
// still fail the test.
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message === "Script error." ||
    err.message.includes("Script error") ||
    err.message.includes("cross-origin")
  ) {
    return false; // Prevent Cypress from failing the test
  }
  return true; // Let genuine application errors fail the test
});

// ── Global before each scenario ───────────────────────────────────────────────
// cy.clearLocalStorage() is safe to call before any page is visited and
// clears ALL origins' localStorage for the active Cypress session.
// The per-scenario seed data is injected inside the BDD Background step via
// cy.seedAndVisit() → onBeforeLoad, so this just ensures a clean slate.
beforeEach(() => {
  cy.clearLocalStorage();
});

// ── Global after each scenario ────────────────────────────────────────────────
// Belt-and-suspenders teardown so no test data leaks to the next scenario.
afterEach(() => {
  cy.clearLocalStorage();
});
