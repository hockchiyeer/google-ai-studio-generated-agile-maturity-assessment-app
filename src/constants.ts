import { AssessmentData, Snapshot } from "./types";

export const DEFAULT_DISCIPLINES = [
  { id: "A", name: "Agility" },
  { id: "B", name: "Overall Process" },
  { id: "C", name: "Requirements" },
  { id: "D", name: "Architecture" },
  { id: "E", name: "Implementation" },
  { id: "F", name: "Test" },
  { id: "G", name: "Operations" },
  { id: "H", name: "Buildmanagement" },
];

const INITIAL_SNAPSHOT_ID = "initial-snapshot";
const INITIAL_SNAPSHOT: Snapshot = {
  id: INITIAL_SNAPSHOT_ID,
  date: new Date().toISOString().split('T')[0],
  label: "Initial Assessment",
};

// Seeded questions - 60 questions across 8 disciplines
// For brevity in this constant, we'll generate some generic ones but ensure they cover all disciplines
const generateSeededQuestions = () => {
  const questions = [];
  const counts: Record<string, number> = {
    A: 8, B: 8, C: 8, D: 7, E: 7, F: 8, G: 7, H: 7
  };

  let qId = 1;
  for (const disc of DEFAULT_DISCIPLINES) {
    const count = counts[disc.id] || 7;
    for (let i = 1; i <= count; i++) {
      questions.push({
        id: `q-${qId++}`,
        disciplineId: disc.id,
        principle: `${disc.name} Principle ${i}`,
        question: `How effectively does the team implement standard agile practices for ${disc.name.toLowerCase()}? This assessment evaluates the depth of adoption and consistency across the project lifecycle.`,
        scores: { [INITIAL_SNAPSHOT_ID]: 2 },
        targetScore: 4,
      });
    }
  }
  return questions;
};

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
    details: "Application initialized with seeded data."
  }],
  lastModified: new Date().toISOString(),
};
