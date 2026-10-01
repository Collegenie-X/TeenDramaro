/**
 * 디렉터 개입 패턴 — data/patterns.json의 선택기.
 *
 * 벡터 검색이 아니라 태그 매칭이다. 패턴이 40개 안팎이면 (막, 깊이, 유저 말의 신호)로
 * 고르는 쪽이 더 정확하고, 어떤 패턴이 왜 뽑혔는지 로그로 남아 디버깅이 된다.
 * 매 비트마다 2~3개를 골라 프롬프트에 "디렉터 수첩"으로 끼운다. 디렉터(LLM)는
 * 그 패턴을 이 세션의 재료로 각색한다 — 문장을 그대로 베끼는 게 아니다.
 */

import raw from "@/data/patterns.json";
import type { MovementId } from "./stage";
import type { DepthLevel } from "./depth";
import { josa } from "./josa";

export type Pattern = {
  id: string;
  name: string;
  move: string;
  movements: MovementId[];
  depth: number[];
  /** 유저 말에서 이 패턴을 부르는 신호 — 정규식 문자열 */
  signals: string[];
  stage: string;
  question: string;
  avoid: string;
  /** 보조자아를 세우는 패턴 */
  aux?: boolean;
  /** 첫 비트에만 */
  firstBeatOnly?: boolean;
  /** 신호가 맞으면 다른 것보다 앞세운다 (후퇴·안전) */
  priority?: number;
  /** 애매한 답이 n비트 이어졌을 때만 */
  vagueStreak?: number;
};

export const PATTERNS: Pattern[] = (raw as { patterns: Pattern[] }).patterns;

export function patternById(id: string): Pattern | undefined {
  return PATTERNS.find((p) => p.id === id);
}

export type PickCtx = {
  movement: MovementId;
  depth: DepthLevel;
  lastUser: string;
  beatNo: number;
  /** 이 세션에서 이미 제시한 패턴 id — 같은 걸 되풀이하지 않는다 */
  used: string[];
  vagueStreak?: number;
  /** 상대가 이미 무대에 있는가 — aux 패턴의 가산점 */
  hasOther?: boolean;
};

type Scored = { p: Pattern; score: number; hit: string[] };

/** (막, 깊이, 신호)로 점수를 매겨 상위 n개. 신호가 하나도 안 맞아도 막·깊이가 맞으면 후보가 된다. */
export function pickPatterns(ctx: PickCtx, n = 3): Scored[] {
  const text = ctx.lastUser.trim();
  const out: Scored[] = [];

  for (const p of PATTERNS) {
    if (!p.movements.includes(ctx.movement)) continue;
    if (p.firstBeatOnly && ctx.beatNo > 0) continue;
    if (p.vagueStreak && (ctx.vagueStreak ?? 0) < p.vagueStreak) continue;

    let score = 0;
    const hit: string[] = [];

    // 깊이 — 정확히 맞으면 3, 한 칸 차이면 1, 두 칸 이상이면 후보 제외(두 단 점프 금지)
    const gap = Math.min(...p.depth.map((d) => Math.abs(d - ctx.depth)));
    if (gap >= 2) continue;
    score += gap === 0 ? 3 : 1;

    // 신호 — 유저 말에 맞는 정규식마다 4점
    if (text) {
      for (const sig of p.signals) {
        try {
          if (new RegExp(sig, "i").test(text)) { score += 4; hit.push(sig); }
        } catch { /* 잘못된 정규식은 무시 */ }
      }
    }
    // 후퇴·안전 패턴은 신호가 있을 때만 — 평상시 후보 자리를 차지하지 않는다
    if (p.priority) { if (!hit.length) continue; score += p.priority; }
    if (p.aux && ctx.hasOther) score += 1;

    // 되풀이 억제 — 최근에 쓴 패턴일수록 감점
    const recency = ctx.used.lastIndexOf(p.id);
    if (recency >= 0) score -= Math.max(1, 4 - (ctx.used.length - 1 - recency));

    out.push({ p, score, hit });
  }

  out.sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
  return out.slice(0, n);
}

const JOSA: Record<string, [string, string]> = {
  가: ["이", "가"], 는: ["은", "는"], 를: ["을", "를"], 야: ["아", "야"], 랑: ["이랑", "랑"],
};
const pick = (w: string, j: string) => { const [a, b] = JOSA[j]; return josa(w, a, b); };

/** 프롬프트에 끼우는 블록. 디렉터가 각색할 수 있게 패턴의 뼈대만 준다. */
export function patternBlock(ctx: PickCtx, names: { A: string; B: string }, n = 3): string {
  const picks = pickPatterns(ctx, n);
  if (!picks.length) return "";
  /* {A}가 / {A}는 / {A}를 — 이름 받침에 맞춰 조사를 고친다 */
  const fill = (s: string) =>
    s
      .replace(/\{A\}(가|는|를|야|랑)/g, (_, j) => names.A + pick(names.A, j))
      .replace(/\{B\}(가|는|를|야|랑)/g, (_, j) => names.B + pick(names.B, j))
      .replace(/\{A\}/g, names.A)
      .replace(/\{B\}/g, names.B);
  const lines = picks.map(({ p, hit }, i) => {
    const why = hit.length ? `유저 말의 신호에 맞음` : `막·깊이에 맞음`;
    return [
      `${i + 1}. [${p.id}] ${p.name} (기법: ${p.move}) — ${why}`,
      p.stage ? `   지시: ${fill(p.stage)}` : "",
      `   질문: ${fill(p.question)}`,
      p.avoid ? `   주의: ${p.avoid}` : "",
    ].filter(Boolean).join("\n");
  });
  return `[디렉터 수첩 — 이번 비트에 맞는 개입 패턴. 하나를 골라 이 세션의 재료로 각색하라]
문장을 그대로 베끼지 마라. {장소}·{감정}·{행동} 같은 자리는 유저가 실제로 쓴 말로 채워라.
고른 패턴의 id를 출력 JSON의 "pattern"에 적어라. 셋 다 안 맞으면 "pattern"은 빈 문자열, 네 판단으로 가라.
${lines.join("\n")}`;
}
