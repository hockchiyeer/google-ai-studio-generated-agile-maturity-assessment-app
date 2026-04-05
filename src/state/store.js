(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function createStore(initialState) {
    var state = initialState;
    var listeners = [];

    function getState() {
      return state;
    }

    function setState(nextStateOrUpdater) {
      state =
        typeof nextStateOrUpdater === "function"
          ? nextStateOrUpdater(state)
          : nextStateOrUpdater;

      listeners.slice().forEach(function (listener) {
        listener(state);
      });

      return state;
    }

    function subscribe(listener) {
      listeners.push(listener);
      return function unsubscribe() {
        listeners = listeners.filter(function (registered) {
          return registered !== listener;
        });
      };
    }

    return {
      getState: getState,
      setState: setState,
      subscribe: subscribe,
    };
  }

  app.state.createStore = createStore;
})(window);
