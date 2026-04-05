(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  var TEMPLATE = app.constants.PROJECT_REVIEW_TEMPLATE || null;
  var TEMPLATE_DISCIPLINES = TEMPLATE && Array.isArray(TEMPLATE.disciplines) ? TEMPLATE.disciplines : [];
  var TEMPLATE_QUESTIONS = TEMPLATE && Array.isArray(TEMPLATE.questions) ? TEMPLATE.questions : [];

  var DEFAULT_DISCIPLINES = TEMPLATE_DISCIPLINES.length
    ? TEMPLATE_DISCIPLINES.map(function (discipline) {
        return {
          id: discipline.id,
          name: discipline.name,
        };
      })
    : [
        { id: "A", name: "Agility" },
        { id: "B", name: "Overall Process" },
        { id: "C", name: "Requirements" },
        { id: "D", name: "Architecture" },
        { id: "E", name: "Implementation" },
        { id: "F", name: "Test" },
        { id: "G", name: "Operations" },
        { id: "H", name: "Buildmanagement" },
      ];

  function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  function generateSeededQuestions(snapshotId) {
    if (TEMPLATE_QUESTIONS.length) {
      return TEMPLATE_QUESTIONS.map(function (entry) {
        var scores = {};
        scores[snapshotId] = Number(entry[5]) || 2;

        return {
          id: entry[0],
          disciplineId: entry[1],
          principle: entry[2] + " - " + entry[3],
          question: entry[4],
          scores: scores,
          targetScore: Number(entry[6]) || 4,
        };
      });
    }

    var questions = [];
    var counts = {
      A: 8,
      B: 8,
      C: 8,
      D: 7,
      E: 7,
      F: 8,
      G: 7,
      H: 7,
    };
    var questionId = 1;

    DEFAULT_DISCIPLINES.forEach(function (discipline) {
      var count = counts[discipline.id] || 7;
      for (var index = 1; index <= count; index += 1) {
        questions.push({
          id: "q-" + questionId,
          disciplineId: discipline.id,
          principle: discipline.name + " Principle " + index,
          question:
            "How effectively does the team implement standard agile practices for " +
            discipline.name.toLowerCase() +
            "? This assessment evaluates the depth of adoption and consistency across the project lifecycle.",
          scores: (function () {
            var scores = {};
            scores[snapshotId] = 2;
            return scores;
          })(),
          targetScore: 4,
        });
        questionId += 1;
      }
    });

    return questions;
  }

  function createInitialData() {
    var snapshotId = "initial-snapshot";
    var timestamp = new Date().toISOString();

    return {
      schemaVersion: "1.0.0",
      disciplines: DEFAULT_DISCIPLINES.map(function (discipline) {
        return { id: discipline.id, name: discipline.name };
      }),
      questions: generateSeededQuestions(snapshotId),
      deletedQuestions: [],
      snapshots: [
        {
          id: snapshotId,
          date: getTodayDateString(),
          label: "Initial Assessment",
        },
      ],
      activeSnapshotId: snapshotId,
      auditLog: [
        {
          id: "log-1",
          timestamp: timestamp,
          action: "System",
          details: TEMPLATE_QUESTIONS.length
            ? "Application initialized with Project Maturity Assessment workbook data."
            : "Application initialized with seeded data.",
        },
      ],
      lastModified: timestamp,
    };
  }

  app.constants.DEFAULT_DISCIPLINES = DEFAULT_DISCIPLINES;
  app.constants.createInitialData = createInitialData;
})(window);
