const { When } = require("@badeball/cypress-cucumber-preprocessor");
const { APP_STORAGE_KEY } = require("../support/selectors");

// Wait until localStorage contains the expected score for a question.
When("the test waits for persistence to include score {int} for question {string}", (score, questionId) => {
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
  cy.window({ timeout: 10000 }).should((win) => {
    const raw = win.localStorage.getItem(APP_STORAGE_KEY);
    expect(raw, 'app localStorage raw value while waiting for discipline').to.be.a('string');
    const data = JSON.parse(raw);
    expect(data, 'parsed localStorage while waiting for discipline').to.be.ok;
    const found = data.disciplines && data.disciplines.some((d) => d && d.name && d.name.indexOf(disciplineName) >= 0);
    expect(found, `persisted discipline with name containing "${disciplineName}"`).to.be.true;
  });
});
