(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function createMainController(options) {
    var root = options.root;
    var chartService = options.chartService;
    var exportService = options.exportService;
    var persistenceService = options.persistenceService;

    var initialData = persistenceService.loadData() || app.constants.createInitialData();

    var store = app.state.createStore({
      data: initialData,
      ui: {
        activeModal: null,
        capabilities: options.capabilities,
        comparisonType: "bar",
        confirmClearAll: false,
        confirmClearBin: false,
        confirmDeleteSnapshotId: null,
        editingCell: null,
        editingDisciplineId: null,
        filterDiscipline: "all",
        linkedFileHandle: null,
        linkedFileName: "",
        notice: null,
        snapshotDraft: {
          count: 4,
          date: app.utils.date.getTodayDateString(),
          frequency: "Weekly",
        },
        snapshotMode: "bulk",
      },
    });

    var noticeTimer = null;
    var persistenceTimer = null;
    var lastSerializedData = JSON.stringify(store.getState().data);

    function setNotice(kind, message, title) {
      var noticeId = Date.now();
      store.setState(function (state) {
        return {
          data: state.data,
          ui: Object.assign({}, state.ui, {
            notice: {
              id: noticeId,
              kind: kind || "info",
              message: message,
              title: title || "Notice",
            },
          }),
        };
      });

      if (noticeTimer) {
        global.clearTimeout(noticeTimer);
      }

      noticeTimer = global.setTimeout(function () {
        store.setState(function (state) {
          if (!state.ui.notice || state.ui.notice.id !== noticeId) {
            return state;
          }
          return {
            data: state.data,
            ui: Object.assign({}, state.ui, {
              notice: null,
            }),
          };
        });
      }, 4200);
    }

    function updateUi(patch) {
      store.setState(function (state) {
        return {
          data: state.data,
          ui: Object.assign({}, state.ui, patch),
        };
      });
    }

    function appendAuditEntry(data, action, details, timestamp) {
      data.auditLog = [
        {
          id: app.utils.ids.createId("log"),
          timestamp: timestamp,
          action: action,
          details: details,
        },
      ]
        .concat(data.auditLog || [])
        .slice(0, app.config.maxAuditEntries);
    }

    function updateData(mutator, auditConfig, uiPatch) {
      store.setState(function (state) {
        var nextData = app.models.assessment.cloneData(state.data);
        var timestamp = new Date().toISOString();

        mutator(nextData, state.ui, timestamp);

        if (auditConfig && auditConfig.action && auditConfig.details) {
          appendAuditEntry(nextData, auditConfig.action, auditConfig.details, timestamp);
        }

        if (!auditConfig || auditConfig.touch !== false) {
          nextData.lastModified = timestamp;
        }

        return {
          data: nextData,
          ui: Object.assign({}, state.ui, uiPatch || {}),
        };
      });
    }

    function replaceData(nextData, uiChanges, auditConfig) {
      var normalized = app.models.assessment.normalizeAssessmentData(nextData);
      var timestamp = new Date().toISOString();
      if (auditConfig && auditConfig.action && auditConfig.details) {
        appendAuditEntry(normalized, auditConfig.action, auditConfig.details, timestamp);
        normalized.lastModified = timestamp;
      }

      store.setState(function (state) {
        return {
          data: normalized,
          ui: Object.assign({}, state.ui, uiChanges || {}),
        };
      });
    }

    function openModal(modalName) {
      updateUi({
        activeModal: modalName,
        confirmClearAll: false,
        confirmClearBin: false,
        confirmDeleteSnapshotId: null,
        editingCell: null,
        editingDisciplineId: null,
      });
    }

    function closeModal() {
      updateUi({
        activeModal: null,
        confirmClearAll: false,
        confirmClearBin: false,
        confirmDeleteSnapshotId: null,
        editingCell: null,
        editingDisciplineId: null,
      });
    }

    function parseImportLines(rawText, defaultDisciplineId, disciplines, activeSnapshotId) {
      return String(rawText || "")
        .split("\n")
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean)
        .map(function (line, index) {
          var disciplineId = defaultDisciplineId;
          var principle = "General Principle";
          var questionText = line;

          if (line.indexOf("|") >= 0) {
            var parts = line.split("|").map(function (part) {
              return part.trim();
            });

            if (parts.length >= 3) {
              var foundDiscipline = disciplines.find(function (discipline) {
                return discipline.name.toLowerCase() === parts[0].toLowerCase();
              });
              if (foundDiscipline) {
                disciplineId = foundDiscipline.id;
              }
              principle = parts[1] || principle;
              questionText = parts.slice(2).join(" | ");
            } else if (parts.length === 2) {
              var matchedDiscipline = disciplines.find(function (discipline) {
                return discipline.name.toLowerCase() === parts[0].toLowerCase();
              });
              if (matchedDiscipline) {
                disciplineId = matchedDiscipline.id;
                principle = matchedDiscipline.name;
              }
              questionText = parts[1];
            }
          }

          return {
            id: app.utils.ids.createId("q-bulk-" + index),
            disciplineId: disciplineId,
            principle: principle,
            question: questionText,
            scores: (function () {
              var scores = {};
              scores[activeSnapshotId] = 2;
              return scores;
            })(),
            targetScore: 4,
          };
        });
    }

    function createSnapshotSchedule(startDate, frequency, count, label) {
      var results = [];
      var currentDate = new Date(startDate);
      var total = Math.min(app.config.maxSnapshots, Math.max(1, count || 1));

      for (var index = 0; index < total; index += 1) {
        var dateValue = currentDate.toISOString().split("T")[0];
        results.push({
          label: label ? label.trim() + " " + (index + 1) : "",
          date: dateValue,
        });

        if (frequency === "Random") {
          currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 14) + 1);
        } else if (frequency === "Weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (frequency === "Biweekly") {
          currentDate.setDate(currentDate.getDate() + 14);
        } else if (frequency === "Monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (frequency === "Quarterly") {
          currentDate.setMonth(currentDate.getMonth() + 3);
        } else if (frequency === "Half Yearly") {
          currentDate.setMonth(currentDate.getMonth() + 6);
        }
      }

      return results;
    }

    function render() {
      var state = store.getState();
      var viewModel = app.ui.createViewModel(state.data, state.ui);
      app.ui.renderer.render(root, state, viewModel);
      chartService.renderCharts(viewModel);
    }

    function schedulePersistence() {
      var state = store.getState();
      var serializedData = JSON.stringify(state.data);

      if (serializedData === lastSerializedData) {
        return;
      }

      lastSerializedData = serializedData;

      if (persistenceTimer) {
        global.clearTimeout(persistenceTimer);
      }

      persistenceTimer = global.setTimeout(async function () {
        var currentState = store.getState();
        var localSave = persistenceService.saveData(currentState.data);
        if (!localSave.ok) {
          setNotice("warning", "The browser could not update local storage.", "Storage");
        }

        if (currentState.ui.linkedFileHandle) {
          var linkedSave = await persistenceService.writeLinkedFile(currentState.ui.linkedFileHandle, currentState.data);
          if (!linkedSave.ok) {
            updateUi({
              linkedFileHandle: null,
              linkedFileName: "",
            });
            setNotice("warning", "Autosave to the linked JSON file failed, so the link was cleared.", "Linked File");
          }
        }
      }, 320);
    }

    async function handleJsonOpen() {
      try {
        var opened = await persistenceService.openJsonFile();
        replaceData(
          opened.data,
          {
            linkedFileHandle: opened.fileHandle || null,
            linkedFileName: opened.fileName || "",
          },
          {
            action: "Import",
            details: "Opened JSON file.",
          }
        );
        setNotice("success", "Assessment data loaded from JSON.", "Import");
      } catch (error) {
        if (error && /cancel/i.test(String(error.message || ""))) {
          return;
        }
        setNotice("danger", "Unable to open the selected JSON file.", "Import");
      }
    }

    async function handleJsonLink() {
      var state = store.getState();
      try {
        var result = await persistenceService.linkJsonFile(state.data);
        if (!result.ok) {
          if (result.unsupported) {
            setNotice(
              "warning",
              "Linked autosave needs the File System Access API. You can still use Download JSON anytime.",
              "Linked File"
            );
            return;
          }
          throw result.error;
        }

        updateData(
          function () {},
          {
            action: "System",
            details: "Linked JSON file for autosave.",
          },
          {
            linkedFileHandle: result.fileHandle,
            linkedFileName: result.fileName,
          }
        );
        setNotice("success", "Linked autosave is now active for " + result.fileName + ".", "Linked File");
      } catch (error) {
        if (error && /abort|cancel/i.test(String(error.message || ""))) {
          return;
        }
        setNotice("danger", "Unable to link a JSON file for autosave.", "Linked File");
      }
    }

    function handleExport(type) {
      var state = store.getState();
      var viewModel = app.ui.createViewModel(state.data, state.ui);
      var chartImages = chartService.getChartImages();

      try {
        if (type === "pdf") {
          exportService.exportPdf(state.data, viewModel, chartImages);
          updateData(function () {}, { action: "Export", details: "Exported PDF report." });
        } else if (type === "pptx") {
          exportService.exportPptx(state.data, viewModel, chartImages);
          updateData(function () {}, { action: "Export", details: "Exported PPTX report." });
        } else if (type === "xlsx") {
          exportService.exportXlsx(state.data, viewModel);
          updateData(function () {}, { action: "Export", details: "Exported Excel report." });
        } else if (type === "json") {
          exportService.exportJson(state.data);
          updateData(function () {}, { action: "Export", details: "Downloaded JSON data." });
        } else if (type === "questions") {
          exportService.exportQuestionsText(state.data);
          updateData(function () {}, { action: "Export", details: "Exported questions to text format." });
        }
      } catch (error) {
        setNotice("danger", "Export failed for " + type.toUpperCase() + ".", "Export");
      }
    }

    function handleClick(event) {
      var actionTarget = event.target.closest("[data-action]");
      if (!actionTarget || !root.contains(actionTarget)) {
        return;
      }

      if (actionTarget.classList.contains("is-disabled")) {
        return;
      }

      var action = actionTarget.getAttribute("data-action");
      var state = store.getState();

      if (actionTarget.classList.contains("modal-backdrop") && event.target !== actionTarget) {
        return;
      }

      if (action === "open-modal") {
        openModal(actionTarget.getAttribute("data-modal"));
      } else if (action === "close-modal") {
        closeModal();
      } else if (action === "set-comparison-type") {
        updateUi({ comparisonType: actionTarget.getAttribute("data-type") || "bar" });
      } else if (action === "start-question-edit") {
        updateUi({
          editingCell: {
            id: actionTarget.getAttribute("data-id"),
            field: actionTarget.getAttribute("data-field"),
          },
        });
      } else if (action === "cancel-question-edit") {
        updateUi({ editingCell: null });
      } else if (action === "set-score") {
        updateData(function (data) {
          data.questions = data.questions.map(function (question) {
            if (question.id === actionTarget.getAttribute("data-id")) {
              question.scores[data.activeSnapshotId] = Number(actionTarget.getAttribute("data-score"));
            }
            return question;
          });
        });
      } else if (action === "delete-question") {
        var questionId = actionTarget.getAttribute("data-id");
        var questionToDelete = state.data.questions.find(function (question) {
          return question.id === questionId;
        });
        if (!questionToDelete) {
          return;
        }
        updateData(
          function (data, uiState, timestamp) {
            data.questions = data.questions.filter(function (question) {
              return question.id !== questionId;
            });
            var recycledQuestion = app.models.assessment.cloneData(questionToDelete);
            recycledQuestion.deletedAt = timestamp;
            data.deletedQuestions.push(recycledQuestion);
          },
          {
            action: "Question",
            details: 'Deleted question: "' + questionToDelete.principle + '".',
          }
        );
      } else if (action === "recover-question") {
        var recoverId = actionTarget.getAttribute("data-id");
        var deletedQuestion = state.data.deletedQuestions.find(function (question) {
          return question.id === recoverId;
        });
        if (!deletedQuestion) {
          return;
        }
        updateData(
          function (data) {
            data.deletedQuestions = data.deletedQuestions.filter(function (question) {
              return question.id !== recoverId;
            });
            var restoredQuestion = app.models.assessment.cloneData(deletedQuestion);
            delete restoredQuestion.deletedAt;
            data.questions.push(restoredQuestion);
          },
          {
            action: "Question",
            details: 'Recovered question: "' + deletedQuestion.principle + '".',
          }
        );
      } else if (action === "prompt-clear-bin") {
        updateUi({ confirmClearBin: true });
      } else if (action === "cancel-clear-bin") {
        updateUi({ confirmClearBin: false });
      } else if (action === "confirm-clear-bin") {
        updateData(
          function (data) {
            data.deletedQuestions = [];
          },
          {
            action: "Bulk Action",
            details: "Cleared recovery bin.",
          },
          {
            confirmClearBin: false,
          }
        );
      } else if (action === "start-discipline-edit") {
        updateUi({ editingDisciplineId: actionTarget.getAttribute("data-id") });
      } else if (action === "cancel-discipline-edit") {
        updateUi({ editingDisciplineId: null });
      } else if (action === "delete-discipline") {
        var disciplineId = actionTarget.getAttribute("data-id");
        var discipline = state.data.disciplines.find(function (item) {
          return item.id === disciplineId;
        });
        if (!discipline) {
          return;
        }
        updateData(
          function (data, uiState, timestamp) {
            var removedQuestions = data.questions
              .filter(function (question) {
                return question.disciplineId === disciplineId;
              })
              .map(function (question) {
                var recycled = app.models.assessment.cloneData(question);
                recycled.deletedAt = timestamp;
                return recycled;
              });

            data.disciplines = data.disciplines.filter(function (item) {
              return item.id !== disciplineId;
            });
            data.questions = data.questions.filter(function (question) {
              return question.disciplineId !== disciplineId;
            });
            data.deletedQuestions = data.deletedQuestions.concat(removedQuestions);
          },
          {
            action: "Discipline",
            details: 'Deleted discipline "' + discipline.name + '" and moved its questions into recovery.',
          },
          {
            editingDisciplineId: null,
            filterDiscipline: state.ui.filterDiscipline === disciplineId ? "all" : state.ui.filterDiscipline,
          }
        );
      } else if (action === "select-snapshot") {
        updateData(
          function (data) {
            data.activeSnapshotId = actionTarget.getAttribute("data-id");
          },
          { touch: false },
          {
            confirmDeleteSnapshotId: null,
          }
        );
      } else if (action === "toggle-snapshot-mode") {
        updateUi({
          snapshotMode: state.ui.snapshotMode === "bulk" ? "single" : "bulk",
          confirmDeleteSnapshotId: null,
        });
      } else if (action === "prompt-delete-snapshot") {
        updateUi({ confirmDeleteSnapshotId: actionTarget.getAttribute("data-id") });
      } else if (action === "cancel-delete-snapshot") {
        updateUi({ confirmDeleteSnapshotId: null });
      } else if (action === "confirm-delete-snapshot") {
        var snapshotId = actionTarget.getAttribute("data-id");
        if (state.data.snapshots.length <= 1) {
          return;
        }
        updateData(
          function (data) {
            data.snapshots = data.snapshots.filter(function (snapshot) {
              return snapshot.id !== snapshotId;
            });
            if (!data.snapshots.find(function (snapshot) {
              return snapshot.id === data.activeSnapshotId;
            })) {
              data.activeSnapshotId = data.snapshots[0].id;
            }
          },
          {
            action: "Snapshot",
            details: "Deleted snapshot.",
          },
          {
            confirmDeleteSnapshotId: null,
          }
        );
      } else if (action === "prompt-clear-all") {
        updateUi({ confirmClearAll: true });
      } else if (action === "cancel-clear-all") {
        updateUi({ confirmClearAll: false });
      } else if (action === "confirm-clear-all") {
        updateData(
          function (data, uiState, timestamp) {
            var movedQuestions = data.questions.map(function (question) {
              var recycled = app.models.assessment.cloneData(question);
              recycled.deletedAt = timestamp;
              return recycled;
            });
            data.questions = [];
            data.deletedQuestions = data.deletedQuestions.concat(movedQuestions);
          },
          {
            action: "Bulk Action",
            details: "Cleared all questions and moved them to recovery.",
          },
          {
            confirmClearAll: false,
          }
        );
      } else if (action === "open-json") {
        handleJsonOpen();
      } else if (action === "link-json") {
        handleJsonLink();
      } else if (action === "export-pdf") {
        handleExport("pdf");
      } else if (action === "export-pptx") {
        handleExport("pptx");
      } else if (action === "export-xlsx") {
        handleExport("xlsx");
      } else if (action === "download-json") {
        handleExport("json");
      } else if (action === "export-questions") {
        handleExport("questions");
      }
    }

    function handleChange(event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      var action = target.getAttribute("data-action");
      if (action === "set-filter-discipline") {
        updateUi({ filterDiscipline: target.value || "all" });
      }
    }

    function handleSubmit(event) {
      var form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      var action = form.getAttribute("data-action");
      if (!action) {
        return;
      }

      event.preventDefault();

      var state = store.getState();
      var formData = new FormData(form);

      if (action === "save-question-edit") {
        var editId = form.getAttribute("data-id");
        var field = form.getAttribute("data-field");
        var value = String(formData.get("value") || "").trim();
        if (!editId || !field || !value) {
          return;
        }

        var originalQuestion = state.data.questions.find(function (question) {
          return question.id === editId;
        });
        if (!originalQuestion || originalQuestion[field] === value) {
          updateUi({ editingCell: null });
          return;
        }

        updateData(
          function (data) {
            data.questions = data.questions.map(function (question) {
              if (question.id === editId) {
                question[field] = value;
              }
              return question;
            });
          },
          {
            action: "Question Edit",
            details:
              'Updated ' +
              field +
              ' for "' +
              originalQuestion.principle +
              '": "' +
              originalQuestion[field] +
              '" -> "' +
              value +
              '".',
          },
          {
            editingCell: null,
          }
        );
      } else if (action === "add-question") {
        var principle = String(formData.get("principle") || "").trim();
        var questionText = String(formData.get("question") || "").trim();
        var disciplineId = String(formData.get("disciplineId") || "").trim();
        if (!principle || !questionText || !disciplineId) {
          return;
        }

        updateData(
          function (data) {
            var scores = {};
            scores[data.activeSnapshotId] = 2;
            data.questions.push({
              id: app.utils.ids.createId("q"),
              disciplineId: disciplineId,
              principle: principle,
              question: questionText,
              scores: scores,
              targetScore: 4,
            });
          },
          {
            action: "Question",
            details:
              "Added question to " +
              (state.data.disciplines.find(function (discipline) {
                return discipline.id === disciplineId;
              }) || { name: "Unknown discipline" }).name +
              ".",
          }
        );
        closeModal();
      } else if (action === "add-discipline") {
        var name = String(formData.get("name") || "").trim();
        if (!name) {
          return;
        }

        updateData(
          function (data) {
            data.disciplines.push({
              id: app.utils.ids.createId("disc"),
              name: name,
            });
          },
          {
            action: "Discipline",
            details: 'Added new discipline: "' + name + '".',
          }
        );
        form.reset();
      } else if (action === "rename-discipline") {
        var renameId = form.getAttribute("data-id");
        var newName = String(formData.get("name") || "").trim();
        if (!renameId || !newName) {
          return;
        }

        updateData(
          function (data) {
            data.disciplines = data.disciplines.map(function (discipline) {
              if (discipline.id === renameId) {
                discipline.name = newName;
              }
              return discipline;
            });
          },
          {
            action: "Discipline",
            details: 'Renamed discipline to: "' + newName + '".',
          },
          {
            editingDisciplineId: null,
          }
        );
      } else if (action === "submit-snapshot-form") {
        var label = String(formData.get("label") || "").trim();
        var date = String(formData.get("date") || "").trim();
        var frequency = String(formData.get("frequency") || "Weekly");
        var count = Number(formData.get("count") || 1);

        if (!date) {
          return;
        }

        if (state.ui.snapshotMode === "single") {
          updateData(
            function (data) {
              var newId = app.utils.ids.createId("snapshot");
              data.snapshots = data.snapshots
                .concat([
                  {
                    id: newId,
                    label: label,
                    date: date,
                  },
                ])
                .slice(-app.config.maxSnapshots);
              data.activeSnapshotId = newId;
            },
            {
              action: "Snapshot",
              details: "Added new snapshot: " + app.utils.date.getSnapshotContext({ label: label, date: date }) + ".",
            }
          );
        } else {
          var snapshotsToAdd = createSnapshotSchedule(date, frequency, count, label);
          updateData(
            function (data) {
              var addedIds = [];
              snapshotsToAdd.forEach(function (snapshot) {
                var snapshotId = app.utils.ids.createId("snapshot");
                addedIds.push(snapshotId);
                data.snapshots.push({
                  id: snapshotId,
                  label: snapshot.label,
                  date: snapshot.date,
                });
              });
              data.snapshots = data.snapshots.slice(-app.config.maxSnapshots);
              if (addedIds.length) {
                var lastAddedId = addedIds[addedIds.length - 1];
                if (data.snapshots.find(function (snapshot) {
                  return snapshot.id === lastAddedId;
                })) {
                  data.activeSnapshotId = lastAddedId;
                } else {
                  data.activeSnapshotId = data.snapshots[data.snapshots.length - 1].id;
                }
              }
            },
            {
              action: "Snapshot",
              details: "Bulk added " + snapshotsToAdd.length + " snapshots.",
            }
          );
        }

        updateUi({
          snapshotDraft: {
            count: count,
            date: date,
            frequency: frequency,
          },
        });
      } else if (action === "bulk-import-questions") {
        var importText = String(formData.get("importText") || "").trim();
        var defaultDisciplineId = String(formData.get("defaultDisciplineId") || "").trim();
        if (!importText || !defaultDisciplineId) {
          return;
        }

        var importedQuestions = parseImportLines(
          importText,
          defaultDisciplineId,
          state.data.disciplines,
          state.data.activeSnapshotId
        );

        if (!importedQuestions.length) {
          return;
        }

        updateData(
          function (data) {
            data.questions = data.questions.concat(importedQuestions);
          },
          {
            action: "Bulk Action",
            details: "Imported " + importedQuestions.length + " questions.",
          }
        );
        closeModal();
      }
    }

    function handleKeydown(event) {
      if (event.key === "Escape") {
        var state = store.getState();
        if (state.ui.activeModal) {
          closeModal();
        } else if (state.ui.editingCell) {
          updateUi({ editingCell: null });
        } else if (state.ui.editingDisciplineId) {
          updateUi({ editingDisciplineId: null });
        }
      }
    }

    function start() {
      var initialSave = persistenceService.saveData(store.getState().data);
      if (!initialSave.ok) {
        setNotice("warning", "The browser could not initialize local storage persistence.", "Storage");
      }

      store.subscribe(function () {
        render();
        schedulePersistence();
      });

      root.addEventListener("click", handleClick);
      root.addEventListener("change", handleChange);
      root.addEventListener("submit", handleSubmit);
      document.addEventListener("keydown", handleKeydown);

      render();
    }

    return {
      start: start,
    };
  }

  app.controllers.createMainController = createMainController;
})(window);
