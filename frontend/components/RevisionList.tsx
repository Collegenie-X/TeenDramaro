"use client";

/**
 * ✏️ 고친 기록 보기 — 바뀐 것만(형광펜) · 타임라인(날짜 순서)
 * 「나란히」는 테이크 비교라 화면마다 따로 그린다.
 */
import { wordDiff } from "@/lib/diff";
import type { Revision } from "@/lib/types";

const at = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const FIELD_ICON: Record<Revision["target"]["field"], string> = {
  take: "⏪", line: "✏️", lastCut: "🎬", dials: "🎚", order: "🔀", slotAdd: "＋", slotRemove: "－",
  slotTake: "🎞", seam: "〰", caption: "🗒", title: "🏷",
};

export function Diff({ before, after }: { before: string; after: string }) {
  if (!before) return <mark className="add">{after}</mark>;
  if (!after) return <del className="del">{before}</del>;
  return (
    <>
      {wordDiff(before, after).map((s, i) =>
        s.kind === "same" ? <span key={i}>{s.t}</span>
          : s.kind === "add" ? <mark key={i} className="add">{s.t}</mark>
          : <del key={i} className="del">{s.t}</del>)}
    </>
  );
}

export default function RevisionList({ revisions, mode }: { revisions: Revision[]; mode: "changed" | "timeline" }) {
  if (!revisions.length) return <div className="empty"><span className="big">✏️</span>아직 고친 자리가 없어.<br />고치면 덮어쓰지 않고 여기 판본으로 남아.</div>;
  const list = mode === "timeline" ? [...revisions].sort((a, b) => a.at.localeCompare(b.at)) : [...revisions].reverse();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 4 }}>
      {list.map((r) => (
        <div key={r.id} className="rev">
          <div className="r-at">{at(r.at)}</div>
          <div className="r-label">{FIELD_ICON[r.target.field]} {r.target.label}{r.reason?.chip && <span className="pill" style={{ marginLeft: 6 }}>{r.reason.chip}</span>}</div>
          <div className="r-body">
            {mode === "changed" ? <Diff before={r.before} after={r.after} /> : <>{r.before ? `「${r.before}」 → ` : ""}「{r.after}」</>}
          </div>
          {r.reason?.note && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>— {r.reason.note}</div>}
        </div>
      ))}
    </div>
  );
}
