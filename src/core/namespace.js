(function (global) {
  "use strict";

  var app = (global.AgileMaturityApp = global.AgileMaturityApp || {});

  app.version = "static-1.0.0";
  app.config = app.config || {
    localStorageKey: "agile-maturity-assessment-data",
    maxSnapshots: 12,
    maxAuditEntries: 100,
  };
  app.constants = app.constants || {};
  app.models = app.models || {};
  app.utils = app.utils || {};
  app.state = app.state || {};
  app.services = app.services || {};
  app.ui = app.ui || {};
  app.controllers = app.controllers || {};
})(window);
