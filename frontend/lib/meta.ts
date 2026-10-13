/**
 * 라벨·칩·틀 — 내용은 data/meta.json, 여기는 타입만 입힌다.
 * 문구를 바꿀 땐 JSON만 고치면 된다.
 */
import raw from "@/data/meta.json";
import type { Archetype, Class, Dials, Frame, Genre, Grade, Spice, TaskKind, WorkRef } from "./types";

type GenreMeta = { id: Genre; icon: string; label: string; lower?: boolean };
type FrameMeta = { icon: string; label: string; shape: string; slots: string[]; cls?: Class };

export const GENRES = raw.genres as GenreMeta[];
export const genreOf = (g: Genre) => GENRES.find((x) => x.id === g)!;

export const TASKS = raw.tasks as Record<TaskKind, { icon: string; label: string; acting: string }>;
export const SPICE = raw.spice as Record<Spice, { icon: string; label: string }>;
export const CLASSES = raw.classes as Record<Class, { icon: string; label: string }>;
export const GRADES = raw.grades as { id: Grade; label: string; cls: Class }[];

export const DIALS = raw.dials as { key: keyof Dials; icon: string; label: string; low: string; high: string }[];
export const DEFAULT_DIALS = raw.defaultDials as Dials;

export const FRAMES = raw.frames as Record<Frame, FrameMeta>;

/** 🌟 나였다면? 결 칩 */
export const PIVOT_TONES = raw.pivotTones;
/** ✏️ 「왜 고쳤어?」 칩 — §16 */
export const REASONS = raw.reasons as Record<"take" | "line" | "lastCut" | "work", string[]>;
/** 30초 비면 뜨는 칩 */
export const IDLE_CHIPS = raw.idleChips;
/** 나 노트에 섞이면 그 줄을 버리는 말 — 성격·진단·처방 */
export const BANNED_INSIGHT_WORDS = raw.bannedInsightWords;

export const ICON_TRACK = { situation: "🎞", inner: "🪞" } as const;

/** 📺 원작 종류 — 드라마 · 영화 · 애니 · 만화 · 소설 */
export const WORK_KINDS = raw.workKinds as Record<WorkRef["kind"], { icon: string; label: string }>;
/** 원작 한 줄 — 카드 · 상단바가 같이 쓴다 */
export function originLabel(a: Archetype): string {
  if (a.custom) return "🪞 내 장면";
  if (a.work) return `${WORK_KINDS[a.work.kind].icon} ${a.work.title}`;
  if (a.origin === "classic") return `🏛 ${a.classicTitle}`;
  return "🎬 영화 유형";
}

/** 💬 판 길이 — 결정적 자리까지 내 말 수로 */
export type LengthId = "short" | "mid" | "long" | "epic";
export const LENGTHS = raw.lengths as { id: LengthId; max: number; icon: string; label: string }[];
export const lengthOf = (turns: number) => LENGTHS.find((l) => turns <= l.max) ?? LENGTHS[LENGTHS.length - 1];
