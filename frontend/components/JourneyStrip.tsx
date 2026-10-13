"use client";

/**
 * 👣 여섯 걸음 — ✨ 소개 「모으기」의 고르기 → 씬 하기 → 모이기 → 잇기 → 고치기 → 돌아보기.
 * 걸은 걸음은 켜지고, 지금 걸음엔 다음에 할 한 가지만. 점수 · 퍼센트는 없다.
 */
import Link from "next/link";
import about from "@/data/about.json";
import copy from "@/data/scenes.json";
import type { InsightMark, Revision, ScenePiece, Work } from "@/lib/types";
import { NOTE_MIN_PIECES } from "@/lib/insight";

type Hint = { text: string; cta?: { label: string; href: string } };
const HINTS = copy.journey.hints as Record<string, Hint>;
const FIX_FIELDS = new Set<Revision["target"]["field"]>(["take", "line", "lastCut"]);

export default function JourneyStrip({
  pieces, works, revisions, marks,
}: { pieces: ScenePiece[]; works: Work[]; revisions: Revision[]; marks: Record<string, InsightMark> }) {
  const has = pieces.length > 0;
  const walked: Record<string, boolean> = {
    pick: has, play: has, keep: has,
    join: works.length > 0,
    fix: revisions.some((r) => FIX_FIELDS.has(r.target.field)) || pieces.some((p) => p.takes.length > 1),
    look: Object.keys(marks).length > 0,
  };
  const steps = about.stages.pile.journey;
  const cur = steps.find((s) => !walked[s.key])?.key;
  const hint: Hint =
    !cur ? HINTS.done
    : cur === "join" ? (pieces.length < 2 ? HINTS["join-wait"] : HINTS.join)
    : cur === "look" ? (pieces.length < NOTE_MIN_PIECES ? HINTS["look-wait"] : HINTS.look)
    : HINTS[cur] ?? HINTS.pick;

  return (
    <section className="journey" aria-label={copy.journey.title}>
      <ol>
        {steps.map((s) => (
          <li key={s.key} className={walked[s.key] ? "on" : s.key === cur ? "cur" : ""} aria-current={s.key === cur ? "step" : undefined}>
            <span className="j-dot" aria-hidden="true">{walked[s.key] ? "✓" : ""}</span>
            {s.name}
          </li>
        ))}
      </ol>
      <div className="j-hint">
        <span>{hint.text}</span>
        {hint.cta && <Link href={hint.cta.href} className="btn btn-sm">{hint.cta.label}</Link>}
      </div>
    </section>
  );
}
