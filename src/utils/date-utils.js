(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;
  var genericSnapshotLabelPattern = /^snapshot\s+\d+$/i;

  function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  function formatSnapshotDate(dateString) {
    var parts = String(dateString || "").split("-").map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      return dateString || "";
    }

    return new Intl.DateTimeFormat(undefined, {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
  }

  function formatTimestamp(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  function isSnapshotLabelDateLike(label, date) {
    var trimmedLabel = String(label || "").trim();
    if (!trimmedLabel) {
      return false;
    }
    return trimmedLabel === date || trimmedLabel === formatSnapshotDate(date);
  }

  function hasMeaningfulSnapshotLabel(snapshot) {
    var label = String(snapshot && snapshot.label ? snapshot.label : "").trim();
    if (!label) {
      return false;
    }
    if (genericSnapshotLabelPattern.test(label)) {
      return false;
    }
    return !isSnapshotLabelDateLike(label, snapshot.date);
  }

  function getSnapshotTitle(snapshot) {
    if (!snapshot) {
      return "";
    }

    return hasMeaningfulSnapshotLabel(snapshot)
      ? snapshot.label.trim()
      : formatSnapshotDate(snapshot.date);
  }

  function getSnapshotContext(snapshot) {
    if (!snapshot) {
      return "";
    }

    var title = getSnapshotTitle(snapshot);
    return hasMeaningfulSnapshotLabel(snapshot)
      ? title + " - " + formatSnapshotDate(snapshot.date)
      : title;
  }

  function getSnapshotAnnotation(snapshot, index) {
    var trimmedLabel = String(snapshot && snapshot.label ? snapshot.label : "").trim();
    if (trimmedLabel && !isSnapshotLabelDateLike(trimmedLabel, snapshot.date)) {
      return trimmedLabel;
    }
    return "Snapshot " + (index + 1);
  }

  app.utils.date = {
    formatSnapshotDate: formatSnapshotDate,
    formatTimestamp: formatTimestamp,
    getTodayDateString: getTodayDateString,
    getSnapshotTitle: getSnapshotTitle,
    getSnapshotContext: getSnapshotContext,
    getSnapshotAnnotation: getSnapshotAnnotation,
    hasMeaningfulSnapshotLabel: hasMeaningfulSnapshotLabel,
  };
})(window);
