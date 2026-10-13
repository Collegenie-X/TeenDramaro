/**
 * 🎞 상대 인물 — 오프라인 애드립 엔진.
 * 원칙(§6): 매 비트 내 말의 「한 단어를 받아서」 돌려준다. 판을 대신 끝내지 않는다.
 * 대사는 0줄 — 원작 대사를 가져오지 않고, data/archetypes.json의 pool만 쓴다.
 *
 * 여러 명일 때:
 *   ensemble  상대들이 번갈아 끼어든다. 내가 이름을 부르면 그 사람이 받는다
 *   queue     한 명씩 차례로 — arc의 lead 이벤트로 다음 사람이 판을 넘겨받는다
 *   watchers  👀 지켜보는 사람 — 가끔 속삭이고 반응한다 (판은 안 끈다)
 *   arc       📜 정해진 턴에 일어나는 일 — 긴 장면의 굴곡
 */
import type { Archetype, Character, Dials } from "./types";
import { fillJosa, hash, pickWord, toneOf } from "./text";

export type ImprovState = {
  beat: number;          // 지금까지 내가 친 비트 수
  dials: Dials;
  factsShown: number;
  used: string[];        // 이미 쓴 애드립 재료(템플릿)
  lead?: string;         // queue — 지금 판을 끄는 사람
  whisper?: string;      // 🤫 PD 귓속말 — 다음 비트에 한 번 반영
};

export type Aside = { kind: "event" | "line" | "watch"; text: string; by?: string; dir?: string; lead?: boolean };
export type ImprovReply = {
  line: string; dir?: string; fact?: string; word: string; by: string; asides: Aside[]; used: string[];
  /** 📜 이번 턴은 arc에 정해진 대사 — AI 애드립 대신 이 줄이 나간다 */
  scripted?: boolean;
};

const LOOK_AWAY = ["폰만 본다", "시선은 딴 데", "대답하며 고개를 돌린다"];
const LOOK_AT = ["너를 똑바로 본다", "한 발 다가온다", "눈을 안 피한다"];

/** 결정적 자리까지 내 말 수 */
export const PIVOT_AT = 4;
export const turnsOf = (a: Archetype) => a.turns ?? PIVOT_AT;
export const freshImprov = (dials: Dials): ImprovState => ({ beat: 0, dials, factsShown: 0, used: [] });

/** 「반장 건우」 「두 번째 손님 · 국어 쌤」 → 부를 때 쓰는 짧은 이름 */
export const callName = (name: string) => name.replace(/\(.*?\)/g, "").split("·").at(-1)!.trim().split(" ").at(-1)!;

export const castOf = (a: Archetype): Character[] => [a.scene.other, ...(a.scene.others ?? [])];

/** arc에서 처음 말하는 턴 — 그 전엔 아직 장면에 없다 */
const entersAt = (a: Archetype, name: string) =>
  Math.min(...(a.arc ?? []).filter((e) => e.kind === "line" && e.by === name).map((e) => e.at), Infinity);

function speakerFor(a: Archetype, s: ImprovState, text: string): Character {
  const n = s.beat + 1;
  const cast = castOf(a).filter((c) => c === a.scene.other || entersAt(a, c.name) === Infinity || entersAt(a, c.name) < n);
  const lead = cast.find((c) => c.name === s.lead) ?? a.scene.other;
  if (cast.length === 1 || a.mode === "queue") return lead;
  const called = cast.find((c) => text.includes(callName(c.name)));
  if (called) return called;
  const others = cast.filter((c) => c !== lead);
  // 세 번에 한 번쯤 다른 사람이 끼어든다
  return s.beat % 3 === 2 ? others[Math.floor(s.beat / 3) % others.length] : lead;
}

/** ⭐ 추천 길 위 — reply가 있으면 그 대사로, 사실은 정해진 턴에만, 👀 우연한 반응은 arc 것만 */
export type PathTurn = { reply?: { t: string; by?: string; dir?: string } };

