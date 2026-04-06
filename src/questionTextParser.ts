export type ParsedQuestionTextRecord = {
  disciplineName: string | null;
  principle: string | null;
  question: string;
};

export type QuestionTextExportRecord = {
  disciplineName: string;
  principle: string;
  question: string;
};

type PendingQuestionTextRecord = {
  rawRecord: string;
  isStructured: boolean;
};

function normalizeImportText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function normalizeLineWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function cleanImportedSegment(text: string) {
  return normalizeImportText(text)
    .replace(/""/g, '"')
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function parseSeparatedSegments(value: string, delimiter: string) {
  const text = String(value ?? "");
  const segments: string[] = [];
  let current = "";
  let inQuotes = false;
  let atSegmentStart = true;
  let justClosedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (!inQuotes && atSegmentStart) {
        inQuotes = true;
        justClosedQuote = false;
      } else if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        atSegmentStart = false;
        justClosedQuote = false;
      } else if (
        inQuotes &&
        (!nextCharacter || nextCharacter === delimiter || /\s/.test(nextCharacter))
      ) {
        inQuotes = false;
        justClosedQuote = true;
      } else {
        current += character;
        atSegmentStart = false;
        justClosedQuote = false;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      segments.push(current.trim());
      current = "";
      atSegmentStart = true;
      justClosedQuote = false;
      continue;
    }

    if (!(justClosedQuote && /\s/.test(character))) {
      current += character;
      if (!/\s/.test(character)) {
        atSegmentStart = false;
      }
    }

    if (!/\s/.test(character)) {
      justClosedQuote = false;
    }
  }

  segments.push(current.trim());
  return segments;
}

function isStructuredImportLine(line: string) {
  if (!line.includes("|")) {
    return false;
  }

  return parseSeparatedSegments(line, "|").length >= 2;
}

function splitImportRecords(text: string) {
  const lines = normalizeImportText(text).split("\n");
  const records: string[] = [];
  let pendingRecord: PendingQuestionTextRecord | null = null;

  const flushPendingRecord = () => {
    if (!pendingRecord) {
      return;
    }

    if (pendingRecord.rawRecord.trim()) {
      records.push(pendingRecord.rawRecord.trim());
    }
    pendingRecord = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const lineStructured = line ? isStructuredImportLine(line) : false;

    if (!line) {
      if (pendingRecord?.isStructured) {
        pendingRecord.rawRecord += "\n";
      }
      continue;
    }

    if (!pendingRecord) {
      pendingRecord = {
        rawRecord: line,
        isStructured: lineStructured,
      };
      continue;
    }

    if (lineStructured) {
      flushPendingRecord();
      pendingRecord = {
        rawRecord: line,
        isStructured: true,
      };
      continue;
    }

    if (pendingRecord.isStructured) {
      pendingRecord.rawRecord += `\n${line}`;
      continue;
    }

    flushPendingRecord();
    pendingRecord = {
      rawRecord: line,
      isStructured: false,
    };
  }

  flushPendingRecord();

  return records;
}

function hasDelimitedQuotedSegment(value: string) {
  return /(^|,)\s*"/.test(value);
}

function parseDelimitedSegments(value: string) {
  return parseSeparatedSegments(value, ",");
}

function splitLooseQuestionParts(value: string) {
  const text = normalizeImportText(value).trim();
  const segments: string[] = [];
  let startIndex = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== ",") {
      continue;
    }

    const leftCharacter = text[index - 1];
    let probeIndex = index + 1;

    while (probeIndex < text.length) {
      const probeCharacter = text[probeIndex];
      if (probeCharacter === '"' || /\s/.test(probeCharacter)) {
        probeIndex += 1;
      } else {
        break;
      }
    }

    if (
      leftCharacter === '"' ||
      text[index + 1] === '"' ||
      ((leftCharacter === "." ||
        leftCharacter === "!" ||
        leftCharacter === "?" ||
        leftCharacter === ")") &&
        /[A-Z0-9]/.test(text[probeIndex] ?? ""))
    ) {
      segments.push(text.slice(startIndex, index));
      startIndex = index + 1;
    }
  }

  if (!segments.length) {
    return [cleanImportedSegment(text)];
  }

  segments.push(text.slice(startIndex));
  return segments.map(cleanImportedSegment).filter(Boolean);
}

