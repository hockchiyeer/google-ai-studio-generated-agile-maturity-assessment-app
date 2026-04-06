import { AssessmentData, Question, Snapshot } from "./types";
import {
  DEFAULT_DISCIPLINES,
  SEEDED_QUESTION_TEMPLATES,
} from "./seededQuestionBank";

export { DEFAULT_DISCIPLINES };

const INITIAL_SNAPSHOT_ID = "initial-snapshot";
const INITIAL_SNAPSHOT: Snapshot = {
  id: INITIAL_SNAPSHOT_ID,
  date: new Date().toISOString().split('T')[0],
  label: "Initial Assessment",
};

const generateSeededQuestions = (): Question[] =>
  SEEDED_QUESTION_TEMPLATES.map((template, index) => ({
    id: `q-${index + 1}`,
    disciplineId: template.disciplineId,
    principle: template.principle,
    question: template.question,
    scores: { [INITIAL_SNAPSHOT_ID]: 2 },
    targetScore: 4,
  }));

export const INITIAL_DATA: AssessmentData = {
  schemaVersion: "1.0.0",
  disciplines: DEFAULT_DISCIPLINES,
  questions: generateSeededQuestions(),
  deletedQuestions: [],
  snapshots: [INITIAL_SNAPSHOT],
  activeSnapshotId: INITIAL_SNAPSHOT_ID,
  auditLog: [{
    id: "log-1",
    timestamp: new Date().toISOString(),
    action: "System",
    details: "Application initialized with the corrected seeded question bank."
  }],
  lastModified: new Date().toISOString(),
};
