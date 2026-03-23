
export type Discipline = {
  id: string;
  name: string;
};

export type Question = {
  id: string;
  disciplineId: string;
  principle: string;
  question: string;
  scores: Record<string, number>; // snapshotId -> score (1-5)
  targetScore: number;
  deletedAt?: string; // Timestamp when question was deleted
};

export type Snapshot = {
  id: string;
  date: string;
  label: string;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
};

export type AssessmentData = {
  schemaVersion: string;
  disciplines: Discipline[];
  questions: Question[];
  deletedQuestions: Question[];
  snapshots: Snapshot[];
  activeSnapshotId: string;
  auditLog: AuditEntry[];
  lastModified: string;
};
