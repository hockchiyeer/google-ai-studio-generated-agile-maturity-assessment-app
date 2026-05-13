// Persistence debug helper (moved out of Cypress test tree to avoid accidental runs)
describe('Persistence debug helper', () => {
  it('sets a score and writes stored data for local inspection', () => {
    cy.seedAndVisit('seed-data-minimal');
    cy.setFirstQuestionScore(5);
    // wait slightly longer than the app debounce to ensure persistence runs
    cy.wait(500);
    cy.getStoredData().then((data) => {
      // eslint-disable-next-line no-console
      console.log('STORED_DATA_DEBUG:', JSON.stringify(data, null, 2));
      cy.writeFile('cypress/reports/cucumber/debug/stored-data-after-score.json', JSON.stringify(data, null, 2));
    });
  });
});
