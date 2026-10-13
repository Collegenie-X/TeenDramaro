"use client";

import type { AiKind } from "./prompts";
import type { SafetyLevel } from "./safety";

export type AiResult<T> =
  | { kind: "ai"; data: T }
  | { kind: "offline" }
  | { kind: "safety"; level: SafetyLevel };

/** AI가 있으면 쓰고, 없거나 늦으면 offline — 부르는 쪽이 내장 엔진으로 대신한다 */
export async function askAI<T>(kind: AiKind, input: string, context: Record<string, unknown>): Promise<AiResult<T>> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const res = await fetch("/api/scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, input, context }),
      signal: ctl.signal,
    });
    const json = await res.json();
    if (json.safety) return { kind: "safety", level: json.safety };
    if (json.offline || json.error) return { kind: "offline" };
    return { kind: "ai", data: json as T };
  } catch {
    return { kind: "offline" };
  } finally {
    clearTimeout(timer);
  }
}
