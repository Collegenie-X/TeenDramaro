/**
 * 🧭 상황극 가이드 — 지금 판의 흐름을 보고 「한 줄 안내 + 칩 몇 개」를 고른다.
 * 문구는 전부 data/situation-guide.json. 여기는 「지금 어느 자리인가」만 정한다.
 *
 *   open   아직 내가 한 마디도 안 했을 때
 *   stuck  내가 「무슨 상황이야?」처럼 헷갈려할 때
 *   fact   🟡 새 사실이 막 나왔을 때
 *   soft   상대가 웃거나 풀렸을 때
 *   hurry  ⏱ 30초 남았을 때
 *   pivot  🌟 결정적 자리에 왔을 때
 *   crowd  👀 지켜보던 사람이 막 반응했을 때 — 시선을 써먹어도 된다
 *   late   긴 판의 후반 — 숨긴 걸 건드려 볼 때
 *   mid    그 밖에
 *
 * 추천(⭐)은 언제나 하나 — 맨 앞에 둔다.
 *
 * ⭐ 추천 길(path) — 추천만 계속 고르면 한 편이 대본처럼 완성된다.
 *   내 말이 지금까지 path.steps와 그대로면, 다음 칸(steps[i].me)이 추천이 되고
 *   상대 대답도 steps[i].reply로 정해진다. 한 번이라도 벗어나면 평소처럼 애드립.
 */
import raw from "@/data/situation-guide.json";
import { moodOf } from "@/components/CastArt";
import { callName, turnsOf } from "./improv";
import type { Archetype, Beat } from "./types";

export type GuideStage = "open" | "mid" | "late" | "fact" | "stuck" | "soft" | "crowd" | "pivot" | "hurry";
export type GuideAction = "task" | "pivot" | "cut";
export type GuideChip = { t: string; dir?: boolean; rec?: boolean; action?: GuideAction };
export type PathStep = { me: string; dir?: boolean; reply?: { t: string; by?: string; dir?: string } };
export type GuidePath = { steps: PathStep[]; pivot: string; lastCut: { line: string; direction: string } };

type GuideData = {
  title: string; recLabel: string; hide: string; show: string;
  stuckWords: string[];
  stages: Record<GuideStage, { hint: string }> & { crowdInner: { hint: string } };
  common: Record<GuideStage, GuideChip[]>;
  archetypes: Record<string, Partial<Record<GuideStage, GuideChip[]>> & { path?: GuidePath }>;
};
export const GUIDE = raw as unknown as GuideData;

export const pathOf = (a: Archetype): GuidePath | undefined => GUIDE.archetypes[a.id]?.path;

/** 지금까지 내 말이 추천 길 그대로면 다음 칸 번호, 한 번이라도 벗어났으면 -1 */
export function pathIndex(a: Archetype, beats: Beat[]): number {
  const p = pathOf(a);
  if (!p) return -1;
  const mine = beats.filter((b) => b.who === "me");
  return mine.every((b, i) => p.steps[i]?.me === b.text && !!p.steps[i].dir === !!b.direction) ? mine.length : -1;
}

const MAX_CHIPS = 5;

export function stageOf(a: Archetype, beats: Beat[], o: { atPivot: boolean; left: number }): GuideStage {
  if (o.atPivot) return "pivot";
  if (a.task.timer && o.left > 0 && o.left <= 30 && beats.length > 1) return "hurry";
  const lastMe = [...beats].reverse().find((b) => b.who === "me");
  if (!lastMe) return "open";
  // 헷갈려했어도 🎯 과제를 다시 봤으면 다음 걸음으로
  const sawTask = beats.slice(beats.indexOf(lastMe)).some((b) => b.who === "system" && b.text.startsWith("🎯"));
  if (!sawTask && GUIDE.stuckWords.some((w) => lastMe.text.includes(w))) return "stuck";
  const after = beats.slice(beats.indexOf(lastMe) + 1);
  if (after.some((b) => b.fact)) return "fact";
  if (after.some((b) => b.who === "watch")) return "crowd";
  const lastOther = [...beats].reverse().find((b) => b.who === "other");
  if (lastOther && moodOf(lastOther.dir) === "soft" && beats.indexOf(lastOther) > beats.indexOf(lastMe)) return "soft";
  const said = beats.filter((b) => b.who === "me").length;
  return turnsOf(a) >= 8 && said >= Math.ceil(turnsOf(a) * 0.6) ? "late" : "mid";
}

