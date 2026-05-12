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

## Development and Automated Tests

This repository includes a full Cucumber-style BDD test suite powered by Cypress (v13+) that exercises the app end-to-end against a local static server. The tests are designed to be atomic: every feature seeds the browser `localStorage` with fixture data and tears down state between scenarios so the real app data is not modified.

Prerequisites
- Node.js 18+ (or a compatible LTS)
- npm (comes with Node.js)

Install dev dependencies:

```powershell
npm install
```

Start the static server and run the full E2E suite (recommended):

```powershell
npm run test:e2e
```

If you prefer to run the server and Cypress separately (useful when debugging):

```powershell
npm run serve    ; # starts a static server on http://localhost:5500
npm run cy:open  ; # opens Cypress GUI
```

Or run the headless runner against an already-running server:

```powershell
npm run cy:run
```

Test design notes
- Tests live under `cypress/e2e/features` (Gherkin `.feature` files).
- Step definitions are in `cypress/step_definitions` and support utilities in `cypress/support`.
- Fixtures used to seed the app are under `cypress/fixtures/` (for example `seed-data-minimal.json`).
- The test harness injects the fixture via `cy.seedAndVisit()` which writes the fixture to the app's storage key before the page scripts run. This makes tests deterministic and atomic.
- A small helper `cy.waitForAppIdle()` was added to `cypress/support/commands.js` to reduce timing-related flakiness by waiting for transient notices to clear and the app shell to be visible.

Troubleshooting
- If Cypress reports it cannot verify the server is running, ensure the static server is listening on http://localhost:5500 (the `serve` script uses `serve . --listen 5500`).
- Windows-specific process enumeration errors (OperationalError from `ps-tree`) have been observed at test teardown when tooling attempts to enumerate child processes. If you encounter an error like:

	OperationalError: Unknown process listing header:

	This originates from `ps-tree` (used by some npm helpers) trying to parse process listings on certain Windows environments. Workarounds:
	- Run the server manually (see commands above) and then run `npm run cy:run` so start/stop tooling isn't required.
	- Update packages in a branch to newer versions where `ps-tree` is replaced/updated (advanced).

Reporting and CI
- The `test:e2e` script uses `start-server-and-test` to start the static server and run the Cypress CLI; it will return a non-zero exit code if tests fail.
- Test screenshots are saved to `cypress/screenshots` when a test fails.

If you need help stabilizing specific failing specs, open an issue with the failing spec name and an attached screenshot from `cypress/screenshots`.

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
