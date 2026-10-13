/** 위기 감지 — AI보다 앞단. 해제 불가. 문구는 data/safety.json */
import raw from "@/data/safety.json";

export type SafetyLevel = "crisis" | "abuse";
export type SafetyHit = { level: SafetyLevel; matched: string } | null;

export const SAFETY = raw as {
  selfHarm: string[];
  abuse: string[];
  messages: Record<SafetyLevel, { title: string; body: string; lines: { label: string; value: string }[] }>;
  feelings: string[];
  adultCard: { title: string; hint: string; placeholder: string };
};

const squash = (s: string) => s.replace(/\s/g, "");

export function checkSafety(text: string): SafetyHit {
  const t = squash(text);
  for (const k of SAFETY.selfHarm) if (t.includes(squash(k))) return { level: "crisis", matched: k };
  for (const k of SAFETY.abuse) if (t.includes(squash(k))) return { level: "abuse", matched: k };
  return null;
}
