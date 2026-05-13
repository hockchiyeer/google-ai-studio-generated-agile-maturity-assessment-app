const { When } = require("@badeball/cypress-cucumber-preprocessor");
const { APP_STORAGE_KEY } = require("../support/selectors");

// Wait until localStorage contains the expected score for a question.
When("the test waits for persistence to include score {int} for question {string}", (score, questionId) => {
  // If running in Cypress, call the optional test flush helper exposed by
  // the app to force immediate persistence (avoids races with debounce).
  cy.window().then((win) => {
    if (win && win.__testFlushPersistence && typeof win.__testFlushPersistence === 'function') {
      try { win.__testFlushPersistence(); } catch (e) { /* ignore */ }
    }
    try {
      const raw = win.localStorage.getItem(APP_STORAGE_KEY);
      // write a debug snapshot for triage; keep it compact
      // guard writeFile under Cypress to avoid issues when not running tests
      if (typeof Cypress !== 'undefined') {
        try { cy.writeFile('cypress/reports/cucumber/debug/stored-data-before-wait.json', raw || 'null'); } catch (e) { /* ignore */ }
        try {
          if (win.__testGetState && typeof win.__testGetState === 'function') {
            const state = win.__testGetState();
            try { cy.writeFile('cypress/reports/cucumber/debug/memory-before-wait.json', JSON.stringify(state || {}, null, 2)); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  });

  cy.window({ timeout: 10000 }).should((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    expect(raw, 'app localStorage raw value while waiting for score').to.be.a('string');
    const data = JSON.parse(raw);
    expect(data, 'parsed localStorage while waiting for score').to.be.ok;
    const question = data.questions && data.questions.find((q) => q && q.id === questionId);
    expect(question, 'question exists in stored data while waiting for score').to.be.ok;
    const scores = Object.values(question.scores).map((s) => (typeof s === 'string' ? parseInt(s, 10) : s));
    expect(scores).to.include(score);
  });
});

// Wait until localStorage contains a question with the given principle text.
When("the test waits for persistence to include a question principle {string}", (principleText) => {
  cy.window().then((win) => {
    if (win && win.__testFlushPersistence && typeof win.__testFlushPersistence === 'function') {
      try { win.__testFlushPersistence(); } catch (e) { /* ignore */ }
    }
    try {
      const raw = win.localStorage.getItem(APP_STORAGE_KEY);
      if (typeof Cypress !== 'undefined') {
        try { cy.writeFile('cypress/reports/cucumber/debug/stored-data-before-wait-question.json', raw || 'null'); } catch (e) { /* ignore */ }
        try {
          if (win.__testGetState && typeof win.__testGetState === 'function') {
            const state = win.__testGetState();
            try { cy.writeFile('cypress/reports/cucumber/debug/memory-before-wait-question.json', JSON.stringify(state || {}, null, 2)); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  });

  cy.window({ timeout: 10000 }).should((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    expect(raw, 'app localStorage raw value while waiting for question').to.be.a('string');
    const data = JSON.parse(raw);
    expect(data, 'parsed localStorage while waiting for question').to.be.ok;
    const found = data.questions && data.questions.some((q) => q && q.principle && q.principle.indexOf(principleText) >= 0);
    expect(found, `persisted question with principle containing "${principleText}"`).to.be.true;
  });
});

// Wait until localStorage contains a discipline with the given name.
When("the test waits for persistence to include discipline {string}", (disciplineName) => {
  cy.window().then((win) => {
    if (win && win.__testFlushPersistence && typeof win.__testFlushPersistence === 'function') {
      try { win.__testFlushPersistence(); } catch (e) { /* ignore */ }
    }
    try {
      const raw = win.localStorage.getItem(APP_STORAGE_KEY);
      if (typeof Cypress !== 'undefined') {
        try { cy.writeFile('cypress/reports/cucumber/debug/stored-data-before-wait-discipline.json', raw || 'null'); } catch (e) { /* ignore */ }
        try {
          if (win.__testGetState && typeof win.__testGetState === 'function') {
            const state = win.__testGetState();
            try { cy.writeFile('cypress/reports/cucumber/debug/memory-before-wait-discipline.json', JSON.stringify(state || {}, null, 2)); } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  });

  cy.window({ timeout: 10000 }).should((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    expect(raw, 'app localStorage raw value while waiting for discipline').to.be.a('string');
    const data = JSON.parse(raw);
    expect(data, 'parsed localStorage while waiting for discipline').to.be.ok;
    const found = data.disciplines && data.disciplines.some((d) => d && d.name && d.name.indexOf(disciplineName) >= 0);
    expect(found, `persisted discipline with name containing "${disciplineName}"`).to.be.true;
  });
});
