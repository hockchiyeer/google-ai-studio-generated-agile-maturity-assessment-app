(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function createPersistenceService(options) {
    var storageKey = (options && options.storageKey) || app.config.localStorageKey;

    function loadData() {
      try {
        var rawValue = global.localStorage.getItem(storageKey);
        if (!rawValue) {
          return null;
        }
        return app.models.assessment.createStartupAssessmentData(JSON.parse(rawValue));
      } catch (error) {
        return null;
      }
    }

    function saveData(data) {
      try {
        global.localStorage.setItem(storageKey, JSON.stringify(data));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error };
      }
    }

    function requestFileFromInput() {
      return new Promise(function (resolve, reject) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.style.display = "none";
        document.body.appendChild(input);

        input.addEventListener(
          "change",
          function () {
            var file = input.files && input.files[0];
            document.body.removeChild(input);

            if (!file) {
              reject(new Error("File selection cancelled."));
              return;
            }

            var reader = new FileReader();
            reader.onload = function () {
              try {
                var parsed = JSON.parse(String(reader.result || "{}"));
                resolve({
                  data: app.models.assessment.createStartupAssessmentData(parsed),
                  fileHandle: null,
                  fileName: file.name || "",
                });
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = function () {
              reject(reader.error || new Error("Unable to read the selected file."));
            };
            reader.readAsText(file);
          },
          { once: true }
        );

        input.click();
      });
    }

    async function openJsonFile() {
      if (typeof global.showOpenFilePicker === "function") {
        var handles = await global.showOpenFilePicker({
          types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }],
          excludeAcceptAllOption: true,
          multiple: false,
        });

        var handle = handles[0];
        var file = await handle.getFile();
        var content = await file.text();
        return {
          data: app.models.assessment.createStartupAssessmentData(JSON.parse(content)),
          fileHandle: handle,
          fileName: handle.name || file.name || "",
        };
      }

      return requestFileFromInput();
    }

    async function writeLinkedFile(handle, data) {
      if (!handle) {
        return { ok: false, error: new Error("No linked file handle is available.") };
      }

      try {
        if (typeof handle.requestPermission === "function") {
          await handle.requestPermission({ mode: "readwrite" });
        }
        var writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error };
      }
    }

    async function linkJsonFile(data) {
      if (typeof global.showSaveFilePicker !== "function") {
        return {
          ok: false,
          unsupported: true,
          error: new Error("This browser does not support persistent file linking."),
        };
      }

      var handle = await global.showSaveFilePicker({
        suggestedName: "agile-maturity-linked.json",
        types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }],
        excludeAcceptAllOption: true,
      });

      var saveResult = await writeLinkedFile(handle, data);
      if (!saveResult.ok) {
        return saveResult;
      }

      return {
        ok: true,
        fileHandle: handle,
        fileName: handle.name || "agile-maturity-linked.json",
      };
    }

    return {
      linkJsonFile: linkJsonFile,
      loadData: loadData,
      openJsonFile: openJsonFile,
      saveData: saveData,
      writeLinkedFile: writeLinkedFile,
    };
  }

  app.services.createPersistenceService = createPersistenceService;
})(window);
