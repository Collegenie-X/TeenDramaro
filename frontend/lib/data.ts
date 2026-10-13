/**
 * 콘텐츠는 전부 data/*.json — 여기서 타입을 입혀 내보낸다.
 * 사용자 기록은 lib/store.ts (localStorage).
 */
import archetypesRaw from "@/data/archetypes.json";
import innerRaw from "@/data/inner.json";
import type { Archetype, Genre, Spice, TechId } from "./types";

export const ARCHETYPES = archetypesRaw as Archetype[];

export type InnerCard = { id: string; icon: string; name: string; clue: string; place: string; object: string };
/** 클릭으로 고르는 옵션 — key는 삽화(components/InnerArt)의 아이콘 이름 */
export type InnerOpt = { key: string; label: string };
export type SayOpt = { t: string; dir?: boolean };
export type InnerOptions = {
  alias: string[];
  places: InnerOpt[];
  times: InnerOpt[];
  objects: InnerOpt[];
  others: { name: string; tag: string }[];
  otherLines: string[];
  say: Record<"inside" | "meet" | "mirror" | "replay" | "soliloquy" | "chair" | "reversal" | "future", SayOpt[]>;
  tomorrow: string[];
};
export type ActId = "enter" | "card" | "build" | "inside" | "meet" | "mirror" | "replay" | "curtain";
export type StageId = "warmup" | "action" | "sharing";
export type Technique = { icon: string; name: string; doc: string; line: string; when: string };

export const INNER = innerRaw as unknown as {
  cards: InnerCard[];
  acts: { id: ActId; stage: StageId; label: string; line: string }[];
  stages: Record<StageId, string>;
  techniques: Record<TechId, Technique>;
  chipOrder: TechId[];
  doubleOffers: string[];
  echo: string[];
  slow: { line: string; words: string[] };
  propose: string;
  stop: string;
  afterChair: string;
  afterReversal: string;
  afterFuture: string;
  bridges: { fromSituation: string; toSituation: string; classic: string };
  similar: { archetypeId: string; words: string[] }[];
  replaceNames: string[];
  replacePlaces: string[];
  options: InnerOptions;
  promise: { do: string[]; note: string };
  rail: { name: string; sub: string }[];
};

const SPICE_ORDER: Spice[] = ["mild", "warm", "hot"];

/** 서랍 순서 — 위 칸이 🥛 순한 번안, 진한 번안은 아래쪽 */
export function archetypesByGenre(genre: Genre | null, showAll: boolean): Archetype[] {
  return ARCHETYPES
    .filter((a) => (genre ? a.genre === genre : true))
    .filter((a) => showAll || a.spice === "mild")
    // 맛 순서 먼저, 같은 맛 안에선 📺 유명한 원작이 있는 장면부터
    .sort((a, b) => SPICE_ORDER.indexOf(a.spice) - SPICE_ORDER.indexOf(b.spice) || Number(!!b.work) - Number(!!a.work));
}

/** 오늘의 상황극 — 🥛 카드 중 날짜로 한 장 */
export function todaysArchetype(date = new Date()): Archetype {
  const mild = ARCHETYPES.filter((a) => a.spice === "mild");
  const day = Math.floor(date.getTime() / 86_400_000);
  return mild[day % mild.length];
}

/** {alias} {other} {w} 같은 자리 채우기 */
export function fill(tpl: string, vars: Record<string, string | undefined>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length];
