"use client";

/**
 * 사용자 기록 — 전부 이 기기의 localStorage에만. 실명 저장 없음, 서버로 안 보냄.
 *
 *   mindscene.v1.profile     시기 · 반 · 다 보기
 *   mindscene.v1.pieces      🧩 씬 조각 (테이크 포함)
 *   mindscene.v1.works       📖 작품
 *   mindscene.v1.revisions   ✏️ 고친 기록 — 덮어쓰지 않는다
 *   mindscene.v1.marks       🔍 나 노트 표시 (맞아 · 아닌데 · 잘 모르겠어 + 덧붙임)
 *   mindscene.v1.custom      🎞 내 장면을 상황극으로 옮긴 카드
 *   mindscene.v1.innerDraft  🪞 내 무대 진행 중인 판 — 새로고침해도 이어서 (커튼콜 끝나면 지운다)
 *
 * 내보내기/가져오기는 이 키들을 한 JSON 파일로 묶는다.
 */
import { useEffect, useState } from "react";
import { ARCHETYPES } from "./data";
import type {
  Archetype, InsightMark, Profile, Revision, RevisionField, ScenePiece, Take, Work,
} from "./types";

const NS = "mindscene.v1.";
const K = {
  profile: NS + "profile",
  pieces: NS + "pieces",
  works: NS + "works",
  revisions: NS + "revisions",
  marks: NS + "marks",
  custom: NS + "custom",
  innerDraft: NS + "innerDraft",
} as const;
const CHANGE = "mindscene:change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;   // 프라이빗 모드 · 깨진 값
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* 용량 초과 · 프라이빗 모드 */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE));
}

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
export const now = () => new Date().toISOString();

/** 저장소가 바뀌면 다시 읽는 훅 — 다른 탭에서 바뀌어도 따라온다 */
export function useStore<T>(reader: () => T, fallback: T): [T, boolean] {
  const [v, setV] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => { setV(reader()); setReady(true); };
    load();
    window.addEventListener(CHANGE, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(CHANGE, load);
      window.removeEventListener("storage", load);
    };
    // reader는 매 렌더 새로 만들어지지만 읽는 대상은 같다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [v, ready];
}

/* ── 프로필 ─────────────────────────────────────────── */
const DEFAULT_PROFILE: Profile = { grade: "m2", cls: "chick", showAll: false };
export const loadProfile = () => ({ ...DEFAULT_PROFILE, ...read<Partial<Profile>>(K.profile, {}) });
export const saveProfile = (p: Partial<Profile>) => write(K.profile, { ...loadProfile(), ...p });

/* ── 🎞 커스텀 상황극 카드 ──────────────────────────── */
export const loadCustom = () => read<Archetype[]>(K.custom, []);
export function saveCustom(a: Archetype) {
  write(K.custom, [a, ...loadCustom().filter((x) => x.id !== a.id)]);
}
export const getArchetype = (id: string): Archetype | undefined =>
  ARCHETYPES.find((a) => a.id === id) ?? loadCustom().find((a) => a.id === id);

/* ── 🧩 씬 조각 ─────────────────────────────────────── */
export const loadPieces = () => read<ScenePiece[]>(K.pieces, []);
export const getPiece = (id: string) => loadPieces().find((p) => p.id === id);

export function savePiece(p: ScenePiece) {
  const all = loadPieces().filter((x) => x.id !== p.id);
  write(K.pieces, [{ ...p, updatedAt: now() }, ...all]);
}

/** 테이크는 지우지 않는다 — 새 번호로 붙인다 */
export function appendTake(pieceId: string, take: Omit<Take, "n">, reason?: string) {
  const p = getPiece(pieceId);
  if (!p) return;
  const n = (p.takes.at(-1)?.n ?? 0) + 1;
  savePiece({ ...p, takes: [...p.takes, { ...take, n, reason }] });
  logRevision({
    target: { pieceId, field: "take", label: `${p.title} · 테이크 ${n}` },
    before: p.takes.at(-1)?.lastCut.line ?? "",
    after: take.lastCut.line,
    reason: reason ? { chip: reason } : undefined,
  });
}

