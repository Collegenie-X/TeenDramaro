"use client";

/**
 * 🧩 씬 카드 다섯 칸 — ✨ 소개 「씬 카드」와 같은 모양.
 *   1 배경 · 2 출처 · 3 뼈대(정해진 것 / 열린 것) · 4 결정적 자리 · 5 마지막 컷
 * 🎞에서 왔든 🪞에서 왔든 칸이 같아서 섞어 이을 수 있다.
 */
import about from "@/data/about.json";
import copy from "@/data/scenes.json";
import { getArchetype } from "@/lib/store";
import type { ScenePiece, Take } from "@/lib/types";

const PARTS = about.stages.scene.parts;
const C = copy.anatomy;

export default function PieceAnatomyCard({ p, take }: { p: ScenePiece; take: Take }) {
  const s = p.scene;
  const arch = p.source.track === "situation" ? getArchetype(p.source.archetypeId) : undefined;
  const from = p.source.track === "inner" && p.source.fromArchetypeId ? getArchetype(p.source.fromArchetypeId) : undefined;

  const body: Record<number, React.ReactNode> = {
    1: <><div className="slug" style={{ fontSize: 11.5 }}>{s.place} · {s.time}</div><small>{s.light}</small></>,
    2: p.source.track === "situation"
      ? <><b>{C.sit}</b> — {arch ? `「${arch.adaptTitle}」` : "상황극 카드"}{arch && <small>원형 「{arch.typeName}」 → 중학생 자리로 옮김</small>}</>
      : <><b>{C.inner}</b> — {p.source.avatar ? C.avatar : C.self}{from && <small>🎞 「{from.adaptTitle}」 하다가 건너옴</small>}</>,
    3: (
      <div className="anat-bones">
        <div><small>{C.fixed}</small><ul className="list">{s.fixed.map((f) => <li key={f}>{f}</li>)}</ul></div>
        <div><small>{C.open}</small><ul className="list">{s.open.map((f) => <li key={f}>{f}</li>)}</ul></div>
      </div>
    ),
    4: <><span>🌟 {p.pivot}</span>
      {take.branches.length
        ? <div className="chips" style={{ marginTop: 6 }}>{take.branches.map((b) => <span key={b} className="chip" style={{ fontSize: 11.5 }}>{b}</span>)}</div>
        : <small>{C.noBranch}</small>}</>,
    5: <><b style={{ fontWeight: 600 }}>「{take.lastCut.line || "…"}」</b>{take.lastCut.direction && <small><i>({take.lastCut.direction})</i></small>}</>,
  };

  return (
    <details className="anat">
      <summary>
        <span>{C.summary}</span>
        <small>{C.hint}</small>
      </summary>
      <ol>
        {PARTS.map((part) => (
          <li key={part.no} className={part.no === 4 ? "pivot" : ""}>
            <span className="anat-no">{part.no}</span>
            <div><div className="anat-name">{part.name}</div>{body[part.no]}</div>
          </li>
        ))}
      </ol>
    </details>
  );
}
