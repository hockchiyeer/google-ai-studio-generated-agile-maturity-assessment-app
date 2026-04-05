(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function downloadBlob(blob, fileName) {
    var url = global.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    global.URL.revokeObjectURL(url);
  }

  function downloadText(text, fileName, mimeType) {
    downloadBlob(new Blob([text], { type: mimeType || "text/plain;charset=utf-8" }), fileName);
  }

  function downloadJson(data, fileName) {
    downloadText(JSON.stringify(data, null, 2), fileName, "application/json");
  }

  app.utils.download = {
    downloadBlob: downloadBlob,
    downloadText: downloadText,
    downloadJson: downloadJson,
  };
})(window);
