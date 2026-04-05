(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function cloneData(value) {
    if (typeof global.structuredClone === "function") {
      return global.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, number));
  }

  function normalizeDateString(value, fallback) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    return fallback;
  }

  function normalizeAuditLog(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .filter(isObject)
      .map(function (entry, index) {
        return {
          id: typeof entry.id === "string" && entry.id ? entry.id : "log-import-" + index,
          timestamp:
            typeof entry.timestamp === "string" && entry.timestamp
              ? entry.timestamp
              : new Date().toISOString(),
          action: typeof entry.action === "string" && entry.action ? entry.action : "Imported",
          details: typeof entry.details === "string" && entry.details ? entry.details : "Imported audit entry.",
        };
      })
      .slice(0, app.config.maxAuditEntries);
  }

  function normalizeAssessmentData(raw) {
    var fallback = app.constants.createInitialData();
    if (!isObject(raw)) {
      return fallback;
    }

    var fallbackDate = fallback.snapshots[0].date;
    var disciplines = Array.isArray(raw.disciplines)
      ? raw.disciplines
          .filter(isObject)
          .map(function (discipline, index) {
            return {
              id:
                typeof discipline.id === "string" && discipline.id
                  ? discipline.id
                  : "disc-import-" + index,
              name:
                typeof discipline.name === "string" && discipline.name.trim()
                  ? discipline.name.trim()
                  : "Discipline " + (index + 1),
            };
          })
      : [];

    if (!disciplines.length) {
      disciplines = cloneData(fallback.disciplines);
    }

    var disciplineIdLookup = {};
    disciplines.forEach(function (discipline) {
      disciplineIdLookup[discipline.id] = true;
    });

    var snapshots = Array.isArray(raw.snapshots)
      ? raw.snapshots
          .filter(isObject)
          .map(function (snapshot, index) {
            return {
              id:
                typeof snapshot.id === "string" && snapshot.id
                  ? snapshot.id
                  : "snapshot-import-" + index,
              label: typeof snapshot.label === "string" ? snapshot.label.trim() : "",
              date: normalizeDateString(snapshot.date, fallbackDate),
            };
          })
          .slice(-app.config.maxSnapshots)
      : [];

    if (!snapshots.length) {
      snapshots = cloneData(fallback.snapshots);
    }

    var snapshotIdLookup = {};
    snapshots.forEach(function (snapshot) {
      snapshotIdLookup[snapshot.id] = true;
    });

    function normalizeScores(value) {
      var scores = {};

      if (!isObject(value)) {
        return scores;
      }

      Object.keys(value).forEach(function (snapshotId) {
        if (!snapshotIdLookup[snapshotId]) {
          return;
        }

        var score = Number(value[snapshotId]);
        if (Number.isFinite(score)) {
          scores[snapshotId] = clampNumber(score, 0, 5, 0);
        }
      });

      return scores;
    }

    function normalizeQuestion(question, index, allowUnknownDiscipline) {
      if (!isObject(question)) {
        return null;
      }

      var disciplineId =
        typeof question.disciplineId === "string" && question.disciplineId
          ? question.disciplineId
          : disciplines[0].id;

      if (!allowUnknownDiscipline && !disciplineIdLookup[disciplineId]) {
        disciplineId = disciplines[0].id;
      }

      return {
        id: typeof question.id === "string" && question.id ? question.id : "q-import-" + index,
        disciplineId: disciplineId,
        principle:
          typeof question.principle === "string" && question.principle.trim()
            ? question.principle.trim()
            : "General Principle",
        question:
          typeof question.question === "string" && question.question.trim()
            ? question.question.trim()
            : "Imported question",
        scores: normalizeScores(question.scores),
        targetScore: clampNumber(question.targetScore, 0, 5, 4),
        deletedAt:
          typeof question.deletedAt === "string" && question.deletedAt ? question.deletedAt : undefined,
      };
    }

    var questions = (Array.isArray(raw.questions) ? raw.questions : [])
      .map(function (question, index) {
        return normalizeQuestion(question, index, false);
      })
      .filter(Boolean);

    var deletedQuestions = (Array.isArray(raw.deletedQuestions) ? raw.deletedQuestions : [])
      .map(function (question, index) {
        return normalizeQuestion(question, index, true);
      })
      .filter(Boolean);

    var activeSnapshotId =
      typeof raw.activeSnapshotId === "string" && snapshotIdLookup[raw.activeSnapshotId]
        ? raw.activeSnapshotId
        : snapshots[0].id;

    var auditLog = normalizeAuditLog(raw.auditLog);
    if (!auditLog.length) {
      auditLog = cloneData(fallback.auditLog);
    }

    return {
      schemaVersion:
        typeof raw.schemaVersion === "string" && raw.schemaVersion ? raw.schemaVersion : fallback.schemaVersion,
      disciplines: disciplines,
      questions: questions,
      deletedQuestions: deletedQuestions,
      snapshots: snapshots,
      activeSnapshotId: activeSnapshotId,
      auditLog: auditLog,
      lastModified:
        typeof raw.lastModified === "string" && raw.lastModified ? raw.lastModified : new Date().toISOString(),
    };
  }

  function createStartupAssessmentData(raw) {
    var fallback = app.constants.createInitialData();
    if (!isObject(raw)) {
      return fallback;
    }

    var normalized = normalizeAssessmentData(raw);
    var savedQuestionsById = {};
    normalized.questions.forEach(function (question) {
      savedQuestionsById[question.id] = question;
    });

    var hasMatchingTemplateQuestion = fallback.questions.some(function (question) {
      return Boolean(savedQuestionsById[question.id]);
    });

    if (!hasMatchingTemplateQuestion) {
      return fallback;
    }

    var snapshots = normalized.snapshots.length ? cloneData(normalized.snapshots) : cloneData(fallback.snapshots);
    var snapshotIdLookup = {};
    snapshots.forEach(function (snapshot) {
      snapshotIdLookup[snapshot.id] = true;
    });

    var questions = fallback.questions.map(function (baseQuestion) {
      var savedQuestion = savedQuestionsById[baseQuestion.id];
      var scores = {};

      snapshots.forEach(function (snapshot) {
        if (savedQuestion && savedQuestion.scores && savedQuestion.scores[snapshot.id] !== undefined) {
          scores[snapshot.id] = clampNumber(savedQuestion.scores[snapshot.id], 0, 5, 0);
        } else if (
          snapshot.id === fallback.activeSnapshotId &&
          baseQuestion.scores &&
          baseQuestion.scores[fallback.activeSnapshotId] !== undefined
        ) {
          scores[snapshot.id] = clampNumber(baseQuestion.scores[fallback.activeSnapshotId], 0, 5, 0);
        }
      });

      return {
        id: baseQuestion.id,
        disciplineId: baseQuestion.disciplineId,
        principle: baseQuestion.principle,
        question: baseQuestion.question,
        scores: scores,
        targetScore: baseQuestion.targetScore,
      };
    });

    return {
      schemaVersion: normalized.schemaVersion || fallback.schemaVersion,
      disciplines: cloneData(fallback.disciplines),
      questions: questions,
      deletedQuestions: [],
      snapshots: snapshots,
      activeSnapshotId: snapshotIdLookup[normalized.activeSnapshotId] ? normalized.activeSnapshotId : snapshots[0].id,
      auditLog: normalized.auditLog.length ? normalized.auditLog : cloneData(fallback.auditLog),
      lastModified: normalized.lastModified || fallback.lastModified,
    };
  }

  app.models.assessment = {
    cloneData: cloneData,
    createStartupAssessmentData: createStartupAssessmentData,
    normalizeAssessmentData: normalizeAssessmentData,
  };
})(window);
