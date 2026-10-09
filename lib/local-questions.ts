import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type VisitorQuestionRecord = {
  id: number | string;
  customer_name: string | null;
  customer_email: string;
  question_text: string;
  created_at: string;
  source?: "local" | "database";
};

const questionsPath = () => path.join(process.cwd(), "data", "visitor-questions.json");

export function readLocalVisitorQuestions(): VisitorQuestionRecord[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(questionsPath(), "utf8"));
    return Array.isArray(parsed)
      ? (parsed as VisitorQuestionRecord[]).map((question) => ({ ...question, source: "local" }))
      : [];
  } catch {
    return [];
  }
}

export function saveLocalVisitorQuestion(
  question: Omit<VisitorQuestionRecord, "id" | "created_at" | "source">,
) {
  const record: VisitorQuestionRecord = {
    ...question,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  const dataDirectory = path.dirname(questionsPath());
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(questionsPath(), JSON.stringify([record, ...readLocalVisitorQuestions()], null, 2));
  return { ...record, source: "local" as const };
}