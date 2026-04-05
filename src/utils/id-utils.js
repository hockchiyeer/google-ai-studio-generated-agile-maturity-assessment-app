(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function createId(prefix) {
    return (
      prefix +
      "-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  app.utils.ids = {
    createId: createId,
  };
})(window);