export function buildGuide(a: Archetype, beats: Beat[], o: { atPivot: boolean; left: number }) {
  const stage = stageOf(a, beats, o);
  const facts = beats.filter((b) => b.fact);
  const watcherName = [...beats].reverse().find((b) => b.who === "watch")?.by;
  const w = a.scene.watchers?.find((x) => x.name === watcherName);
  // 🔊 속마음이면 「아빠 속마음」 → 「아빠」, 아니면 부르는 이름
  const watcher = w?.voice === "inner" ? w.name.replace(/\s*속마음$/, "") : watcherName;
  const fill = (s: string) => s
    .replaceAll("{want}", a.task.want)
    .replaceAll("{me}", a.scene.me.name)
    .replaceAll("{other}", a.scene.other.name)
    .replaceAll("{fact}", facts.at(-1)?.text ?? "")
    .replaceAll("{soft}", a.scene.other.persona?.soft ?? "")
    .replaceAll("{watcher}", w?.voice === "inner" ? watcher! : callName(watcher ?? a.scene.other.name));

  const mine = new Set(beats.filter((b) => b.who === "me").map((b) => b.text.trim()));
  const own = GUIDE.archetypes[a.id]?.[stage] ?? (stage === "soft" || stage === "hurry" || stage === "late" ? GUIDE.archetypes[a.id]?.mid : undefined) ?? [];
  const body: GuideChip[] = (stage === "open" || stage === "mid" || stage === "late") && a.task.body ? [{ t: a.task.body, dir: true }] : [];

  const seen = new Set<string>();
  let chips: GuideChip[] = [...own, ...GUIDE.common[stage], ...body]
    .map((c) => ({ ...c, t: fill(c.t) }))
    .filter((c) => (c.action || !mine.has(c.t)) && !seen.has(c.t) && !!seen.add(c.t));

  // 이 자리 칩을 다 썼으면 중간 칩으로 이어 간다 — 추천이 비지 않게
  if (chips.filter((c) => !c.dir).length < 2 && stage !== "pivot") {
    const more = [...(GUIDE.archetypes[a.id]?.mid ?? []), ...GUIDE.common.mid]
      .map((c) => ({ ...c, t: fill(c.t), rec: false }))
      .filter((c) => !mine.has(c.t) && !seen.has(c.t) && !!seen.add(c.t));
    chips = [...chips, ...more];
  }

  // ⭐ 추천 길 위에 있으면 — 다음 칸이 추천
  const pi = pathIndex(a, beats);
  const step = pi >= 0 ? pathOf(a)?.steps[pi] : undefined;
  if (step && stage !== "pivot") {
    // 추천과 거의 같은 칩(앞 여섯 글자가 같으면)은 빼서 두 번 보이지 않게
    const head = (t: string) => t.replace(/\s/g, "").slice(0, 6);
    chips = [{ t: step.me, dir: step.dir, rec: true }, ...chips.filter((c) => head(c.t) !== head(step.me)).map((c) => ({ ...c, rec: false }))];
  }

  // ⭐ 추천은 하나 — 첫 rec, 없으면 첫 말 칩. 맨 앞으로
  const firstRec = chips.findIndex((c) => c.rec);
  const recIdx = firstRec >= 0 ? firstRec : Math.max(0, chips.findIndex((c) => !c.dir));
  chips = chips.map((c, i) => ({ ...c, rec: i === recIdx }));
  chips = [chips[recIdx], ...chips.filter((_, i) => i !== recIdx)].filter(Boolean).slice(0, MAX_CHIPS);

  const hint = stage === "crowd" && w?.voice === "inner" ? GUIDE.stages.crowdInner.hint : GUIDE.stages[stage].hint;
  return { stage, hint: fill(hint), chips };
}
