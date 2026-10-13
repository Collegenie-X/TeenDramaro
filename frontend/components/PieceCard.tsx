"use client";
import Link from "next/link";
import { ICON_TRACK, SPICE, TASKS } from "@/lib/meta";
import type { ScenePiece } from "@/lib/types";

const d = (iso: string) => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };

/** 🧩 씬 조각 카드 — 모서리 색이 트랙(🎞/🪞) */
export default function PieceCard({
  p, href, onClick, picked, right,
}: { p: ScenePiece; href?: string; onClick?: () => void; picked?: boolean; right?: React.ReactNode }) {
  const last = p.takes.at(-1);
  const body = (
    <>
      <div className="p-h">
        <span>{ICON_TRACK[p.source.track]}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
        {right}
      </div>
      {p.scene.place && <div className="p-slug">{[p.scene.place, p.scene.time].filter(Boolean).join(" · ")}</div>}
      <div className="p-meta">
        <span>테이크 {p.takes.length}</span>
        <span>{d(p.updatedAt)}</span>
        <span>{SPICE[p.spice].icon}</span>
        {p.task && <span>{TASKS[p.task.kind].icon} {TASKS[p.task.kind].label}</span>}
        {p.facts.length > 0 && <span>🟡 {p.facts.length}</span>}
        {p.sealed && <span>🛟 다리 없음</span>}
      </div>
      {last?.lastCut.line && <div className="p-cut">🎬 「{last.lastCut.line}」{last.lastCut.direction && <i className="muted"> *{last.lastCut.direction}*</i>}</div>}
    </>
  );
  const cls = `piece ${p.source.track} ${picked ? "picked" : ""}`;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return <button className={cls} style={{ textAlign: "left", width: "100%" }} onClick={onClick}>{body}</button>;
}
