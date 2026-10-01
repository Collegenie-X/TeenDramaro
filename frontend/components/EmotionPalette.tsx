"use client";

import { useState } from "react";
import { FEELINGS, groupOf } from "@/lib/emotions";
import EmoIcon from "./EmoIcon";

export const MAX_FEELS = 2;

export default function EmotionPalette({
  picked, onToggle,
}: { picked: string[]; onToggle: (f: string) => void }) {
  const [group, setGroup] = useState<string | null>(null);
  const g = FEELINGS.find((x) => x.id === group);

  return (
    <div className="emo-dock-wrap">
      {g && (
        <div className="emo-popup" style={{ "--emo-bg": g.tone[0], "--emo-border": g.tone[1], "--emo-fg": g.tone[2] } as React.CSSProperties}>
          <div className="emo-popup-head">
            <span><EmoIcon id={g.id} size={16} /> {g.label}</span>
            <span className="emo-count">{picked.length}/{MAX_FEELS}</span>
            <button onClick={() => setGroup(null)} aria-label="닫기">✕</button>
          </div>
          <div className="emo-popup-items">
            {g.items.map((f) => {
              const on = picked.includes(f);
              const full = !on && picked.length >= MAX_FEELS;
              return (
                <button key={f} className={`emo-chip${on ? " emo-chip-on" : ""}`} disabled={full} onClick={() => onToggle(f)}>
                  {on && <span className="emo-chip-check">✓</span>}{f}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="emo-dock">
        {FEELINGS.map((x) => {
          const n = picked.filter((p) => x.items.includes(p)).length;
          return (
            <button
              key={x.id}
              className={`emo-dock-btn${group === x.id ? " emo-dock-on" : ""}${n ? " emo-dock-has" : ""}`}
              style={{ "--emo-bg": x.tone[0], "--emo-border": x.tone[1], "--emo-fg": x.tone[2] } as React.CSSProperties}
              onClick={() => setGroup(group === x.id ? null : x.id)}
              aria-label={x.label}
              title={x.label}
            >
              <EmoIcon id={x.id} />
              {n > 0 && <span className="emo-dock-badge">{n}</span>}
            </button>
          );
        })}
      </div>

      {picked.length > 0 && (
        <div className="emo-picked">
          {picked.map((f) => {
            const pg = groupOf(f);
            return (
              <button
                key={f}
                className="emo-picked-tag"
                style={pg ? { background: pg.tone[0], borderColor: pg.tone[1], color: pg.tone[2] } : undefined}
                onClick={() => onToggle(f)}
                aria-label={`${f} 빼기`}
              >
                {pg && <EmoIcon id={pg.id} size={13} />}{f}<span className="emo-picked-x">✕</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
