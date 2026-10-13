/**
 * 🧪 내 무대 동작 시나리오 — data/inner-scenarios.json 을 읽어 걸음마다 화면 상태를 확인한다.
 * 걸음(step)은 사람이 누르는 클릭 하나와 같다. 내 무대 화면이 실제 버튼과 같은 함수로 실행하고,
 * 여기서는 실행 뒤의 화면 상태(Snap)가 check 와 맞는지만 본다.
 */
import raw from "@/data/inner-scenarios.json";
import type { InnerState } from "./inner";
import type { ScenePiece, TechId, Who } from "./types";

export type ScenarioStep =
  | { do: "enter"; avatar: boolean; alias: string; distance: number; label: string; check?: Check }
  | { do: "card"; id?: string; label: string; check?: Check }
  | { do: "build"; place: string; time: string; object: string; label: string; check?: Check }
  | { do: "say"; text: string; direction?: boolean; typed?: boolean; label: string; check?: Check }
  | { do: "tech"; id: TechId; label: string; check?: Check }
  | { do: "offer"; keep: boolean; label: string; check?: Check }
  | { do: "meet"; name: string; line: string; label: string; check?: Check }
  | { do: "end" | "next" | "stop" | "curtain" | "toAvatar" | "far"; label: string; check?: Check }
  | { do: "finish"; title: string; pick: string[]; tomorrow: string; label: string; check?: Check };

export type Check = {
  phase?: string;
  act?: string;
  mode?: string | null;
  avatar?: boolean;
  distance?: number;
  cardId?: string | null;
  hasOther?: boolean;
  lastWho?: Who;
  lastTech?: TechId;
  lastDir?: string;
  minFacts?: number;
  mine?: number;
  heavyChips?: boolean;
  offer?: boolean;
  saved?: boolean;
  takes?: number;
};

export type Scenario = { id: string; icon: string; title: string; sub: string; covers: string[]; steps: ScenarioStep[] };

export const SCENARIOS = (raw as unknown as { scenarios: Scenario[] }).scenarios;
export const SCENARIO_ABOUT = (raw as { about: string }).about;
export const getScenario = (id?: string) => SCENARIOS.find((s) => s.id === id);

/** 걸음 뒤의 화면 상태 */
export type Snap = { phase: string; s: InnerState; offer: boolean; heavy: boolean; saved: ScenePiece | null };

/** 맞지 않는 항목들을 사람 말로 돌려준다 — 빈 배열이면 통과 */
export function verify(check: Check | undefined, snap: Snap): string[] {
  if (!check) return [];
  const { s } = snap;
  const last = s.beats.at(-1);
  const got: Record<keyof Check, unknown> = {
    phase: snap.phase,
    act: s.act,
    mode: s.mode,
    avatar: s.avatar,
    distance: s.distance,
    cardId: s.cardId ?? null,
    hasOther: !!s.other,
    lastWho: last?.who,
    lastTech: last?.tech,
    lastDir: last?.dir,
    minFacts: s.facts.length,
    mine: s.beats.filter((b) => b.who === "me").length,
    heavyChips: snap.heavy,
    offer: snap.offer,
    saved: !!snap.saved,
    takes: snap.saved?.takes.length,
  };
  const fails: string[] = [];
  (Object.keys(check) as (keyof Check)[]).forEach((k) => {
    const want = check[k];
    const have = got[k];
    const ok = k === "minFacts" ? (have as number) >= (want as number) : have === want;
    if (!ok) fails.push(`${k}: 기대 ${fmt(want)} · 실제 ${fmt(have)}`);
  });
  return fails;
}

const fmt = (v: unknown) => (v === undefined ? "없음" : v === null ? "null" : JSON.stringify(v));

/** 확인 항목을 짧게 — 패널에 「기대」로 보여 준다 */
export function describe(check?: Check): string {
  if (!check) return "";
  return Object.entries(check).map(([k, v]) => `${k}=${fmt(v)}`).join(" · ");
}
