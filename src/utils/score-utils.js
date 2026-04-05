(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  var MATURITY_LEVELS = [
    { score: 1, label: "Adhoc", tone: "danger" },
    { score: 2, label: "Defined", tone: "warning" },
    { score: 3, label: "Consistent", tone: "accent" },
    { score: 4, label: "Managed", tone: "primary" },
    { score: 5, label: "Optimizing", tone: "success" },
  ];

  function getMaturityLabel(score) {
    var roundedScore = Math.round(Number(score) || 0);
    if (roundedScore <= 1) {
      return "Adhoc";
    }
    if (roundedScore === 2) {
      return "Defined";
    }
    if (roundedScore === 3) {
      return "Consistent";
    }
    if (roundedScore === 4) {
      return "Managed";
    }
    return "Optimizing";
  }

  function roundScore(value) {
    return Number((Number(value) || 0).toFixed(2));
  }

  function formatAverage(value) {
    return roundScore(value).toFixed(2);
  }

  app.utils.score = {
    MATURITY_LEVELS: MATURITY_LEVELS,
    getMaturityLabel: getMaturityLabel,
    roundScore: roundScore,
    formatAverage: formatAverage,
  };
})(window);
