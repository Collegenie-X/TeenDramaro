/**
 * 🪞 내 무대 — 오프라인 진행자.
 * 사이코드라마 웜업 → 행위 → 나눔(§8). 진행자는 제안만 하고, 캐묻지 않고, 해석하지 않는다.
 * 대사 재료는 data/inner.json.
 */
import { ARCHETYPES, INNER, pick, type ActId } from "./data";
import { fillJosa, hash, josa, pickWord } from "./text";
import type { Archetype, Beat, ScenePiece, TechId } from "./types";
import { uid } from "./store";

export type InnerOther = { name: string; line: string; habit?: string };

export type InnerState = {
  act: ActId;
  alias: string;
  avatar: boolean;
  distance: number;          // 1 가까이 · 2 · 3 멀리
  cardId?: string;
  place: string;
  time: string;
  object: string;
  other?: InnerOther;
  mode: null | "reversal" | "chair" | "soliloquy" | "future" | "replay";
  beats: Beat[];
  actLines: number;          // 이 막에서 내가 한 말 수
  techniques: TechId[];
  facts: string[];
  replayFrom: number;        // 테이크 2가 시작되는 비트 index (-1 = 없음)
  fromArchetypeId?: string;
};

export const ACT_ORDER: ActId[] = ["enter", "card", "build", "inside", "meet", "mirror", "replay", "curtain"];

export const actMeta = (id: ActId) => INNER.acts.find((a) => a.id === id)!;

const vars = (s: InnerState) => ({ alias: s.alias, other: s.other?.name ?? "그 사람" });

export const say = (who: Beat["who"], text: string, extra: Partial<Beat> = {}): Beat => ({ id: uid("b"), who, text, ...extra });

export function actOpening(s: InnerState, act: ActId): Beat[] {
  const line = fillJosa(actMeta(act).line, vars(s));
  if (act === "mirror") return [say("director", line), say("director", mirrorText(s), { tech: "mirror" })];
  if (act === "replay") return [say("director", line, { tech: "retake" })];
  return [say("director", line)];
}

/** 무거워지는 말이면 속도를 늦춘다 */
export const isHeavy = (text: string) => INNER.slow.words.some((w) => text.includes(w));

export type DirectorOut = { beats: Beat[]; propose?: boolean; slow?: boolean };

/** 내가 한 줄 → 진행자(와 상대)의 다음 비트 */
export function directorReply(s: InnerState, text: string): DirectorOut {
  // 짧은 말은 통째로 돌려준다 — 「채로」 같은 조각보다 네 문장 그대로가 낫다
  const said = text.trim().replace(/[.!?。…]+$/, "");
  const w = said.length <= 18 ? said : pickWord(text);
  const seed = hash(text) + s.beats.length;
  const out: Beat[] = [];
  const v = { ...vars(s), w };

  if (isHeavy(text)) {
    return { beats: [say("director", fillJosa(INNER.slow.line, v))], slow: true };
  }

  switch (s.mode) {
    case "chair":
      out.push(say("director", INNER.afterChair));
      break;
    case "soliloquy":
      out.push(say("director", "들었어. 상대한텐 안 들린 말이야. 장면은 그대로 서 있어."));
      break;
    case "reversal":
      // 내가 상대가 됐다 — 진행자는 상대 자리의 말을 🟡 새 사실 후보로 짚는다
      out.push(say("director", fillJosa("{other} 자리에서 나온 말이야. 「{w}」. 다른 말 더 있어?", v)));
      break;
    case "future":
      out.push(say("director", INNER.afterFuture));
      break;
    default:
      if (s.act === "meet" && s.other) {
        out.push(otherReply(s, text));
      } else if (s.act === "mirror") {
        out.push(say("director", fillJosa("고쳤어 — 「{w}」. 이제 네 말이 맞게 읽혀?", v)));
      } else if (s.act === "replay") {
        out.push(say("director", "그 말, 테이크 2로 남길게. 한 마디 더 해도 되고, 여기서 컷해도 돼."));
      } else {
        out.push(say("director", fillJosa(pick(INNER.echo, seed), v)));
      }
  }

  const propose = s.actLines + 1 >= 2 && ["inside", "meet", "mirror", "replay"].includes(s.act) && !s.mode;
  return { beats: out, propose };
}

/** 보조자아 — 상대 인물은 내 말의 한 단어를 받고, 거리만큼 물러서 있다 */
function otherReply(s: InnerState, text: string): Beat {
  const o = s.other!;
  const w = pickWord(text);
  const lines = [
    "{w}?",
    "…{w}. 그랬구나.",
    "나는 그런 뜻 아니었어.",
    "{w}라고 하면 내가 뭐라고 해.",
    "그때 {w} 얘기, 처음 듣는 것 같아.",
  ];
  const seed = hash(text) + s.beats.length;
  let line = fillJosa(pick(lines, seed), { w });
  if (o.habit && seed % 3 === 0) line += ` ${o.habit}.`;
  const dir = s.distance >= 3 ? "멀리 서서" : s.distance === 1 ? "바로 앞에서" : undefined;
  return say("other", line, { dir });
}

