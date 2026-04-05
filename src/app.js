(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function detectCapabilities() {
    return {
      chart: typeof global.Chart === "function",
      pdf: Boolean(global.jspdf && typeof global.jspdf.jsPDF === "function"),
      pptx: typeof global.PptxGenJS === "function",
      xlsx: Boolean(global.XLSX && global.XLSX.utils),
    };
  }

  function start() {
    var root = document.getElementById("app");
    if (!root) {
      return;
    }

    var controller = app.controllers.createMainController({
      capabilities: detectCapabilities(),
      chartService: app.services.createChartService(),
      exportService: app.services.createExportService(),
      persistenceService: app.services.createPersistenceService({
        storageKey: app.config.localStorageKey,
      }),
      root: root,
    });

    controller.start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(window);