/** 정말 지울 때만 — 되살리기 없음. 고친 기록도 같이, 작품에서도 빠진다 */
export function deletePiece(id: string) {
  write(K.pieces, loadPieces().filter((p) => p.id !== id));
  write(K.revisions, loadRevisions().filter((r) => r.target.pieceId !== id));
  write(K.works, loadWorks().map((w) => ({ ...w, slots: w.slots.filter((s) => s.pieceId !== id) })));
}

/* ── 📖 작품 ───────────────────────────────────────── */
export const loadWorks = () => read<Work[]>(K.works, []);
export const getWork = (id: string) => loadWorks().find((w) => w.id === id);
export function saveWork(w: Work) {
  write(K.works, [{ ...w, updatedAt: now() }, ...loadWorks().filter((x) => x.id !== w.id)]);
}
export function deleteWork(id: string) {
  write(K.works, loadWorks().filter((w) => w.id !== id));
  write(K.revisions, loadRevisions().filter((r) => r.target.workId !== id));
}

/* ── ✏️ 고친 기록 ──────────────────────────────────── */
export const loadRevisions = () => read<Revision[]>(K.revisions, []);

export function logRevision(r: Omit<Revision, "id" | "at">): Revision | null {
  if (r.before === r.after && r.target.field !== "slotAdd" && r.target.field !== "slotRemove") return null;
  const rev: Revision = { ...r, id: uid("r"), at: now() };
  write(K.revisions, [...loadRevisions(), rev]);
  return rev;
}

/** 「왜 고쳤어?」는 나중에 붙여도 된다 */
export function setRevisionReason(id: string, reason: Revision["reason"]) {
  write(K.revisions, loadRevisions().map((r) => (r.id === id ? { ...r, reason } : r)));
}

export const revisionsFor = (q: { pieceId?: string; workId?: string }) =>
  loadRevisions().filter((r) =>
    (q.pieceId && r.target.pieceId === q.pieceId) || (q.workId && r.target.workId === q.workId));

/** 씬 조각 안의 내 대사 한 줄 고치기 — 테이크의 그 비트만 바꾸고 전/후를 남긴다 */
export function editLine(pieceId: string, takeN: number, beatId: string, text: string, chip?: string) {
  const p = getPiece(pieceId);
  if (!p) return null;
  let before = "";
  const takes = p.takes.map((t) => t.n !== takeN ? t : {
    ...t,
    beats: t.beats.map((b) => {
      if (b.id !== beatId) return b;
      before = b.text;
      return { ...b, text };
    }),
  });
  savePiece({ ...p, takes });
  return logRevision({
    target: { pieceId, field: "line", label: `${p.title} · 테이크 ${takeN} · 대사` },
    before, after: text, reason: chip ? { chip } : undefined,
  });
}

export function editLastCut(pieceId: string, takeN: number, field: "line" | "direction", text: string, chip?: string) {
  const p = getPiece(pieceId);
  if (!p) return null;
  const t = p.takes.find((x) => x.n === takeN);
  if (!t) return null;
  const before = t.lastCut[field];
  savePiece({ ...p, takes: p.takes.map((x) => (x.n === takeN ? { ...x, lastCut: { ...x.lastCut, [field]: text } } : x)) });
  return logRevision({
    target: { pieceId, field: "lastCut", label: `${p.title} · 테이크 ${takeN} · 마지막 컷${field === "direction" ? " 지문" : ""}` },
    before, after: text, reason: chip ? { chip } : undefined,
  });
}

/** 작품 고치기 — 바뀐 자리를 기록으로 남기고 저장 */
export function updateWork(w: Work, field: RevisionField, label: string, before: string, after: string) {
  saveWork(w);
  return logRevision({ target: { workId: w.id, field, label }, before, after });
}

