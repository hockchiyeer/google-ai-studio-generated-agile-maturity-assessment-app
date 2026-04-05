(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;
  var escapeHtml = app.utils.dom.escapeHtml;
  var toMultilineHtml = app.utils.dom.toMultilineHtml;
  var MATURITY_LEVELS = app.utils.score.MATURITY_LEVELS;
  var getMaturityLabel = app.utils.score.getMaturityLabel;

  function renderButton(label, action, variant, attributes) {
    return (
      '<button type="button" class="button ' +
      variant +
      '" data-action="' +
      action +
      '" ' +
      (attributes || "") +
      ">" +
      label +
      "</button>"
    );
  }

  function renderOptions(options, selectedValue) {
    return options
      .map(function (option) {
        var selected = option.id === selectedValue ? ' selected="selected"' : "";
        return '<option value="' + escapeHtml(option.id) + '"' + selected + ">" + escapeHtml(option.name) + "</option>";
      })
      .join("");
  }

  function renderQuestionRow(question, data, viewModel, ui) {
    var discipline = viewModel.disciplineMap[question.disciplineId];
    var activeScore = question.scores[data.activeSnapshotId] || 0;
    var isEditingPrinciple =
      ui.editingCell && ui.editingCell.id === question.id && ui.editingCell.field === "principle";
    var isEditingQuestion =
      ui.editingCell && ui.editingCell.id === question.id && ui.editingCell.field === "question";

    function renderCellEditor(field, value, isTextarea) {
      return (
        '<form class="inline-editor" data-action="save-question-edit" data-id="' +
        escapeHtml(question.id) +
        '" data-field="' +
        field +
        '">' +
        (isTextarea
          ? '<textarea name="value" class="input textarea compact-textarea" required maxlength="500">' +
            escapeHtml(value) +
            "</textarea>"
          : '<input name="value" class="input compact-input" required maxlength="500" value="' +
            escapeHtml(value) +
            '" />') +
        '<div class="inline-editor__actions">' +
        '<button type="submit" class="button button-small button-primary">Save</button>' +
        '<button type="button" class="button button-small button-ghost" data-action="cancel-question-edit">Cancel</button>' +
        "</div>" +
        "</form>"
      );
    }

    return (
      "<tr>" +
      '<td><span class="tag">' +
      escapeHtml(discipline ? discipline.name : "Unknown") +
      "</span></td>" +
      '<td class="cell-large">' +
      (isEditingPrinciple
        ? renderCellEditor("principle", question.principle, false)
        : '<div class="cell-display"><span>' +
          escapeHtml(question.principle) +
          '</span><button type="button" class="button-link" data-action="start-question-edit" data-id="' +
          escapeHtml(question.id) +
          '" data-field="principle">Edit</button></div>') +
      "</td>" +
      '<td class="cell-xl">' +
      (isEditingQuestion
        ? renderCellEditor("question", question.question, true)
        : '<div class="cell-display"><span>' +
          toMultilineHtml(question.question) +
          '</span><button type="button" class="button-link" data-action="start-question-edit" data-id="' +
          escapeHtml(question.id) +
          '" data-field="question">Edit</button></div>') +
      "</td>" +
      '<td class="cell-center"><div class="score-group">' +
      [1, 2, 3, 4, 5]
        .map(function (score) {
          return (
            '<button type="button" class="score-chip' +
            (activeScore === score ? " is-active" : "") +
            '" data-action="set-score" data-id="' +
            escapeHtml(question.id) +
            '" data-score="' +
            score +
            '" title="Set score to ' +
            score +
            " (" +
            escapeHtml(getMaturityLabel(score)) +
            ')">' +
            score +
            "</button>"
          );
        })
        .join("") +
      "</div></td>" +
      '<td class="cell-center"><span class="score-target">' +
      escapeHtml(question.targetScore) +
      "</span></td>" +
      '<td class="cell-center"><button type="button" class="button-link danger-link" data-action="delete-question" data-id="' +
      escapeHtml(question.id) +
      '">Delete</button></td>' +
      "</tr>"
    );
  }

  function renderRecoveryModal(data, viewModel, ui) {
    var clearSection = data.deletedQuestions.length
      ? ui.confirmClearBin
        ? '<div class="confirm-row"><span class="confirm-copy">Permanently clear the recovery bin?</span><button type="button" class="button button-small button-danger" data-action="confirm-clear-bin">Confirm</button><button type="button" class="button button-small button-ghost" data-action="cancel-clear-bin">Cancel</button></div>'
        : '<button type="button" class="button button-small button-danger-soft" data-action="prompt-clear-bin">Clear Bin</button>'
      : "";

    var content = viewModel.deletedQuestions.length
      ? viewModel.deletedQuestions
          .map(function (question) {
            return (
              '<div class="list-card">' +
              '<div class="list-card__body">' +
              '<div class="meta-row"><span class="meta-badge">' +
              escapeHtml(question.disciplineName) +
              '</span><span class="meta-time">' +
              escapeHtml(app.utils.date.formatTimestamp(question.deletedAt)) +
              "</span></div>" +
              "<h4>" +
              escapeHtml(question.principle) +
              "</h4>" +
              "<p>" +
              escapeHtml(question.question) +
              "</p>" +
              "</div>" +
              '<button type="button" class="button button-small button-primary" data-action="recover-question" data-id="' +
              escapeHtml(question.id) +
              '">Recover</button>' +
              "</div>"
            );
          })
          .join("")
      : '<div class="empty-state"><h4>No deleted questions found.</h4><p>Deleted items will appear here for recovery.</p></div>';

    return (
      '<div class="stack gap-lg">' +
      '<div class="panel panel-soft panel-row"><p class="panel-copy">Traceable history of deleted questions. Restore any item with its existing scores intact.</p>' +
      clearSection +
      "</div>" +
      '<div class="stack">' +
      content +
      "</div>" +
      "</div>"
    );
  }

  function renderAddQuestionModal(data) {
    return (
      '<form class="stack gap-lg" data-action="add-question">' +
      '<label class="field"><span class="field-label">Discipline</span><select class="input" name="disciplineId" required>' +
      renderOptions(data.disciplines, data.disciplines[0] ? data.disciplines[0].id : "") +
      "</select></label>" +
      '<label class="field"><span class="field-label">Principle</span><input class="input" name="principle" maxlength="200" placeholder="e.g. Daily Standups" required /></label>' +
      '<label class="field"><span class="field-label">Question Text</span><textarea class="input textarea" name="question" maxlength="500" placeholder="Enter the detailed question..." required></textarea></label>' +
      '<button type="submit" class="button button-primary button-block">Create Question</button>' +
      "</form>"
    );
  }

  function renderManageDisciplinesModal(data, ui) {
    var disciplineRows = data.disciplines
      .map(function (discipline) {
        var isEditing = ui.editingDisciplineId === discipline.id;
        return (
          '<div class="list-card">' +
          (isEditing
            ? '<form class="discipline-form" data-action="rename-discipline" data-id="' +
              escapeHtml(discipline.id) +
              '"><input class="input compact-input" name="name" value="' +
              escapeHtml(discipline.name) +
              '" required /><div class="inline-editor__actions"><button type="submit" class="button button-small button-primary">Save</button><button type="button" class="button button-small button-ghost" data-action="cancel-discipline-edit">Cancel</button></div></form>'
            : '<div class="discipline-row"><span class="discipline-name">' +
              escapeHtml(discipline.name) +
              '</span><div class="discipline-actions"><button type="button" class="button-link" data-action="start-discipline-edit" data-id="' +
              escapeHtml(discipline.id) +
              '">Rename</button><button type="button" class="button-link danger-link" data-action="delete-discipline" data-id="' +
              escapeHtml(discipline.id) +
              '">Delete</button></div></div>') +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="stack gap-lg">' +
      '<form class="row-form" data-action="add-discipline">' +
      '<input class="input" name="name" placeholder="New discipline name..." maxlength="120" required />' +
      '<button type="submit" class="button button-primary">Add</button>' +
      "</form>" +
      '<div class="stack">' +
      disciplineRows +
      "</div>" +
      "</div>"
    );
  }

  function renderAuditModal(data) {
    return (
      '<div class="stack">' +
      data.auditLog
        .map(function (entry) {
          return (
            '<div class="audit-entry">' +
            '<div class="meta-row"><span class="meta-badge">' +
            escapeHtml(entry.action) +
            '</span><span class="meta-time">' +
            escapeHtml(app.utils.date.formatTimestamp(entry.timestamp)) +
            "</span></div>" +
            "<p>" +
            escapeHtml(entry.details) +
            "</p>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderSnapshotModal(data, ui) {
    var snapshotRows = data.snapshots
      .map(function (snapshot, index) {
        var isActive = snapshot.id === data.activeSnapshotId;
        var isConfirmingDelete = ui.confirmDeleteSnapshotId === snapshot.id;
        return (
          '<div class="snapshot-card' +
          (isActive ? " is-active" : "") +
          '">' +
          '<button type="button" class="snapshot-select" data-action="select-snapshot" data-id="' +
          escapeHtml(snapshot.id) +
          '">' +
          "<strong>" +
          escapeHtml(app.utils.date.formatSnapshotDate(snapshot.date)) +
          "</strong>" +
          "<span>" +
          escapeHtml(app.utils.date.getSnapshotAnnotation(snapshot, index)) +
          "</span>" +
          "</button>" +
          (data.snapshots.length > 1
            ? isConfirmingDelete
              ? '<div class="confirm-inline"><button type="button" class="button button-small button-danger" data-action="confirm-delete-snapshot" data-id="' +
                escapeHtml(snapshot.id) +
                '">Delete</button><button type="button" class="button button-small button-ghost" data-action="cancel-delete-snapshot">Cancel</button></div>'
              : '<button type="button" class="button-link danger-link" data-action="prompt-delete-snapshot" data-id="' +
                escapeHtml(snapshot.id) +
                '">Delete</button>'
            : "") +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="stack gap-lg">' +
      '<div class="panel panel-soft">' +
      '<div class="panel-row panel-row--top"><div><h4 class="panel-title">' +
      (ui.snapshotMode === "bulk" ? "Bulk Generate Snapshots" : "Add New Snapshot") +
      '</h4><p class="panel-copy">Manage the assessment timeline and keep up to 12 dated snapshots.</p></div><button type="button" class="button button-small button-ghost" data-action="toggle-snapshot-mode">' +
      (ui.snapshotMode === "bulk" ? "Switch to Single" : "Switch to Bulk") +
      "</button></div>" +
      '<form class="stack gap-md" data-action="submit-snapshot-form">' +
      '<div class="grid grid-two"><label class="field"><span class="field-label">' +
      (ui.snapshotMode === "bulk" ? "Base Label" : "Label") +
      '</span><input class="input" name="label" maxlength="120" placeholder="' +
      (ui.snapshotMode === "bulk" ? "e.g. Review" : "e.g. Q1 Review") +
      '" /></label><label class="field"><span class="field-label">' +
      (ui.snapshotMode === "bulk" ? "Start Date" : "Date") +
      '</span><input class="input" type="date" name="date" value="' +
      escapeHtml(ui.snapshotDraft.date) +
      '" required /></label></div>' +
      (ui.snapshotMode === "bulk"
        ? '<div class="grid grid-two"><label class="field"><span class="field-label">Frequency</span><select class="input" name="frequency"><option' +
          (ui.snapshotDraft.frequency === "Weekly" ? ' selected="selected"' : "") +
          '>Weekly</option><option' +
          (ui.snapshotDraft.frequency === "Biweekly" ? ' selected="selected"' : "") +
          '>Biweekly</option><option' +
          (ui.snapshotDraft.frequency === "Monthly" ? ' selected="selected"' : "") +
          '>Monthly</option><option' +
          (ui.snapshotDraft.frequency === "Quarterly" ? ' selected="selected"' : "") +
          '>Quarterly</option><option' +
          (ui.snapshotDraft.frequency === "Half Yearly" ? ' selected="selected"' : "") +
          '>Half Yearly</option><option' +
          (ui.snapshotDraft.frequency === "Random" ? ' selected="selected"' : "") +
          '>Random</option></select></label><label class="field"><span class="field-label">Count (Max 12)</span><input class="input" type="number" name="count" min="1" max="12" value="' +
          escapeHtml(ui.snapshotDraft.count) +
          '" required /></label></div>'
        : "") +
      '<button type="submit" class="button button-primary button-block">' +
      (ui.snapshotMode === "bulk" ? "Generate Snapshots" : "Create Snapshot") +
      "</button></form></div>" +
      '<div class="stack"><div class="section-label">History (Max 12)</div>' +
      snapshotRows +
      "</div>" +
      "</div>"
    );
  }

  function renderBulkActionsModal(data, ui) {
    return (
      '<div class="stack gap-xl">' +
      '<div class="panel panel-danger">' +
      '<div class="panel-row panel-row--top"><div><h4 class="panel-title">Danger Zone</h4><p class="panel-copy">Clear all active questions and move them into the recovery bin.</p></div>' +
      (ui.confirmClearAll
        ? '<div class="confirm-inline"><button type="button" class="button button-small button-danger" data-action="confirm-clear-all">Confirm</button><button type="button" class="button button-small button-ghost" data-action="cancel-clear-all">Cancel</button></div>'
        : '<button type="button" class="button button-small button-danger-soft" data-action="prompt-clear-all">Clear All Questions</button>') +
      "</div></div>" +
      '<div class="stack gap-lg">' +
      '<div class="panel-row"><div><h4 class="panel-title">Bulk Import / Export</h4><p class="panel-copy">Paste one question per line. You can also prefix with discipline and principle using pipes.</p></div><button type="button" class="button button-small button-ghost" data-action="export-questions">Export Questions</button></div>' +
      '<form class="stack gap-md" data-action="bulk-import-questions">' +
      '<label class="field"><span class="field-label">Default Discipline</span><select class="input" name="defaultDisciplineId" required>' +
      renderOptions(data.disciplines, data.disciplines[0] ? data.disciplines[0].id : "") +
      "</select></label>" +
      '<label class="field"><span class="field-label">Questions</span><textarea class="input textarea textarea-lg" name="importText" placeholder="Agility | Daily Standups | How effectively does the team implement daily standups?&#10;Architecture | System is modular | Is the system designed with modularity in mind?" required></textarea></label>' +
      '<button type="submit" class="button button-primary button-block">Import Questions</button>' +
      "</form></div></div>"
    );
  }

  function renderModal(activeModal, data, viewModel, ui) {
    if (!activeModal) {
      return "";
    }

    var title = "";
    var body = "";

    if (activeModal === "recovery") {
      title = "Recover Deleted Questions";
      body = renderRecoveryModal(data, viewModel, ui);
    } else if (activeModal === "add-question") {
      title = "Add New Question";
      body = renderAddQuestionModal(data);
    } else if (activeModal === "manage-disciplines") {
      title = "Manage Disciplines";
      body = renderManageDisciplinesModal(data, ui);
    } else if (activeModal === "audit-log") {
      title = "Audit Trail";
      body = renderAuditModal(data);
    } else if (activeModal === "snapshot-manager") {
      title = "Assessment Timeline";
      body = renderSnapshotModal(data, ui);
    } else if (activeModal === "bulk-actions") {
      title = "Bulk Actions";
      body = renderBulkActionsModal(data, ui);
    }

    if (!title) {
      return "";
    }

    return (
      '<div class="modal-backdrop" data-action="close-modal">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' +
      escapeHtml(title) +
      '">' +
      '<div class="modal__header"><div><h3>' +
      escapeHtml(title) +
      '</h3></div><button type="button" class="button button-small button-ghost" data-action="close-modal">Close</button></div>' +
      '<div class="modal__body">' +
      body +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function render(root, state, viewModel) {
    var data = state.data;
    var ui = state.ui;
    var chartAvailable = ui.capabilities.chart;

    root.innerHTML =
      '<div class="app-shell">' +
      '<header class="app-header">' +
      '<div class="brand"><div class="brand__mark">AM</div><div><h1>Agile Maturity</h1><p>Assessment Dashboard</p></div></div>' +
      '<div class="toolbar">' +
      renderButton("Open JSON", "open-json", "button-secondary") +
      renderButton(
        ui.linkedFileName ? "Linked: " + escapeHtml(ui.linkedFileName) : "Link JSON",
        "link-json",
        ui.linkedFileName ? "button-accent" : "button-secondary"
      ) +
      renderButton("PDF", "export-pdf", "button-secondary" + (ui.capabilities.pdf ? "" : " is-disabled"), ui.capabilities.pdf ? "" : ' disabled="disabled"') +
      renderButton("PPTX", "export-pptx", "button-secondary" + (ui.capabilities.pptx ? "" : " is-disabled"), ui.capabilities.pptx ? "" : ' disabled="disabled"') +
      renderButton("Excel", "export-xlsx", "button-secondary" + (ui.capabilities.xlsx ? "" : " is-disabled"), ui.capabilities.xlsx ? "" : ' disabled="disabled"') +
      "</div>" +
      "</header>" +
      '<main class="app-main">' +
      (ui.notice
        ? '<div class="notice notice-' +
          escapeHtml(ui.notice.kind) +
          '"><strong>' +
          escapeHtml(ui.notice.title || "Notice") +
          ":</strong> " +
          escapeHtml(ui.notice.message) +
          "</div>"
        : "") +
      '<section class="grid grid-layout">' +
      '<article class="card card-summary">' +
      '<div class="card__header"><div><span class="eyebrow">Active Assessment</span><h2>' +
      escapeHtml(viewModel.activeSnapshotTitle) +
      "</h2>" +
      (viewModel.showActiveSnapshotDate
        ? '<p class="subtle-copy">' + escapeHtml(viewModel.activeSnapshotDateLabel) + "</p>"
        : "") +
      '</div><button type="button" class="button button-small button-ghost" data-action="open-modal" data-modal="snapshot-manager">Manage Timeline</button></div>' +
      '<div class="stats-grid">' +
      '<div class="stat-card stat-card-primary"><span>Overall Score</span><strong>' +
      escapeHtml(viewModel.overallAverage) +
      '</strong><small>(' +
      escapeHtml(getMaturityLabel(Number(viewModel.overallAverage))) +
      ")</small></div>" +
      '<div class="stat-card stat-card-success"><span>Target Score</span><strong>' +
      escapeHtml(viewModel.overallTargetAverage) +
      '</strong><small>(' +
      escapeHtml(getMaturityLabel(Number(viewModel.overallTargetAverage))) +
      ")</small></div>" +
      '<div class="stat-card"><span>Disciplines</span><strong>' +
      escapeHtml(data.disciplines.length) +
      "</strong></div>" +
      '<div class="stat-card"><span>Total Questions</span><strong>' +
      escapeHtml(data.questions.length) +
      "</strong></div>" +
      "</div></article>" +
      '<article class="card card-chart"><div class="card__header"><div><span class="eyebrow">Maturity Radar</span><h2>Current vs target by discipline</h2></div></div>' +
      (chartAvailable
        ? '<div class="radar-wrap"><canvas id="radar-chart"></canvas></div>'
        : '<div class="empty-state"><h4>Chart library unavailable.</h4><p>The dashboard still works, but radar and timeline charts need a network connection the first time the page loads.</p></div>') +
      "</article></section>" +
      '<section class="card"><div class="card__header"><div><span class="eyebrow">Maturity Levels</span><h2>CMMI-based scoring model</h2></div></div><div class="legend-grid">' +
      MATURITY_LEVELS.map(function (level) {
        return (
          '<div class="legend-card legend-card-' +
          escapeHtml(level.tone) +
          '"><strong>' +
          escapeHtml(level.score) +
          '</strong><span>' +
          escapeHtml(level.label) +
          "</span></div>"
        );
      }).join("") +
      "</div></section>" +
      '<section class="card"><div class="card__header card__header-split"><div><span class="eyebrow">Timeline Comparison</span><h2>Tracking progress across ' +
      escapeHtml(data.snapshots.length) +
      ' dated snapshots</h2></div><div class="toggle-group"><button type="button" class="toggle-button' +
      (ui.comparisonType === "bar" ? " is-active" : "") +
      '" data-action="set-comparison-type" data-type="bar">Bar</button><button type="button" class="toggle-button' +
      (ui.comparisonType === "line" ? " is-active" : "") +
      '" data-action="set-comparison-type" data-type="line">Line</button></div></div>' +
      (chartAvailable
        ? '<div class="chart-stack"><div class="chart-panel' +
          (ui.comparisonType === "bar" ? "" : " is-hidden") +
          '"><canvas id="bar-chart"></canvas></div><div class="chart-panel' +
          (ui.comparisonType === "line" ? "" : " is-hidden") +
          '"><canvas id="line-chart"></canvas></div></div>'
        : '<div class="empty-state"><h4>Charts are currently unavailable.</h4><p>Reload after the CDN-backed chart dependency becomes reachable.</p></div>') +
      "</section>" +
      '<section class="stack gap-lg"><div class="section-toolbar"><div class="section-toolbar__left"><div><span class="eyebrow">Assessment Questions</span><h2>Showing ' +
      escapeHtml(viewModel.filteredQuestionCount) +
      " of " +
      escapeHtml(data.questions.length) +
      ' questions</h2></div><div class="filter-row"><label class="field-inline"><span>Filter</span><select class="input" name="filterDiscipline" data-action="set-filter-discipline"><option value="all"' +
      (ui.filterDiscipline === "all" ? ' selected="selected"' : "") +
      '>All Disciplines</option>' +
      renderOptions(data.disciplines, ui.filterDiscipline) +
      '</select></label><button type="button" class="button button-small button-ghost" data-action="open-modal" data-modal="manage-disciplines">Manage Disciplines</button></div></div>' +
      '<div class="toolbar toolbar-compact"><button type="button" class="button button-small button-secondary" data-action="open-modal" data-modal="bulk-actions">Bulk Actions</button><button type="button" class="button button-small button-secondary" data-action="open-modal" data-modal="recovery">Recover</button><button type="button" class="button button-small button-primary" data-action="open-modal" data-modal="add-question">Add Question</button></div></div>' +
      '<div class="table-card"><div class="table-scroll"><table class="data-table"><thead><tr><th>Discipline</th><th>Principle</th><th>Question</th><th class="cell-center">Score</th><th class="cell-center">Target</th><th class="cell-center">Actions</th></tr></thead><tbody>' +
      (viewModel.filteredQuestions.length
        ? viewModel.filteredQuestions
            .map(function (question) {
              return renderQuestionRow(question, data, viewModel, ui);
            })
            .join("")
        : '<tr><td colspan="6"><div class="empty-state empty-state--compact"><h4>No questions match this filter.</h4><p>Choose another discipline or add new questions.</p></div></td></tr>') +
      "</tbody></table></div></div></section>" +
      "</main>" +
      '<footer class="footer-bar"><div class="footer-bar__inner"><div class="footer-meta"><button type="button" class="button-link" data-action="open-modal" data-modal="audit-log">Audit Log</button><span>Last modified: ' +
      escapeHtml(app.utils.date.formatTimestamp(data.lastModified)) +
      '</span></div><button type="button" class="button button-dark" data-action="download-json">Download JSON</button></div></footer>' +
      renderModal(ui.activeModal, data, viewModel, ui) +
      "</div>";
  }

  app.ui.renderer = {
    render: render,
  };
})(window);
