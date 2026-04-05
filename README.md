# Agile Maturity Assessment

> Legacy Google AI Studio link: https://aistudio.google.com/apps/75c64662-c4a3-4af1-9dfc-f9a23f8e8aea?source=start&showAssistant=true&showPreview=true

`Agile Maturity Assessment` is now a static, browser-native JavaScript application that runs by opening [index.html](./index.html) directly. No build step, package install, dev server, or deployment wrapper is required.

## What It Does

The app helps teams assess Agile maturity by organizing questions into disciplines, scoring each question on a 1-5 maturity scale, and tracking changes across dated snapshots.

It preserves the feature set from the original repo:

- question add, edit, delete, and recovery
- discipline add, rename, and delete
- snapshot history management, including bulk generation
- current vs target maturity tracking
- radar, bar, and line chart reporting
- audit trail
- bulk question import and question export
- JSON open, linked autosave when supported, and JSON download
- PDF, PPTX, and XLSX export

The default question bank is now ported from [data/ProjectMaturityAssessmentReviewTemplate.xlsx](./data/ProjectMaturityAssessmentReviewTemplate.xlsx), with curated wording corrections applied from [data/agile-maturity-questions-2026-03-23.txt](./data/agile-maturity-questions-2026-03-23.txt). Those fixed questions are the startup baseline every time the app opens.

## Run It

Open [index.html](./index.html) in a browser.

That is the full runtime flow.

## Persistence Model

- The main working dataset is saved to `localStorage`.
- On startup, saved state is merged onto the fixed workbook-backed question bank so the Excel questions are restored even if they were edited or deleted in a prior session.
- `Open JSON` replaces the current in-browser dataset from a JSON file.
- `Link JSON` writes changes back to a chosen JSON file when the browser supports the File System Access API.
- `Download JSON` exports the full current dataset at any time.

## Architecture

The refactor keeps a modular helper-based structure with small, single-purpose files.

```text
.
|-- index.html
|-- package.json
|-- data/
|-- src/
|   |-- app.js
|   |-- styles.css
|   |-- core/
|   |   `-- namespace.js
|   |-- constants/
|   |   |-- default-data.js
|   |   `-- project-review-question-bank.js
|   |-- controllers/
|   |   `-- app-controller.js
|   |-- models/
|   |   `-- assessment-schema.js
|   |-- services/
|   |   |-- chart-service.js
|   |   |-- export-service.js
|   |   `-- persistence-service.js
|   |-- state/
|   |   `-- store.js
|   |-- ui/
|   |   |-- renderer.js
|   |   `-- view-model.js
|   `-- utils/
|       |-- date-utils.js
|       |-- dom-utils.js
|       |-- download-utils.js
|       |-- id-utils.js
|       `-- score-utils.js
```

### Module Responsibilities

- `src/controllers/app-controller.js`: UI actions and workflow orchestration
- `src/services/persistence-service.js`: `localStorage`, JSON open, and linked-file writes
- `src/services/export-service.js`: PDF, PPTX, XLSX, JSON, and text export
- `src/services/chart-service.js`: Chart.js lifecycle management
- `src/ui/view-model.js`: derived dashboard metrics and chart datasets
- `src/ui/renderer.js`: HTML rendering for the dashboard and modals
- `src/models/assessment-schema.js`: dataset normalization and cloning
- `src/constants/project-review-question-bank.js`: fixed question bank ported from the workbook
- `src/constants/default-data.js`: startup dataset creation from the fixed workbook-backed bank

## Dependency Notes

The app itself is plain browser JavaScript. For reporting features, `index.html` loads these libraries from CDNs at runtime:

- Chart.js
- jsPDF
- jsPDF AutoTable
- PptxGenJS
- SheetJS (`xlsx`)

If those CDN assets are unavailable, the core assessment workflow still loads, but related chart/export features will be limited for that session.

## Browser Notes

- The app avoids ES module loading so it can run from `file://` by directly opening `index.html`.
- Linked autosave depends on browser support for the File System Access API.
- `localStorage` keeps the working copy between browser sessions on the same machine/profile.

## Data Model

The persisted JSON shape is intentionally kept compatible with the previous app structure:

- `disciplines`
- `questions`
- `deletedQuestions`
- `snapshots`
- `activeSnapshotId`
- `auditLog`
- `lastModified`

## Data Folder

The [data](./data) folder is still available for sample materials and import/export reference assets:

- [data/agile-maturity-questions-2026-03-23.txt](./data/agile-maturity-questions-2026-03-23.txt)
- [data/ProjectMaturityAssessmentReviewTemplate.xlsx](./data/ProjectMaturityAssessmentReviewTemplate.xlsx)
