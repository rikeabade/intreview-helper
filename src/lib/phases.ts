import type { Locale } from "./locale";
import { getDictionary } from "./i18n";

export const PHASE_IDS = ["behavioral", "technical-qa", "system-design", "live-coding"] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export interface PhaseDef {
  id: PhaseId;
  label: string;
  focus: string;
}

export function getPhases(locale: Locale): PhaseDef[] {
  const phrases = getDictionary(locale).phases;
  return PHASE_IDS.map((id) => ({ id, ...phrases[id] }));
}

const LANGUAGE_KEYWORDS: { keyword: string; language: string }[] = [
  { keyword: "typescript", language: "typescript" },
  { keyword: "javascript", language: "javascript" },
  { keyword: "node", language: "javascript" },
  { keyword: "react", language: "typescript" },
  { keyword: "python", language: "python" },
  { keyword: "django", language: "python" },
  { keyword: "java", language: "java" },
  { keyword: "kotlin", language: "kotlin" },
  { keyword: "golang", language: "go" },
  { keyword: " go ", language: "go" },
  { keyword: "rust", language: "rust" },
  { keyword: "c++", language: "cpp" },
  { keyword: "c#", language: "csharp" },
  { keyword: ".net", language: "csharp" },
  { keyword: "ruby", language: "ruby" },
  { keyword: "rails", language: "ruby" },
  { keyword: "php", language: "php" },
  { keyword: "swift", language: "swift" },
];

export function detectLanguage(jobDescription: string): string {
  const lower = jobDescription.toLowerCase();
  for (const { keyword, language } of LANGUAGE_KEYWORDS) {
    if (lower.includes(keyword)) return language;
  }
  return "javascript";
}