/** 💭 속말 — 「혹시 이런 말?」. 맞으면 가져가고 아니면 버린다 */
export function doubleOffer(s: InnerState): string {
  const mine = [...s.beats].reverse().find((b) => b.who === "me" && !b.asOther);
  const w = mine ? pickWord(mine.text) : s.object || "그거";
  return fillJosa(pick(INNER.doubleOffers, hash(w) + s.beats.length), { w });
}

/** 🪞 객석에서 보기 — 내 말로만, 3인칭으로 다시 읽는다. 해석을 붙이지 않는다 */
export function mirrorText(s: InnerState): string {
  const a = s.alias;
  const head = [
    `${josa(a, "는")} ${s.place || "그 자리"}에 있다.`,
    s.time ? `${s.time}.` : "",
    s.object ? `${josa(s.object, "가")} 보인다.` : "",
  ].filter(Boolean).join(" ");
  const body = s.beats
    .filter((b) => b.who === "me" || b.who === "other")
    .slice(-6)
    .map((b) => {
      if (b.who === "other") return `${josa(s.other?.name ?? "상대", "가")} 말한다 — 「${b.text}」`;
      if (b.asOther) return `${josa(a, "가")} ${s.other?.name ?? "상대"} 자리에서 말한다 — 「${b.text}」`;
      if (b.tech === "soliloquy") return `${josa(a, "가")} 속으로 말한다 — 「${b.text}」`;
      if (b.direction) return `${josa(a, "는")} ${b.text}`;
      return `${josa(a, "가")} 말한다 — 「${b.text}」`;
    });
  return [head, ...body].join("\n");
}

export function techniqueLine(s: InnerState, t: TechId): string {
  return fillJosa(INNER.techniques[t].line, vars(s));
}

/** 🏛 닮은 고전 — 해석 아님, 「닮았다」까지 */
export function similarClassic(texts: string[]): Archetype | null {
  const all = texts.join(" ");
  let best: { id: string; n: number } | null = null;
  for (const s of INNER.similar) {
    const n = s.words.filter((w) => all.includes(w)).length;
    if (n > 0 && (!best || n > best.n)) best = { id: s.archetypeId, n };
  }
  return best ? ARCHETYPES.find((a) => a.id === best!.id) ?? null : null;
}

export function classicBridgeLine(a: Archetype): string {
  return fillJosa(INNER.bridges.classic, { classic: a.classicTitle ?? a.typeName, type: a.typeName });
}

/**
 * 🎞 이 장면, 상황극으로 — 내 장면을 「남의 이야기」로.
 * 넘어가는 건 사용자가 쓴 뼈대 한 줄뿐. 실명 · 원래 문장 · 장소는 바꾼다.
 */
export function pieceToSituation(p: ScenePiece, bone: string): Archetype {
  const seed = hash(p.id);
  const meName = pick(INNER.replaceNames, seed);
  const otherName = pick(INNER.replaceNames.filter((n) => n !== meName), seed + 1);
  const sim = similarClassic([bone]);
  return {
    id: "custom-" + p.id,
    genre: sim?.genre ?? "youth",
    origin: "film",
    typeName: "내 장면에서 온 상황극",
    skeleton: bone,
    adaptTitle: bone.length > 18 ? bone.slice(0, 18) + "…" : bone,
    spice: "mild",
    minutes: 3,
    scene: {
      place: pick(INNER.replacePlaces, seed),
      time: "어느 오후",
      light: "멀리서 들리는 종소리",
      me: { name: meName, want: "이번엔 하고 싶은 말을 하기", hide: "전에도 비슷한 자리에 서 본 적 있다" },
      other: { name: otherName, want: "아무 일 없던 것처럼 지나가기", hide: "사실 마음에 걸려 있다" },
      fixed: [bone],
      open: [`${josa(meName, "가")} 뭐라고 하나`, `${josa(otherName, "가")} 어떻게 받나`],
    },
    task: { kind: sim?.task.kind ?? "confess", want: "그때와 다른 한 마디 해 보기", obstacle: `${josa(otherName, "는")} 그냥 지나가려 한다`, timer: 180 },
    opener: { line: "…왜? 할 말 있어?", dir: "걸음을 멈추며" },
    pool: ["{w}? 그게 무슨 말이야.", "…{w}. 그랬구나.", "{w}라니, 처음 듣는데.", "그래서 {w} 때문에 그런 거야?", "{w}. 알았어, 더 말해 봐."],
    facts: [`${josa(otherName, "도")} 그날 일을 기억하고 있다`],
    twists: ["종이 울린다", "누가 이름을 부른다", "바람에 문이 닫힌다"],
    pivot: `${josa(otherName, "가")} 돌아본다. 너였다면?`,
    reveal: { gloss: "이 상황극은 네 장면에서 왔어. 원작은 없어 — 네가 쓴 게 원작이야.", after: "거리를 두고 보니 어땠어? 같은 뼈대, 다른 사람." },
    custom: { fromPieceId: p.id },
  };
}
