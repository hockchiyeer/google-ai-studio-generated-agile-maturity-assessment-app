import { Discipline } from "./types";
import questionBankText from "../data/agile-maturity-questions-2026-04-05_(empty_lines_in_between_format).txt?raw";

export type SeededQuestionTemplate = {
  disciplineId: string;
  principle: string;
  question: string;
};

type ParsedQuestion = {
  disciplineId: string;
  disciplineName: string;
  principle: string;
  questionParts: string[];
};

const SOURCE_FILE =
  "data/agile-maturity-questions-2026-04-05_(empty_lines_in_between_format).txt";

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getDisciplineId(principle: string, fallback: string) {
  const matchedId = principle.match(/^([A-Z])/);
  return matchedId?.[1] ?? fallback.charAt(0).toUpperCase();
}

function parseSeededQuestionBank(text: string) {
  const disciplines = new Map<string, Discipline>();
  const questions: SeededQuestionTemplate[] = [];
  let current: ParsedQuestion | null = null;

  const flushCurrent = () => {
    if (!current) {
      return;
    }

    if (!disciplines.has(current.disciplineId)) {
      disciplines.set(current.disciplineId, {
        id: current.disciplineId,
        name: current.disciplineName,
      });
    }

    questions.push({
      disciplineId: current.disciplineId,
      principle: current.principle,
      question: current.questionParts
        .map(normalizeWhitespace)
        .filter(Boolean)
        .join(" "),
    });

    current = null;
  };

  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if ((line.match(/\|/g) ?? []).length >= 2) {
      flushCurrent();

      const [disciplineName, principle, ...questionParts] = line
        .split("|")
        .map((part) => part.trim());

      if (!disciplineName || !principle || questionParts.length === 0) {
        throw new Error(`Invalid question record in ${SOURCE_FILE}: ${line}`);
      }

      current = {
        disciplineId: getDisciplineId(principle, disciplineName),
        disciplineName,
        principle,
        questionParts: [questionParts.join(" | ").trim()],
      };

      continue;
    }

    if (current) {
      current.questionParts.push(line);
    }
  }

  flushCurrent();

  if (disciplines.size !== 8) {
    throw new Error(
      `Expected 8 disciplines in ${SOURCE_FILE}, received ${disciplines.size}.`,
    );
  }

  if (questions.length !== 60) {
    throw new Error(
      `Expected 60 questions in ${SOURCE_FILE}, received ${questions.length}.`,
    );
  }

  return {
    disciplines: Array.from(disciplines.values()),
    questions,
  };
}

const parsedQuestionBank = parseSeededQuestionBank(questionBankText);

export const DEFAULT_DISCIPLINES = parsedQuestionBank.disciplines;
export const SEEDED_QUESTION_TEMPLATES = parsedQuestionBank.questions;
