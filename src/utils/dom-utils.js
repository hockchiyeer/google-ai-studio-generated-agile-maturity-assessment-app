(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toMultilineHtml(value) {
    return escapeHtml(value).replace(/\n/g, "<br />");
  }

  app.utils.dom = {
    escapeHtml: escapeHtml,
    toMultilineHtml: toMultilineHtml,
  };
})(window);
