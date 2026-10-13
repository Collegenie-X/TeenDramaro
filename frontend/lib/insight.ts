/**
 * 🔍 나 노트 — 근거는 딱 둘: 내가 쓴 말, 내가 고친 자리. (§18)
 * AI가 짐작한 마음은 쓰지 않는다. 근거 없는 줄 · 성격/진단/처방 말이 섞인 줄은 버린다.
 */
import { BANNED_INSIGHT_WORDS, TASKS } from "./meta";
import type { Insight, Revision, ScenePiece, TaskKind, Work } from "./types";

/** 나 노트가 처음 열리는 기준 — 씬 3개 (§23 남은 것 4: 「아닌데」 비율로 조정) */
export const NOTE_MIN_PIECES = 3;

const q = (s: string) => `「${s.length > 24 ? s.slice(0, 24) + "…" : s}」`;
const latest = (p: ScenePiece) => p.takes.at(-1);

export function buildInsights(pieces: ScenePiece[], revisions: Revision[], works: Work[]): Insight[] {
  const out: Insight[] = [];

  // ① 마지막 컷이 질문으로 끝나는가
  const cuts = pieces
    .map((p) => ({ p, line: latest(p)?.lastCut.line?.trim() ?? "" }))
    .filter((x) => x.line);
  const asks = cuts.filter((x) => /[?？]$/.test(x.line));
  if (cuts.length >= 3 && asks.length >= 2 && asks.length * 2 >= cuts.length) {
    out.push({
      key: "lastcut-question:" + asks.map((x) => x.p.id).sort().join(","),
      text: `네 마지막 컷 ${cuts.length}개 중 ${asks.length}개가 질문으로 끝나. ${asks.slice(0, 2).map((x) => q(x.line)).join(" ")}`,
      evidence: [{ kind: "lastCut", refs: asks.map((x) => x.p.id), quotes: asks.map((x) => x.line) }],
      goto: { label: "이 장면 다시 해 볼래?", href: `/scenes/${asks[0].p.id}` },
    });
  }

  // ①-1 마지막 컷에 말과 같이 몸짓(지문)을 썼나 — 소개 「돌아보기」의 그 줄
  const body = pieces
    .map((p) => ({ p, dir: latest(p)?.lastCut.direction?.trim() ?? "" }))
    .filter((x) => x.dir);
  if (cuts.length >= 3 && body.length * 2 > cuts.length) {
    out.push({
      key: "lastcut-body:" + body.map((x) => x.p.id).sort().join(","),
      text: `네 마지막 컷 ${cuts.length}개 중 ${body.length}개엔 말 옆에 몸짓이 같이 있어. ${body.slice(0, 2).map((x) => `(${x.dir})`).join(" ")}`,
      evidence: [{ kind: "lastCut", refs: body.map((x) => x.p.id), quotes: body.map((x) => `(${x.dir})`) }],
      goto: { label: "이 장면 다시 보기", href: `/scenes/${body[0].p.id}` },
    });
  }

  // ② 다시 찍을 때 마지막 컷이 어떻게 바뀌었나
  for (const p of pieces) {
    if (p.takes.length < 2) continue;
    const first = p.takes[0].lastCut.line, last = p.takes.at(-1)!.lastCut.line;
    if (!first || !last || first === last) continue;
    out.push({
      key: "take-shift:" + p.id + ":" + p.takes.length,
      text: `「${p.title}」 — 다시 찍으니 마지막 컷이 ${q(first)}에서 ${q(last)}로 바뀌었어. 테이크 ${p.takes.length}개.`,
      evidence: [{ kind: "lastCut", refs: [p.id], quotes: p.takes.map((t) => `T${t.n} ${t.lastCut.line}`) }],
      goto: { label: "나란히 보기", href: `/scenes/${p.id}?view=side` },
    });
  }

  // ③ 상황극에서 고른 과제 vs 내 무대에서 세운 장면
  const situ = pieces.filter((p) => p.source.track === "situation" && p.task);
  const counts = new Map<TaskKind, ScenePiece[]>();
  situ.forEach((p) => counts.set(p.task!.kind, [...(counts.get(p.task!.kind) ?? []), p]));
  const top = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (top && top[1].length >= 2) {
    const inner = pieces.filter((p) => p.source.track === "inner");
    const t = TASKS[top[0]];
    out.push({
      key: "task-choice:" + top[0] + ":" + top[1].length,
      text: `상황극에선 ${t.icon} ${t.label} 과제를 ${top[1].length}번 골랐어.` +
        (inner.length ? ` 내 무대에선 장면 ${inner.length}개를 세웠고.` : ""),
      evidence: [{ kind: "taskChoice", refs: top[1].map((p) => p.id), quotes: top[1].map((p) => p.title) }],
      goto: { label: "닮은 상황극 하나 해 볼래?", href: `/situation` },
    });
  }

  // ④ 자리 바꾸기를 하면 말이 길어지나
  for (const p of pieces.filter((x) => x.techniques.includes("reversal"))) {
    const beats = p.takes.flatMap((t) => t.beats).filter((b) => b.who === "me");
    const asOther = beats.filter((b) => b.asOther), asMe = beats.filter((b) => !b.asOther);
    if (asOther.length < 1 || asMe.length < 2) continue;
    const avg = (xs: typeof beats) => xs.reduce((n, b) => n + b.text.length, 0) / xs.length;
    const ratio = avg(asOther) / Math.max(1, avg(asMe));
    if (ratio >= 1.5) {
      out.push({
        key: "reversal-length:" + p.id,
        text: `「${p.title}」에서 자리 바꾸기를 하니 네 말이 ${ratio >= 2 ? "두 배 넘게" : "더"} 길어졌어.`,
        evidence: [{ kind: "beatLength", refs: [p.id], quotes: asOther.map((b) => b.text) }],
        goto: { label: "이 장면 다시 보기", href: `/scenes/${p.id}` },
      });
    }
  }

  // ⑤ 대사를 고친 자리 — 길어졌나 짧아졌나
  const lineRevs = revisions.filter((r) => r.target.field === "line" || r.target.field === "lastCut");
  if (lineRevs.length >= 2) {
    const longer = lineRevs.filter((r) => r.after.length > r.before.length);
    const dir = longer.length * 2 >= lineRevs.length ? "더 긴 말로" : "더 짧은 말로";
    const n = longer.length * 2 >= lineRevs.length ? longer.length : lineRevs.length - longer.length;
    out.push({
      key: "line-revs:" + lineRevs.length,
      text: `대사와 마지막 컷을 고친 게 ${lineRevs.length}번이야. 그중 ${n}번은 ${dir} 바뀌었어.`,
      evidence: [{ kind: "revision", refs: lineRevs.map((r) => r.id), quotes: lineRevs.map((r) => `${r.before} → ${r.after}`) }],
    });
  }

  // ⑥ 고친 이유로 자주 고른 칩
  const chips = new Map<string, Revision[]>();
  revisions.forEach((r) => r.reason?.chip && chips.set(r.reason.chip, [...(chips.get(r.reason.chip) ?? []), r]));
  const topChip = [...chips.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (topChip && topChip[1].length >= 2) {
    out.push({
      key: "reason:" + topChip[0] + ":" + topChip[1].length,
      text: `고친 이유로 「${topChip[0]}」를 ${topChip[1].length}번 골랐어.`,
      evidence: [{ kind: "reason", refs: topChip[1].map((r) => r.id), quotes: topChip[1].map((r) => r.target.label) }],
    });
  }

  // ⑦ 🎞 인물이 🪞 장면에 불려 왔나 (배우 카드)
  const situNames = new Set(situ.map((p) => p.scene.other.name));
  const reused = pieces.filter((p) => p.source.track === "inner" && situNames.has(p.scene.other.name));
  if (reused.length >= 1) {
    out.push({
      key: "cast:" + reused.map((p) => p.id).join(","),
      text: `🎞에서 만난 인물 「${reused[0].scene.other.name}」을 🪞 장면에 ${reused.length}번 불러왔어.`,
      evidence: [{ kind: "castReuse", refs: reused.map((p) => p.id), quotes: reused.map((p) => p.title) }],
    });
  }

  // ⑧ 완성한 작품을 다시 열어 고쳤나
  for (const w of works.filter((x) => x.done)) {
    const after = revisions.filter((r) => r.target.workId === w.id);
    if (after.length >= 3) {
      out.push({
        key: "work-revs:" + w.id + ":" + after.length,
        text: `「${w.title}」은 ${after.length}번 고쳐졌어. 완성하고 나서도 다시 열었어.`,
        evidence: [{ kind: "revision", refs: after.map((r) => r.id), quotes: after.slice(-3).map((r) => r.target.label) }],
        goto: { label: "고친 기록 보기", href: `/scenes/join/${w.id}?tab=log` },
      });
    }
  }

  // 근거 없음 · 진단/처방 말 → 버림
  return out.filter((i) =>
    i.evidence.some((e) => e.refs.length > 0) &&
    !BANNED_INSIGHT_WORDS.some((w) => i.text.includes(w)));
}