export function improvReply(a: Archetype, s: ImprovState, text: string, opts: { direction?: boolean; path?: PathTurn } = {}): ImprovReply {
  const w = pickWord(text);
  const tone = opts.direction ? "plain" : toneOf(text);
  const d = s.dials;
  const n = s.beat + 1;
  const script = (a.arc ?? []).find((e) => e.at === n && e.kind === "line");
  const golden = !script ? opts.path?.reply : undefined;
  const who = (script && castOf(a).find((c) => c.name === script.by))
    || (golden && (castOf(a).find((c) => c.name === golden.by) ?? a.scene.other))
    || speakerFor(a, s, text);
  const habit = who.habit;
  const seed = hash(text) + s.beat;
  const used: string[] = [];

  // 이 인물이 아직 안 쓴 애드립 재료부터
  const pool = who.pool?.length ? who.pool : a.pool;
  const fresh = pool.filter((p) => !s.used.includes(p));
  const tpl = (fresh.length ? fresh : pool)[seed % (fresh.length || pool.length)];
  used.push(tpl);
  const poolLine = fillJosa(tpl, { w });

  let line: string;
  if (opts.direction) {
    line = d.eyes >= 2 ? `…지금 뭐 하는 거야?` : poolLine;
  } else if (tone === "silent") {
    line = habit ? `…왜 말이 없어? ${habit}.` : "…왜 말이 없어?";
  } else if (tone === "question") {
    line = d.honesty <= 0 ? fillJosa("{w}? 그걸 왜 물어.", { w }) : poolLine;
  } else if (tone === "joke") {
    line = d.play >= 2 ? fillJosa("ㅋㅋ {w} 뭐야. 아 진짜.", { w }) : fillJosa("{w}? 지금 장난칠 때야?", { w });
  } else if (tone === "refuse") {
    line = d.stubborn >= 3
      ? fillJosa("{w}라니. 한 번만 더 생각해 봐.", { w })
      : d.stubborn <= 1 ? fillJosa("…알았어, {w}.", { w }) : poolLine;
  } else if (tone === "apology") {
    line = d.honesty >= 2 ? fillJosa("{w}… 그 말 기다렸어.", { w }) : fillJosa("됐어, {w}는.", { w });
  } else {
    line = poolLine;
  }

  if (script) line = fillJosa(script.text, { w });
  else if (golden) line = golden.t;

  let dir: string | undefined;
  if (script) dir = script.dir;
  else if (golden) dir = golden.dir;
  else if (s.whisper) dir = s.whisper;
  else if (d.eyes <= 0) dir = LOOK_AWAY[seed % LOOK_AWAY.length];
  else if (d.eyes >= 3) dir = LOOK_AT[seed % LOOK_AT.length];
  else if (d.play >= 3) dir = "웃음을 참는다";
  else if (who.persona && seed % 2 === 0) {
    const body = who.persona.body;
    dir = body[seed % body.length];   // 🎭 이 인물의 몸짓 버릇
  }

  // 🟡 새 사실 — 판 길이에 고르게 흩어 둔다. 솔직함이 높거나 캐물으면 앞당겨진다
  const turns = turnsOf(a);
  let fact: string | undefined;
  if (s.factsShown < a.facts.length) {
    const due = Math.max(1, Math.round(((s.factsShown + 1) * turns) / (a.facts.length + 1)));
    const pushed = !opts.path && ((tone === "question" && d.honesty >= 2 && n >= 2) || (d.honesty >= 3 && n >= 2));
    if (n >= due || pushed) fact = a.facts[s.factsShown];
  }

  // 📜 이번 턴에 정해진 일 + 👀 지켜보는 사람의 반응
  const asides: Aside[] = (a.arc ?? []).filter((e) => e.at === n && e !== script).map((e) => ({ ...e, text: fillJosa(e.text, { w }) }));
  const watchers = a.scene.watchers ?? [];
  // 👀 가끔만 — 세 턴에 한 번쯤, 판이 시선에 묻히지 않게
  if (!opts.path && watchers.length && !asides.some((x) => x.kind === "watch") && n >= 2 && (n + seed) % 3 === 0) {
    const wt = watchers[(seed + s.beat) % watchers.length];
    const left = wt.lines.filter((l) => !s.used.includes(l));
    if (left.length) {
      const l = left[seed % left.length];
      used.push(l);
      asides.push({ kind: "watch", by: wt.name, text: fillJosa(l, { w }) });
    }
  }

  return { line, dir, fact, word: w, by: who.name, asides, used, scripted: !!script || !!golden };
}

export const nextState = (s: ImprovState, r: ImprovReply): ImprovState => ({
  ...s,
  beat: s.beat + 1,
  factsShown: r.fact ? s.factsShown + 1 : s.factsShown,
  used: [...s.used, ...r.used],
  lead: r.asides.find((x) => x.lead)?.by ?? s.lead,
  whisper: undefined,
});
