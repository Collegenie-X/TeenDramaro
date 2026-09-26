"use client";

import { useState } from "react";
import { FEELINGS } from "@/lib/emotions";

/**
 * "지금 마음은?" — 고르는 게 아니라 이름을 빌려주는 칸.
 * 안 골라도 되고, 여러 개 골라도 되고, 직접 써도 된다.
 */
export default function EmotionPalette({
  picked, onToggle,
}: { picked: string[]; onToggle: (f: string) => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="feel-btn" onClick={() => setOpen(true)}>
        {picked.length ? (
          <>💗 {picked.join(" · ")}</>
        ) : (
          <>💗 지금 마음에 이름 붙이기</>
        )}
      </button>
    );
  }

  const g = FEELINGS.find((x) => x.id === group);

  return (
    <div className="feel-panel">
      <div className="feel-head">
        <span>지금 마음은? <i>골라도 되고 안 골라도 돼</i></span>
        <button onClick={() => setOpen(false)} aria-label="닫기">✕</button>
      </div>

      <div className="feel-groups">
        {FEELINGS.map((x) => (
          <button
            key={x.id}
            className={`feel-group ${group === x.id ? "on" : ""}`}
            style={group === x.id ? { background: x.tone[0], borderColor: x.tone[1], color: x.tone[2] } : undefined}
            onClick={() => setGroup(group === x.id ? null : x.id)}
          >
            {x.emoji} {x.label}
          </button>
        ))}
      </div>

      {g && (
        <div className="feel-items">
          {g.items.map((f) => (
            <button
              key={f}
              className={`chip ${picked.includes(f) ? "chip-on" : ""}`}
              style={picked.includes(f) ? { background: g.tone[0], borderColor: g.tone[1], color: g.tone[2] } : undefined}
              onClick={() => onToggle(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {picked.length > 0 && (
        <div className="feel-picked">
          고른 마음: {picked.join(" · ")}
          <button onClick={() => picked.forEach(onToggle)}>지우기</button>
        </div>
      )}

      <p className="note" style={{ margin: "8px 0 0" }}>
        여기 없는 마음이면 그냥 네 말로 적어줘. 그게 제일 정확해.
      </p>
    </div>
  );
}
