/**
 * cypress/support/selectors.js
 *
 * Centralised selector registry.
 * Every cy.get() in step definitions should reference this object
 * so changes to the DOM only require a single update here.
 */

const APP_STORAGE_KEY = "agile-maturity-assessment-data";

const SEL = {
  // ── Shell & Layout ──────────────────────────────────────────────
  appShell: ".app-shell",
  appHeader: ".app-header",
  appMain: ".app-main",
  footer: ".footer-bar",
  brandMark: ".brand__mark",
  brandTitle: ".brand h1",
  toolbar: ".toolbar",

  // ── Notices ─────────────────────────────────────────────────────
  notice: ".notice",

  // ── Summary Stats ────────────────────────────────────────────────
  statsGrid: ".stats-grid",
  statOverallScore: ".stat-card-primary strong",
  statTargetScore: ".stat-card-success strong",
  statDisciplines: ".stats-grid .stat-card:nth-child(3) strong",
  statQuestions: ".stats-grid .stat-card:nth-child(4) strong",

  // ── Maturity Legend ──────────────────────────────────────────────
  legendGrid: ".legend-grid",
  legendCards: ".legend-card",

  // ── Charts ───────────────────────────────────────────────────────
  radarChart: "#radar-chart",
  barChart: "#bar-chart",
  lineChart: "#line-chart",
  toggleBar: '[data-action="set-comparison-type"][data-type="bar"]',
  toggleLine: '[data-action="set-comparison-type"][data-type="line"]',
  toggleActive: ".toggle-button.is-active",

  // ── Questions Table ──────────────────────────────────────────────
  questionTable: ".data-table",
  questionRows: ".data-table tbody tr",
  filterSelect: '[data-action="set-filter-discipline"]',

  // ── Score Chips ──────────────────────────────────────────────────
  scoreChip: (score) => `[data-action="set-score"][data-score="${score}"]`,
  activeScoreChip: ".score-chip.is-active",

  // ── Toolbar Actions ──────────────────────────────────────────────
  btnOpenJson: '[data-action="open-json"]',
  btnLinkJson: '[data-action="link-json"]',
  btnExportPdf: '[data-action="export-pdf"]',
  btnExportPptx: '[data-action="export-pptx"]',
  btnExportXlsx: '[data-action="export-xlsx"]',
  btnDownloadJson: '[data-action="download-json"]',

  // ── Section Toolbar ──────────────────────────────────────────────
  btnAddQuestion: '[data-action="open-modal"][data-modal="add-question"]',
  btnBulkActions: '[data-action="open-modal"][data-modal="bulk-actions"]',
  btnRecover: '[data-action="open-modal"][data-modal="recovery"]',
  btnManageTimeline: '[data-action="open-modal"][data-modal="snapshot-manager"]',
  btnManageDisciplines: '[data-action="open-modal"][data-modal="manage-disciplines"]',
  btnAuditLog: '[data-action="open-modal"][data-modal="audit-log"]',

  // ── Modal ────────────────────────────────────────────────────────
  modalBackdrop: ".modal-backdrop",
  modal: ".modal",
  modalTitle: ".modal__header h3",
  btnCloseModal: '[data-action="close-modal"]',

  // ── Add Question Form ─────────────────────────────────────────────
  addQuestionForm: '[data-action="add-question"]',
  addQuestionDisciplineSelect: '[data-action="add-question"] select[name="disciplineId"]',
  addQuestionPrincipleInput: '[data-action="add-question"] input[name="principle"]',
  addQuestionTextarea: '[data-action="add-question"] textarea[name="question"]',
  addQuestionSubmit: '[data-action="add-question"] button[type="submit"]',

  // ── Inline Editing ────────────────────────────────────────────────
  inlineEditInput: '.inline-editor input[name="value"]',
  inlineEditTextarea: '.inline-editor textarea[name="value"]',
  inlineEditSave: '.inline-editor button[type="submit"]',
  inlineEditCancel: '[data-action="cancel-question-edit"]',

  // ── Discipline Management ─────────────────────────────────────────
  addDisciplineForm: '[data-action="add-discipline"]',
  addDisciplineInput: '[data-action="add-discipline"] input[name="name"]',
  addDisciplineSubmit: '[data-action="add-discipline"] button[type="submit"]',
  renameDisciplineInput: (id) => `[data-action="rename-discipline"][data-id="${id}"] input[name="name"]`,
  renameDisciplineSubmit: (id) => `[data-action="rename-discipline"][data-id="${id}"] button[type="submit"]`,
  btnRenameDiscipline: (id) => `[data-action="start-discipline-edit"][data-id="${id}"]`,
  btnDeleteDiscipline: (id) => `[data-action="delete-discipline"][data-id="${id}"]`,

  // ── Snapshot Manager ──────────────────────────────────────────────
  snapshotForm: '[data-action="submit-snapshot-form"]',
  snapshotLabelInput: '[data-action="submit-snapshot-form"] input[name="label"]',
  snapshotDateInput: '[data-action="submit-snapshot-form"] input[name="date"]',
  snapshotFrequencySelect: '[data-action="submit-snapshot-form"] select[name="frequency"]',
  snapshotCountInput: '[data-action="submit-snapshot-form"] input[name="count"]',
  snapshotSubmit: '[data-action="submit-snapshot-form"] button[type="submit"]',
  btnToggleSnapshotMode: '[data-action="toggle-snapshot-mode"]',
  snapshotCards: ".snapshot-card",

  // ── Bulk Actions ──────────────────────────────────────────────────
  btnClearAll: '[data-action="prompt-clear-all"]',
  btnConfirmClearAll: '[data-action="confirm-clear-all"]',
  btnCancelClearAll: '[data-action="cancel-clear-all"]',
  btnExportQuestions: '[data-action="export-questions"]',

  // ── Bulk Import ───────────────────────────────────────────────────
  bulkImportForm: '[data-action="bulk-import-questions"]',
  bulkImportDefaultDiscipline: '[data-action="bulk-import-questions"] select[name="defaultDisciplineId"]',
  bulkImportTextarea: '[data-action="bulk-import-questions"] textarea[name="importText"]',
  bulkImportSubmit: '[data-action="bulk-import-questions"] button[type="submit"]',

  // ── Recovery Bin ──────────────────────────────────────────────────
  btnClearBin: '[data-action="prompt-clear-bin"]',
  btnConfirmClearBin: '[data-action="confirm-clear-bin"]',
  btnCancelClearBin: '[data-action="cancel-clear-bin"]',
  recoveredCards: ".list-card",
  emptyState: ".empty-state",

  // ── Audit Log ─────────────────────────────────────────────────────
  auditEntries: ".audit-entry",
};

module.exports = { SEL, APP_STORAGE_KEY };