function stripMetadataTail(parts: string[]) {
  if (parts.length < 2) {
    return parts;
  }

  for (let startIndex = 1; startIndex < parts.length; startIndex += 1) {
    const tail = parts.slice(startIndex);
    let hasMetadataValue = false;
    const isMetadataTail = tail.every((part) => {
      if (!part) {
        return true;
      }

      hasMetadataValue = true;
      return /^[0-5]$/.test(part) || /^[Xx]$/.test(part);
    });

    if (isMetadataTail && hasMetadataValue) {
      return parts.slice(0, startIndex);
    }
  }

  return parts;
}

function extractImportQuestionParts(questionText: string) {
  const normalizedQuestion = normalizeImportText(questionText).trim();

  if (!normalizedQuestion) {
    return [];
  }

  if (normalizedQuestion.includes(",,")) {
    return normalizedQuestion
      .split(/\s*,\s*,\s*/)
      .map(cleanImportedSegment)
      .filter(Boolean);
  }

  let bodyParts =
    normalizedQuestion.includes("\n")
      ? normalizedQuestion
          .split(/\n\s*\n+/)
          .map(cleanImportedSegment)
          .filter(Boolean)
      : [cleanImportedSegment(normalizedQuestion)];

  if (bodyParts.length === 1 && hasDelimitedQuotedSegment(normalizedQuestion)) {
    bodyParts = parseDelimitedSegments(normalizedQuestion)
      .map(cleanImportedSegment)
      .filter(Boolean);
  }

  if (bodyParts.length === 1 && normalizedQuestion.includes(",")) {
    bodyParts = splitLooseQuestionParts(normalizedQuestion);
  }

  if (bodyParts.length > 1) {
    const lastBodyPart = bodyParts[bodyParts.length - 1];
    if (/^[0-5Xx,\s]*$/.test(lastBodyPart) && lastBodyPart.includes(",")) {
      bodyParts = bodyParts
        .slice(0, -1)
        .concat(parseDelimitedSegments(lastBodyPart).map(cleanImportedSegment).filter(Boolean));
    }
  }

  return stripMetadataTail(bodyParts);
}

function normalizeExportSegment(text: string) {
  return normalizeImportText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getQuestionExportParts(questionText: string) {
  const parts = normalizeImportText(questionText)
    .split(/\n\s*\n+/)
    .map(normalizeExportSegment)
    .filter(Boolean);

  return parts.length ? parts : ["Imported question"];
}

function normalizeExportPrinciple(principle: string) {
  const normalized = principle.trim();
  return normalized.replace(/^[A-Z]\d{2}\s*-\s*/, "").trim() || normalized || "General Principle";
}

export function formatQuestionTextRecord(record: QuestionTextExportRecord) {
  return [
    record.disciplineName || "Unknown",
    normalizeExportPrinciple(record.principle || "General Principle"),
    getQuestionExportParts(record.question).join(",,"),
  ].join(" | ");
}

export function parseQuestionTextRecords(text: string): ParsedQuestionTextRecord[] {
  return splitImportRecords(text)
    .map((record): ParsedQuestionTextRecord | null => {
      const structuredParts = parseSeparatedSegments(record, "|");

      if (structuredParts.length >= 3) {
        const question = extractImportQuestionParts(structuredParts.slice(2).join(" | ")).join("\n\n");
        return question
          ? {
              disciplineName: structuredParts[0] || null,
              principle: structuredParts[1] || null,
              question,
            }
          : null;
      }

      if (structuredParts.length === 2) {
        const question = extractImportQuestionParts(structuredParts[1]).join("\n\n");
        return question
          ? {
              disciplineName: structuredParts[0] || null,
              principle: null,
              question,
            }
          : null;
      }

      const question = extractImportQuestionParts(record).join("\n\n") || normalizeLineWhitespace(record);
      return question
        ? {
            disciplineName: null,
            principle: null,
            question,
          }
        : null;
    })
    .filter((record): record is ParsedQuestionTextRecord => Boolean(record?.question));
}
