(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;
  var dateUtils = app.utils.date;
  var scoreUtils = app.utils.score;

  function createViewModel(data, ui) {
    var activeSnapshot =
      data.snapshots.find(function (snapshot) {
        return snapshot.id === data.activeSnapshotId;
      }) || data.snapshots[0];

    var disciplineMap = {};
    data.disciplines.forEach(function (discipline) {
      disciplineMap[discipline.id] = discipline;
    });

    var scoresByDiscipline = {};
    data.questions.forEach(function (question) {
      if (!scoresByDiscipline[question.disciplineId]) {
        scoresByDiscipline[question.disciplineId] = {
          total: 0,
          count: 0,
          targetTotal: 0,
        };
      }

      scoresByDiscipline[question.disciplineId].total += question.scores[data.activeSnapshotId] || 0;
      scoresByDiscipline[question.disciplineId].targetTotal += Number(question.targetScore) || 0;
      scoresByDiscipline[question.disciplineId].count += 1;
    });

    var totalScore = 0;
    var totalTargetScore = 0;
    var totalQuestionCount = 0;

    Object.keys(scoresByDiscipline).forEach(function (disciplineId) {
      var stats = scoresByDiscipline[disciplineId];
      totalScore += stats.total;
      totalTargetScore += stats.targetTotal;
      totalQuestionCount += stats.count;
    });

    var overallAverage = totalQuestionCount ? scoreUtils.formatAverage(totalScore / totalQuestionCount) : "0.00";
    var overallTargetAverage = totalQuestionCount
      ? scoreUtils.formatAverage(totalTargetScore / totalQuestionCount)
      : "0.00";

    var comparisonChartLabels = data.snapshots.map(function (snapshot, index) {
      return [
        dateUtils.formatSnapshotDate(snapshot.date),
        dateUtils.getSnapshotAnnotation(snapshot, index),
      ];
    });

    var snapshotExportHeaders = data.snapshots.map(function (snapshot, index) {
      return (
        dateUtils.formatSnapshotDate(snapshot.date) +
        " (" +
        dateUtils.getSnapshotAnnotation(snapshot, index) +
        ")"
      );
    });

    var radarRows = data.disciplines.map(function (discipline) {
      var stats = scoresByDiscipline[discipline.id];
      var currentAverage = stats && stats.count ? scoreUtils.roundScore(stats.total / stats.count) : 0;
      var targetAverage = stats && stats.count ? scoreUtils.roundScore(stats.targetTotal / stats.count) : 0;
      return [discipline.name, currentAverage, targetAverage];
    });

    var comparisonDatasets = [
      {
        label: "Overall Maturity",
        data: data.snapshots.map(function (snapshot) {
          var snapshotTotal = 0;
          var snapshotCount = 0;

          data.questions.forEach(function (question) {
            if (question.scores[snapshot.id] !== undefined) {
              snapshotTotal += question.scores[snapshot.id];
              snapshotCount += 1;
            }
          });

          return snapshotCount ? scoreUtils.roundScore(snapshotTotal / snapshotCount) : 0;
        }),
        backgroundColor: "rgba(27, 104, 183, 0.85)",
        borderColor: "rgba(27, 104, 183, 1)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ];

    var fillColors = [
      "rgba(216, 67, 21, 0.45)",
      "rgba(206, 147, 0, 0.45)",
      "rgba(46, 125, 50, 0.45)",
      "rgba(0, 137, 123, 0.45)",
      "rgba(94, 53, 177, 0.45)",
      "rgba(173, 20, 87, 0.45)",
      "rgba(84, 110, 122, 0.45)",
      "rgba(21, 101, 192, 0.35)",
    ];
    var strokeColors = [
      "rgba(216, 67, 21, 1)",
      "rgba(206, 147, 0, 1)",
      "rgba(46, 125, 50, 1)",
      "rgba(0, 137, 123, 1)",
      "rgba(94, 53, 177, 1)",
      "rgba(173, 20, 87, 1)",
      "rgba(84, 110, 122, 1)",
      "rgba(21, 101, 192, 1)",
    ];

    data.disciplines.forEach(function (discipline, disciplineIndex) {
      comparisonDatasets.push({
        label: discipline.name,
        data: data.snapshots.map(function (snapshot) {
          var snapshotTotal = 0;
          var snapshotCount = 0;

          data.questions
            .filter(function (question) {
              return question.disciplineId === discipline.id;
            })
            .forEach(function (question) {
              if (question.scores[snapshot.id] !== undefined) {
                snapshotTotal += question.scores[snapshot.id];
                snapshotCount += 1;
              }
            });

          return snapshotCount ? scoreUtils.roundScore(snapshotTotal / snapshotCount) : 0;
        }),
        backgroundColor: fillColors[disciplineIndex % fillColors.length],
        borderColor: strokeColors[disciplineIndex % strokeColors.length],
        borderWidth: 1.5,
        tension: 0.3,
        pointRadius: 3,
      });
    });

    var filteredQuestions = data.questions.filter(function (question) {
      return ui.filterDiscipline === "all" || question.disciplineId === ui.filterDiscipline;
    });

    var deletedQuestions = data.deletedQuestions
      .slice()
      .reverse()
      .map(function (question) {
        return {
          id: question.id,
          disciplineName: disciplineMap[question.disciplineId] ? disciplineMap[question.disciplineId].name : "Unknown Discipline",
          principle: question.principle,
          question: question.question,
          deletedAt: question.deletedAt,
        };
      });

    return {
      activeSnapshot: activeSnapshot,
      activeSnapshotContext: dateUtils.getSnapshotContext(activeSnapshot),
      activeSnapshotDateLabel: dateUtils.formatSnapshotDate(activeSnapshot.date),
      activeSnapshotTitle: dateUtils.getSnapshotTitle(activeSnapshot),
      comparisonChartData: {
        labels: comparisonChartLabels,
        datasets: comparisonDatasets,
      },
      disciplineMap: disciplineMap,
      deletedQuestions: deletedQuestions,
      filteredQuestionCount: filteredQuestions.length,
      filteredQuestions: filteredQuestions,
      overallAverage: overallAverage,
      overallTargetAverage: overallTargetAverage,
      radarData: {
        labels: data.disciplines.map(function (discipline) {
          return discipline.name;
        }),
        datasets: [
          {
            label: "Current Maturity",
            data: radarRows.map(function (row) {
              return row[1];
            }),
            backgroundColor: "rgba(27, 104, 183, 0.18)",
            borderColor: "rgba(27, 104, 183, 1)",
            borderWidth: 2,
          },
          {
            label: "Target Maturity",
            data: radarRows.map(function (row) {
              return row[2];
            }),
            backgroundColor: "rgba(39, 138, 89, 0.12)",
            borderColor: "rgba(39, 138, 89, 0.7)",
            borderWidth: 1,
            borderDash: [5, 5],
          },
        ],
      },
      radarRows: radarRows,
      showActiveSnapshotDate: dateUtils.hasMeaningfulSnapshotLabel(activeSnapshot),
      snapshotExportHeaders: snapshotExportHeaders,
    };
  }

  app.ui.createViewModel = createViewModel;
})(window);
