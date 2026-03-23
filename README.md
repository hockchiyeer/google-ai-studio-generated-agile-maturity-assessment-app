# Agile Maturity Assessment

A lightweight web application for tracking Agile maturity across disciplines, questions, and dated assessment snapshots.

This repository contains a single-page React dashboard backed by a minimal Express server that persists assessment data to a local `data.json` file. It is suitable for internal assessments, lightweight workshops, and maturity reviews where teams want a simple way to score current state, compare progress over time, and export results for reporting.

Originally scaffolded from Google AI Studio, the current implementation behaves as a reporting and assessment dashboard rather than an AI-powered application. There is no active Gemini-powered workflow in the shipped code today.

## Table of Contents

- [What This App Does](#what-this-app-does)
- [Who It Helps](#who-it-helps)
- [What Stakeholders Can Explore](#what-stakeholders-can-explore)
- [How Scoring Works](#how-scoring-works)
- [Implemented Features](#implemented-features)
- [Default Seed Data](#default-seed-data)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Data Model](#data-model)
- [Local Development](#local-development)
- [Build and Runtime Notes](#build-and-runtime-notes)
- [Exports and File Formats](#exports-and-file-formats)
- [Bulk Import From the data Folder](#bulk-import-from-the-data-folder)
- [Security, Privacy, and Governance Notes](#security-privacy-and-governance-notes)
- [Current Limitations and Technical Debt](#current-limitations-and-technical-debt)
- [Suggested Next Improvements](#suggested-next-improvements)

## What This App Does

The app helps teams assess Agile maturity by organizing questions into disciplines, assigning 1-5 maturity scores, and comparing results across multiple dated snapshots.

In practical terms, it lets a team:

1. Define or import an assessment question bank.
2. Score the current maturity of each question.
3. Track multiple assessment snapshots over time.
4. Compare current maturity against target maturity.
5. Visualize patterns by discipline and over time.
6. Export reports for presentations, spreadsheets, or document sharing.

## Who It Helps

### Non-Technical Stakeholders

- Delivery managers and transformation leads who want a quick read on Agile health.
- PMO, engineering leadership, or governance teams who need a repeatable assessment format.
- Workshop facilitators who want a live scoring dashboard during retrospective or maturity sessions.
- Sponsors who need shareable exports in PDF, PowerPoint, or Excel formats.

### Developers and Maintainers

- Frontend engineers who need to understand the app flow and reporting logic.
- Full-stack developers extending persistence, authentication, or collaboration features.
- Platform teams adapting the project from its Google AI Studio template origin.

## What Stakeholders Can Explore

Without reading any code, a stakeholder can use the app to explore:

- The active assessment snapshot and its date.
- Overall maturity score for the current snapshot.
- Target maturity score averaged across all questions.
- Breakdown by discipline through a radar chart.
- Progress over time using bar and line comparison charts.
- Full question-level scoring in a tabular format.
- Deleted question recovery history.
- Audit trail of major actions such as edits, imports, snapshot changes, and exports.

## How Scoring Works

The app uses a 1-5 maturity scale described in the UI as a CMMI-based scoring model:

| Score | Label |
| --- | --- |
| 1 | Adhoc |
| 2 | Defined |
| 3 | Consistent |
| 4 | Managed |
| 5 | Optimizing |

Key scoring behavior:

- Each question stores a score per snapshot.
- The active snapshot determines which score is shown and edited in the table.
- Overall maturity is the average of all question scores in the active snapshot.
- Radar chart values are averaged by discipline.
- Target maturity is tracked per question and is averaged separately.
- In the current UI, target score exists in the data model and exports, but is not editable from the interface. Seeded and newly created questions default to a target score of `4`.

## Implemented Features

### Assessment Management

- View all questions in a structured assessment table.
- Filter questions by discipline.
- Add new questions with:
  - discipline
  - principle
  - question text
- Edit question principle and question text inline.
- Delete questions into a recovery bin rather than immediately destroying them.
- Recover deleted questions later.

### Discipline Management

- Seeded with default disciplines.
- Add custom disciplines.
- Rename existing disciplines.
- Delete a discipline and move its questions into the recovery bin.

### Snapshot and Timeline Management

- Maintain multiple dated assessment snapshots.
- Switch between snapshots to score different points in time.
- Add a single snapshot manually.
- Bulk-generate snapshots with configurable frequency:
  - Weekly
  - Biweekly
  - Monthly
  - Quarterly
  - Half Yearly
  - Random
- Snapshot history is capped at 12 entries.

### Visual Reporting

- Radar chart for discipline-level current vs target maturity.
- Bar chart for overall and per-discipline trend comparison across snapshots.
- Line chart for the same trend data.
- Summary cards for:
  - overall score
  - target score
  - total disciplines
  - total questions

### Data Import, Export, and Recovery

- Download the entire assessment state as JSON.
- Open a JSON file and replace the current in-memory state.
- Link a local JSON file for automatic file-system autosave.
- Export current questions as plain text.
- Bulk-import questions from plain text.
- Export reports to:
  - PDF
  - PPTX
  - XLSX
- Maintain an audit log of recent actions.
- Recovery bin for deleted questions, with explicit bin clearing when needed.

### Persistence Behavior

- On load, the frontend requests `/api/data`.
- If server data exists, it becomes the active dataset.
- If no server data exists, the app starts from seeded default data in `src/constants.ts`.
- Any change is automatically saved back to the server after a 1 second debounce.
- If a JSON file has been linked through the browser file picker, changes are also written to that linked file.

## Default Seed Data

The initial experience is not empty. The app seeds:

- 8 default disciplines:
  - Agility
  - Overall Process
  - Requirements
  - Architecture
  - Implementation
  - Test
  - Operations
  - Buildmanagement
- 60 generic starter questions distributed across those disciplines.
- 1 initial snapshot labeled `Initial Assessment`.
- 1 initial audit log entry noting application initialization.

This makes the app immediately demoable, but many teams will likely want to replace the seeded question set with their own assessment model.

## Architecture Overview

```text
+---------------------------+
| React SPA (src/App.tsx)   |
| - scoring UI              |
| - charts                  |
| - exports                 |
| - modals/forms            |
+-------------+-------------+
              |
              | GET/POST /api/data
              v
+---------------------------+
| Express server (server.ts)|
| - JSON API                |
| - dev Vite middleware     |
| - prod static hosting     |
+-------------+-------------+
              |
              | read/write
              v
+---------------------------+
| data.json                 |
| full persisted app state  |
+---------------------------+
```

### Runtime Flow

- `server.ts` starts an Express app on port `3000`.
- In development, Express mounts Vite in middleware mode.
- In production, Express serves the built `dist/` folder and falls back to `index.html` for SPA routing.
- The frontend stores all app state in React and persists the full serialized state to disk through the API.

### Important Architectural Notes

- Most business logic currently lives in a single large file: `src/App.tsx`.
- Persistence is file-based, not database-backed.
- There is no authentication, authorization, or multi-user conflict handling.
- The backend stores a whole-document JSON payload rather than patching individual records.

## Technology Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | UI rendering |
| Language | TypeScript | Type-safe application code |
| Bundler | Vite 6 | Frontend build/dev tooling |
| Styling | Tailwind CSS 4 | Utility-first styling |
| Animation | `motion` | Modal and UI transitions |
| Icons | `lucide-react` | Interface icons |
| Charts | Chart.js + `react-chartjs-2` | Radar, bar, and line charts |
| PDF Export | `jspdf` + `jspdf-autotable` | PDF report generation |
| PPT Export | `pptxgenjs` | PowerPoint export |
| Spreadsheet Export | `xlsx` | Excel workbook export |
| Backend | Express | API and hosting wrapper |
| TS Runtime | `tsx` | Running `server.ts` directly |
| Template Origin | Google AI Studio metadata | Project scaffold/source context |

### Template Leftovers

The repo still contains some Google AI Studio template artifacts:

- `.env.example` documents `GEMINI_API_KEY` and `APP_URL`
- `vite.config.ts` exposes `process.env.GEMINI_API_KEY` to the client build
- `package.json` includes `@google/genai`
- `metadata.json` contains AI Studio app metadata

At the moment, none of the shipped app flows call Gemini or use `@google/genai`.

## Repository Structure

```text
.
|-- .env.example
|-- index.html
|-- metadata.json
|-- package.json
|-- server.ts
|-- tsconfig.json
|-- vite.config.ts
`-- src
    |-- App.tsx
    |-- constants.ts
    |-- index.css
    |-- main.tsx
    `-- types.ts
```

### File-Level Guide

- `src/App.tsx`: Main application UI, state, handlers, charts, exports, and modal components.
- `src/constants.ts`: Default disciplines, initial snapshot, seeded question generation, and initial state.
- `src/types.ts`: Type definitions for disciplines, questions, snapshots, audit entries, and full assessment data.
- `server.ts`: Express server for API persistence and local/prod hosting.
- `vite.config.ts`: Vite config, React plugin, Tailwind plugin, env injection, and dev HMR toggle.
- `metadata.json`: App metadata from the Google AI Studio scaffold.

## Data Model

The application persists a single JSON document shaped like this:

```json
{
  "schemaVersion": "1.0.0",
  "disciplines": [
    { "id": "A", "name": "Agility" }
  ],
  "questions": [
    {
      "id": "q-1",
      "disciplineId": "A",
      "principle": "Agility Principle 1",
      "question": "How effectively does the team implement standard agile practices?",
      "scores": {
        "initial-snapshot": 2
      },
      "targetScore": 4
    }
  ],
  "deletedQuestions": [],
  "snapshots": [
    {
      "id": "initial-snapshot",
      "date": "2026-03-24",
      "label": "Initial Assessment"
    }
  ],
  "activeSnapshotId": "initial-snapshot",
  "auditLog": [
    {
      "id": "log-1",
      "timestamp": "2026-03-24T00:00:00.000Z",
      "action": "System",
      "details": "Application initialized with seeded data."
    }
  ],
  "lastModified": "2026-03-24T00:00:00.000Z"
}
```

### Core Types

- `Discipline`: category for grouping questions.
- `Question`: principle, prompt text, target score, and snapshot-based score map.
- `Snapshot`: named, dated assessment point.
- `AuditEntry`: lightweight change/event record.
- `AssessmentData`: full persisted application state.

### Data Model Notes

- `scores` is a map of `snapshotId -> score`.
- Deleted questions are not immediately lost; they move to `deletedQuestions`.
- Audit log is capped to the 100 most recent entries.
- Snapshot history is capped to the 12 most recent snapshots.

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Environment

You can copy `.env.example` to `.env.local` if you want to preserve template compatibility:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Important note:

- The current app does not require Gemini to perform its implemented workflows.
- `GEMINI_API_KEY` is documented because of the original AI Studio scaffold, not because the present code actively uses it.

### Run the App

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### What Happens on First Run

- The server starts on port `3000`.
- The frontend loads seeded data from `src/constants.ts` if no saved server data exists yet.
- The initial seeded state is automatically persisted to `data.json` in the project root after the first save cycle.

## Build and Runtime Notes

### Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Starts the Express + Vite development server |
| `npm run build` | Builds the frontend into `dist/` |
| `npm run preview` | Runs Vite preview for the built frontend only |
| `npm run lint` | Runs TypeScript type-checking with `tsc --noEmit` |
| `npm run clean` | Removes `dist/` using `rm -rf` |

### Important Notes About Scripts

- `npm run preview` does not provide the Express `/api/data` backend, so it is useful for frontend build preview but not full end-to-end persistence testing.
- `npm run clean` uses Unix-style `rm -rf`, which may not work as-is in Windows PowerShell.
- There is currently no dedicated production `start` script in `package.json`.

### Serving a Production Build

The frontend can be built with:

```bash
npm run build
```

To serve the built app through `server.ts`, run the server with `NODE_ENV=production`.

Example on macOS/Linux:

```bash
NODE_ENV=production npx tsx server.ts
```

Example on Windows PowerShell:

```powershell
$env:NODE_ENV="production"
npx tsx server.ts
```

## Exports and File Formats

### JSON

- `Download JSON` exports the full current application state.
- `Open JSON` imports a previously saved state file.
- `Link JSON` enables browser-based autosave to a user-selected JSON file through the File System Access API.

### Plain Text Question Export/Import

Question export creates one line per question. Bulk import supports:

```text
Question Text
Discipline | Question Text
Discipline | Principle | Question Text
```

If a discipline name does not match an existing discipline exactly, the selected default discipline is used.

### PDF Export

The PDF report includes:

1. Overview page with snapshot metadata and radar chart.
2. Comparison page with bar and line chart images.
3. Detailed assessment table with all questions, snapshot scores, and target score.

### PPTX Export

The PowerPoint export includes:

1. Overview slide with the radar chart.
2. Comparison slide with bar and line charts.
3. Detailed table slide with auto-paging enabled for long content.

### XLSX Export

The Excel export includes:

- `Assessment` sheet with question-level detail
- `Radar Data` sheet with discipline-level current and target maturity values

## Bulk Import From the data Folder

The repository already includes two reusable question sources inside [`data`](./data) folder:

- [`agile-maturity-questions-2026-03-23.txt`](./data/agile-maturity-questions-2026-03-23.txt)
- [`ProjectMaturityAssessmentReviewTemplate.xlsx`](./data/ProjectMaturityAssessmentReviewTemplate.xlsx)

Important limitation:

- The app's bulk import UI accepts pasted plain text only.
- It does not currently upload `.xlsx` files directly.
- Supported import formats are:
  - `Question Text`
  - `Discipline | Question Text`
  - `Discipline | Principle | Question Text`

### Option 1: Import Questions Directly From the Text File

Use this option if you want the fastest path. The text file is already close to the app's expected bulk-import format.

1. Start the app locally with `npm run dev`.
2. Open the app in your browser at `http://localhost:3000`.
3. Open [`agile-maturity-questions-2026-03-23.txt`](./data/agile-maturity-questions-2026-03-23.txt).
4. Copy the lines you want to import, or copy the whole file.
5. In the app, open `Bulk Actions` from the assessment table toolbar.
6. In `Default Discipline`, choose the fallback discipline you want the app to use if any pasted line contains an unrecognized discipline name.
7. Paste the copied lines into the bulk import text area.
8. Click `Import Questions`.
9. Review the assessment table and confirm the imported questions appear as expected.
10. Wait about one second for autosave, or use `Download JSON` if you want an explicit backup of the new state.

Notes for the text file:

- The importer splits each line on the pipe character `|`.
- The first text file already follows the `Discipline | Principle | Question Text` pattern closely enough for bulk import.
- Commas and quotation marks inside the question text are fine.
- If a pasted discipline name does not match an existing app discipline exactly, the app falls back to the `Default Discipline` you selected.

### Option 2: Use the Excel Workbook as a Question Source

Use this option when you want to source questions from the Excel template workbook in [`ProjectMaturityAssessmentReviewTemplate.xlsx`](./data/ProjectMaturityAssessmentReviewTemplate.xlsx).

Because the app does not import Excel files directly, the process is:

1. Open the workbook in Excel or another spreadsheet tool that can edit `.xlsx` files.
2. Go to the `Questionaire` sheet.
3. Identify the rows you want to import as questions.
4. Add a new helper column to build app-compatible import lines.
5. In the helper column, use a formula that converts each row into this format:

```text
Discipline | Principle | Question Text
```

Recommended formula example:

```excel
="Agility | " & A2 & " / " & C2 & " (" & B2 & ") | " & TRIM(SUBSTITUTE(SUBSTITUTE(D2 & " " & E2, CHAR(10), " "), CHAR(13), " "))
```

What this formula does:

- Uses `Agility` as the app discipline prefix.
- Preserves workbook context from columns `A`, `B`, and `C` inside the principle text.
- Combines the main question text from columns `D` and `E`.
- Replaces Excel line breaks with spaces so that each imported question stays on a single line.

How to adapt the formula:

- Replace `Agility` with any discipline name that already exists in the app, such as:
  - `Agility`
  - `Overall Process`
  - `Requirements`
  - `Architecture`
  - `Implementation`
  - `Test`
  - `Operations`
  - `Buildmanagement`
- If you do not want to preserve all workbook context, you can simplify the formula. Example:

```excel
="Agility | " & C2 & " | " & TRIM(SUBSTITUTE(SUBSTITUTE(D2 & " " & E2, CHAR(10), " "), CHAR(13), " "))
```

Step-by-step import from Excel:

1. Enter the formula in the helper column for the first question row.
2. Fill the formula down for all rows you want to import.
3. Copy the helper-column results only.
4. Open the app and click `Bulk Actions`.
5. Choose a `Default Discipline` as a fallback.
6. Paste the generated lines into the bulk import text area.
7. Click `Import Questions`.
8. Review the imported results in the assessment table.
9. If anything imported incorrectly, use the recovery and edit features to clean up, or re-open a clean JSON state and repeat the import.

Practical tips for the Excel workbook:

- Do not paste the raw spreadsheet table directly into the app; convert it to pipe-delimited text first.
- Skip header rows and any summary or chart sheets.
- Keep one question per line.
- If a row contains multi-line text, make sure your helper formula removes line breaks before copying.
- If the first segment of a line is not an exact app discipline name, the app will use the selected `Default Discipline` instead.

## Security, Privacy, and Governance Notes

This application is lightweight and intentionally simple, which means governance controls are minimal in the current codebase.

Things to know:

- All persisted data is stored in a single JSON file on disk.
- The API currently accepts and writes the full posted payload with minimal validation.
- There is no user login, role separation, or audit immutability guarantee.
- If deployed beyond a local/internal environment, the backend should be protected with authentication and proper storage controls.
- Exported reports may contain sensitive internal process or delivery information.

### Important AI/Secret Handling Note

`vite.config.ts` injects `GEMINI_API_KEY` into the client build via `define`. That is acceptable only because the current code does not actually use it. If AI capabilities are added later, avoid exposing privileged keys directly to browser code. Prefer server-side proxying or platform-managed secure access patterns.

## Current Limitations and Technical Debt

This section is intentionally candid so future maintainers and stakeholders know what is implemented today versus what may still be aspirational.

- No active Gemini or AI-assisted feature is implemented despite template references.
- No database; persistence is single-file JSON with last-write-wins behavior.
- No multi-user collaboration support.
- No authentication or role-based permissions.
- No automated tests or CI configuration are present in the repository.
- Most UI and business logic lives inside one large `src/App.tsx` file, which increases maintenance cost.
- Target scores are visible but not editable in the current UI.
- Browser file-link autosave depends on the File System Access API, which works best in Chromium-based browsers.
- The page title in `index.html` still reflects the generic template name rather than the product name.
- The repository currently has no dedicated license file at the root.

## Suggested Next Improvements

If this app is meant to evolve beyond a lightweight internal tool, the most valuable next steps would be:

1. Split `src/App.tsx` into smaller components and hooks.
2. Add schema validation for imported and posted JSON.
3. Introduce a real datastore instead of flat-file persistence.
4. Add authentication and role-based access.
5. Make target scores editable in the UI.
6. Add automated tests for data transforms, exports, and persistence flows.
7. Add a proper production `start` script.
8. Replace or remove unused AI Studio template remnants.
9. Add organization-specific question packs or assessment templates.
10. If AI support is desired, add it intentionally and securely rather than exposing client-side secrets.

## Summary

This repository is a solid foundation for a small, self-contained Agile maturity dashboard. It already delivers useful stakeholder value through scoring, timeline tracking, recovery, and multi-format export. For broader production use, it would benefit from stronger persistence, validation, security, and modularization.
