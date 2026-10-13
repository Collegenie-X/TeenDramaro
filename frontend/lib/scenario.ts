"use client";

/**
 * 🧪 동작 시나리오 — data/scenario.json 의 단계를 localStorage에 채워 UI를 따라가며 확인한다.
 *
 *   mindscene.demo.state   지금 단계 · 단계별 체크한 것
 *   mindscene.demo.real    시나리오에 들어오기 전 내 기록 (끝내면 그대로 되돌림)
 *
 * 두 키는 mindscene.v1.* 밖에 있어서 💾 내보내기 파일에 섞이지 않는다.
 */
import raw from "@/data/scenario.json";
import { buildInsights } from "./insight";
import { exportBackup, now, replaceAll, type Backup } from "./store";
import type { InsightMark, Revision, ScenePiece, Work } from "./types";

export type ScenarioCheck = { id: string; text: string; href?: string };
export type ScenarioStep = {
  id: string;
  day: string;
  name: string;
  body: string;
  pieces: { id: string; takes: number }[];
  works: string[];
  revisions: string[];
  marks: { prefix: string; mark: InsightMark["mark"]; note?: string; at: string }[];
  checks: ScenarioCheck[];
};
type Scenario = {
  id: string; title: string; lead: string; keep: string;
  steps: ScenarioStep[]; pieces: ScenePiece[]; works: Work[]; revisions: Revision[];
};

export const SCENARIO = raw as unknown as Scenario;

const STATE = "mindscene.demo.state";
const REAL = "mindscene.demo.real";
const CHANGE = "mindscene:change";

export type DemoState = { step: string; checked: Record<string, string[]> };

function get<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch { return null; }
}
function set(key: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch { /* 프라이빗 모드 */ }
  window.dispatchEvent(new Event(CHANGE));
}

export const loadDemo = () => get<DemoState>(STATE);
export const stepIndex = (id?: string) => SCENARIO.steps.findIndex((s) => s.id === id);

/** 「-13d 16:20」 → 오늘에서 13일 전 16:20 */
function rel(s: string): string {
  const m = /^(-?\d+)d(?: (\d{1,2}):(\d{2}))?$/.exec(s);
  if (!m) return s;
  const d = new Date();
  d.setDate(d.getDate() + Number(m[1]));
  if (m[2]) d.setHours(Number(m[2]), Number(m[3]), 0, 0);
  return d.toISOString();
}
const TIME_KEYS = new Set(["createdAt", "updatedAt", "at"]);
function dated<T>(v: T): T {
  if (Array.isArray(v)) return v.map(dated) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) =>
      [k, TIME_KEYS.has(k) && typeof x === "string" ? rel(x) : dated(x)])) as T;
  }
  return v;
}

/** 한 단계에 있어야 할 기록 — 씬은 그 단계까지 찍은 테이크만 */
export function buildStep(step: ScenarioStep) {
  const pieces = step.pieces.map(({ id, takes }) => {
    const p = dated(SCENARIO.pieces.find((x) => x.id === id)!);
    const ts = p.takes.slice(0, takes);
    return { ...p, takes: ts, updatedAt: takes < p.takes.length ? ts.at(-1)!.createdAt : p.updatedAt };
  });
  const works = step.works.map((id) => dated(SCENARIO.works.find((w) => w.id === id)!));
  const revisions = step.revisions.map((id) => dated(SCENARIO.revisions.find((r) => r.id === id)!));
  // 「보이는 것」 키는 씬이 바뀌면 같이 바뀐다 — 그 단계에서 실제로 뜨는 줄의 키에 표시를 단다
  const marks: Record<string, InsightMark> = {};
  if (step.marks.length) {
    const keys = buildInsights(pieces, revisions, works).map((i) => i.key);
    for (const m of step.marks) {
      const key = keys.find((k) => k.startsWith(m.prefix));
      if (key) marks[key] = { mark: m.mark, note: m.note, at: rel(m.at) };
    }
  }
  return { pieces, works, revisions, marks };
}

/** 단계로 가기 — 처음 들어올 때만 내 기록을 따로 챙긴다 */
export function goStep(id: string) {
  const step = SCENARIO.steps.find((s) => s.id === id);
  if (!step) return;
  const cur = loadDemo();
  if (!cur) set(REAL, exportBackup());
  replaceAll(buildStep(step));
  set(STATE, { step: id, checked: cur?.checked ?? {} } satisfies DemoState);
}

export function toggleCheck(stepId: string, checkId: string) {
  const cur = loadDemo();
  if (!cur) return;
  const list = cur.checked[stepId] ?? [];
  const next = list.includes(checkId) ? list.filter((x) => x !== checkId) : [...list, checkId];
  set(STATE, { ...cur, checked: { ...cur.checked, [stepId]: next } });
}

/** 끝내기 — 챙겨 둔 내 기록을 그대로 되돌린다 */
export function endDemo() {
  const real = get<Backup>(REAL);
  replaceAll(real ?? { pieces: [], works: [], revisions: [], marks: {}, custom: [] });
  set(REAL, null);
  set(STATE, null);
}

/** 지금 단계를 💾 가져오기와 같은 모양의 JSON으로 */
export function stepBackup(step: ScenarioStep): Backup {
  const { profile, custom } = exportBackup();
  return { app: "mindscene", version: 1, exportedAt: now(), profile, custom, ...buildStep(step) };
}
