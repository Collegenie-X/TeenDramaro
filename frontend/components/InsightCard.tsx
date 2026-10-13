"use client";

/**
 * 🔍 보이는 것 한 줄 — 근거 · 맞아/잘 모르겠어/아닌데 · 한 줄 덧붙이기(내 말로 저장)
 * 내 씬 맨 위와, 그 줄의 근거가 된 씬 안에 같이 뜬다.
 */
import Link from "next/link";
import { useState } from "react";
import { checkSafety, type SafetyLevel } from "@/lib/safety";
import { setMark } from "@/lib/store";
import type { Insight, InsightMark } from "@/lib/types";

const KIND_LABEL = {
  lastCut: "🎬 내가 쓴 마지막 컷", revision: "✏️ 고친 기록", taskChoice: "🎯 내가 고른 과제",
  beatLength: "🪞 내 말 길이", castReuse: "🎭 배우 카드", reason: "✏️ 고친 이유",
} as const;

export default function InsightCard({
  i, m, onUnsafe, hideGoto,
}: { i: Insight; m?: InsightMark; onUnsafe: (l: SafetyLevel) => void; hideGoto?: boolean }) {
  const [note, setNote] = useState(m?.note ?? "");
  const [writing, setWriting] = useState(false);
  const [bye, setBye] = useState(false);

  if (bye) return <div className="bub-wrap director"><div className="who">🎬 진행자</div><div className="bub">알았어, 지울게. 네가 제일 잘 알지.</div></div>;

  return (
    <div className="insight">
      <div className="i-text">{i.text}</div>
      <details>
        <summary>근거 보기</summary>
        <ul>
          {i.evidence.map((e, k) => (
            <li key={k}>{KIND_LABEL[e.kind]}{e.quotes.slice(0, 5).map((qq, j) => <div key={j}>· {qq}</div>)}</li>
          ))}
        </ul>
      </details>
      {m?.note && !writing && <div className="mine">✍️ 내 말 — {m.note}</div>}
      <div className="marks">
        <button className={m?.mark === "yes" ? "on" : ""} onClick={() => setMark(i.key, "yes")}>맞아</button>
        <button className={m?.mark === "unsure" ? "on" : ""} onClick={() => setMark(i.key, "unsure")}>잘 모르겠어</button>
        <button onClick={() => { setMark(i.key, "no"); setBye(true); }}>아닌데</button>
      </div>
      {writing ? (
        <div className="input-row">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="내 해석은 내 말로" autoFocus />
          <button className="btn btn-sm" onClick={() => {
            const hit = checkSafety(note);
            if (hit) { onUnsafe(hit.level); return; }
            setMark(i.key, m?.mark ?? "yes", note.trim());
            setWriting(false);
          }}>남기기</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => setWriting(true)}>✍️ {m?.note ? "고쳐 쓰기" : "한 줄 덧붙이기"}</button>
          {i.goto && !hideGoto && <Link href={i.goto.href} className="btn btn-sm">{i.goto.label}</Link>}
        </div>
      )}
    </div>
  );
}
