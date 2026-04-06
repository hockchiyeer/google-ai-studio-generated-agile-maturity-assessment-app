import { Discipline } from "./types";
import questionBankText from "../data/agile-maturity-questions-2026-04-05_(empty_lines_in_between_format).txt?raw";
import { parseQuestionTextRecords } from "./questionTextParser";

export type SeededQuestionTemplate = {
  disciplineId: string;
  principle: string;
  question: string;
};

const SOURCE_FILE =
  "data/agile-maturity-questions-2026-04-05_(empty_lines_in_between_format).txt";

function getDisciplineId(principle: string, fallback: string) {
  const matchedId = principle.match(/^([A-Z])/);
  return matchedId?.[1] ?? fallback.charAt(0).toUpperCase();
}

function parseSeededQuestionBank(text: string) {
  const disciplines = new Map<string, Discipline>();
  const questions: SeededQuestionTemplate[] = [];
  const parsedRecords = parseQuestionTextRecords(text);

  for (const record of parsedRecords) {
    if (!record.disciplineName || !record.principle) {
      throw new Error(
        `Invalid seeded question record in ${SOURCE_FILE}: missing discipline or principle.`,
      );
    }

    const disciplineId = getDisciplineId(record.principle, record.disciplineName);

    if (!disciplines.has(disciplineId)) {
      disciplines.set(disciplineId, {
        id: disciplineId,
        name: record.disciplineName,
      });
    }

    questions.push({
      disciplineId,
      principle: record.principle,
      question: record.question,
    });
  }

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