/* ── 🪞 내 무대 이어 하기 ──────────────────────────── */
/** 모양은 내 무대 화면이 정한다 — 여기선 그냥 담아 둔다 */
export const loadInnerDraft = <T,>() => read<T | null>(K.innerDraft, null);
export function saveInnerDraft(d: unknown) {
  try { localStorage.setItem(K.innerDraft, JSON.stringify(d)); } catch { /* noop */ }
}
export function clearInnerDraft() {
  try { localStorage.removeItem(K.innerDraft); } catch { /* noop */ }
}

/** 🧪 동작 시나리오로 만든 씬만 지운다 */
export function wipeDemoPieces(): number {
  const demo = loadPieces().filter((p) => p.demo);
  demo.forEach((p) => deletePiece(p.id));
  return demo.length;
}

/* ── 🔍 나 노트 표시 ───────────────────────────────── */
export const loadMarks = () => read<Record<string, InsightMark>>(K.marks, {});
export function setMark(key: string, mark: InsightMark["mark"], note?: string) {
  const all = loadMarks();
  write(K.marks, { ...all, [key]: { mark, note: note ?? all[key]?.note, at: now() } });
}

/* ── 내 기록 JSON 파일 ─────────────────────────────── */
export type Backup = {
  app: "mindscene";
  version: 1;
  exportedAt: string;
  profile: Profile;
  pieces: ScenePiece[];
  works: Work[];
  revisions: Revision[];
  marks: Record<string, InsightMark>;
  custom: Archetype[];
};

export function exportBackup(): Backup {
  return {
    app: "mindscene", version: 1, exportedAt: now(),
    profile: loadProfile(), pieces: loadPieces(), works: loadWorks(),
    revisions: loadRevisions(), marks: loadMarks(), custom: loadCustom(),
  };
}

/** 가져오기 — 같은 id는 파일 쪽으로, 없는 건 더한다 (지금 기록을 지우지 않음) */
export function importBackup(json: string): { ok: true; counts: Record<string, number> } | { ok: false; error: string } {
  let b: Backup;
  try { b = JSON.parse(json) as Backup; } catch { return { ok: false, error: "JSON 파일이 아니야." }; }
  if (b?.app !== "mindscene" || b.version !== 1) return { ok: false, error: "마음씬 기록 파일이 아니야." };
  const merge = <T extends { id: string }>(cur: T[], inc: T[] = []) =>
    [...inc, ...cur.filter((c) => !inc.some((i) => i.id === c.id))];
  write(K.pieces, merge(loadPieces(), b.pieces));
  write(K.works, merge(loadWorks(), b.works));
  write(K.revisions, merge(loadRevisions(), b.revisions));
  write(K.custom, merge(loadCustom(), b.custom));
  write(K.marks, { ...loadMarks(), ...(b.marks ?? {}) });
  if (b.profile) write(K.profile, { ...loadProfile(), ...b.profile });
  return { ok: true, counts: { pieces: b.pieces?.length ?? 0, works: b.works?.length ?? 0, revisions: b.revisions?.length ?? 0 } };
}

/** 통째로 바꾸기 — 🧪 동작 시나리오가 단계를 채우거나, 끝내고 원래 기록을 되돌릴 때만 */
export function replaceAll(b: Pick<Backup, "pieces" | "works" | "revisions" | "marks"> & Partial<Pick<Backup, "custom" | "profile">>) {
  write(K.pieces, b.pieces);
  write(K.works, b.works);
  write(K.revisions, b.revisions);
  write(K.marks, b.marks);
  if (b.custom) write(K.custom, b.custom);
  if (b.profile) write(K.profile, b.profile);
}

/** 모두 지우기 — 되살리기 없음 */
export function wipeAll() {
  try { Object.values(K).forEach((k) => localStorage.removeItem(k)); } catch { /* noop */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE));
}
