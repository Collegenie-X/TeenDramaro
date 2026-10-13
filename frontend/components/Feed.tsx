"use client";

import { CastFace, moodOf } from "@/components/CastArt";
import type { Beat, Look } from "@/lib/types";

/** 말풍선 — 상대 · 나 · 진행자 · PD. 지문은 기울임, 🟡 새 사실은 띠로 */
export default function Feed({
  beats, meName, otherName, meLook, otherLook, looks, onBeatTap,
}: {
  beats: Beat[];
  meName: string;
  otherName: string;
  /** 🎭 생김새가 있으면 말풍선 옆에 얼굴을 세운다 */
  meLook?: Look;
  otherLook?: Look;
  /** 🎭 여러 명 · 👀 지켜보는 사람 — 이름 → 생김새 */
  looks?: Record<string, Look | undefined>;
  onBeatTap?: (b: Beat) => void;
}) {
  return (
    <div className="feed">
      {beats.map((b) => {
        if (b.fact) return <div key={b.id} className="fact-beat">🟡 새 사실 · {b.text}</div>;
        if (b.who === "watch") {
          const wl = b.by ? looks?.[b.by] : undefined;
          return (
            <div key={b.id} className="watch-beat" onClick={() => onBeatTap?.(b)}>
              {wl ? <CastFace look={wl} mood="calm" size={22} ring={false} /> : <span aria-hidden="true">👀</span>}
              {/* 🔊 속마음은 「(🔊 아빠 속마음) …」 꼴 — 머리표를 이름 칸으로 올린다 */}
              {b.text.startsWith("(🔊") ? (
                <div><span className="watch-who">🔊 {b.by}</span><span className="watch-text">{b.text.replace(/^\(🔊[^)]*\)\s*/, "")}</span></div>
              ) : (
                <div><span className="watch-who">👀 {b.by}</span><span className="watch-text">{b.text}</span></div>
              )}
            </div>
          );
        }
        const name =
          b.who === "me" ? (b.asOther ? `🔄 ${otherName} 자리의 나` : b.tech === "soliloquy" ? `🗯 ${meName} (혼잣말)` : b.tech === "chair" ? `🪑 ${meName} → 빈 의자` : `🙋 ${meName}`)
          : b.who === "other" ? `🎭 ${b.by ?? otherName}`
          : b.who === "director" ? "🎬 진행자"
          : b.who === "pd" ? "🎛 PD" : "";
        const look = b.who === "other" ? (b.by && looks?.[b.by]) || otherLook : b.who === "me" ? (b.asOther ? otherLook : meLook) : undefined;
        const body = (
          <>
            {name && <div className="who">{name}</div>}
            {b.dir && <div className="dir">*{b.dir}*</div>}
            <div className={`bub ${b.direction ? "direction" : ""}`}>{b.direction ? `*${b.text}*` : b.text}</div>
          </>
        );
        return (
          <div key={b.id} className={`bub-wrap ${b.who} ${b.asOther ? "as-other" : ""} ${look ? "has-face" : ""}`} onClick={() => onBeatTap?.(b)}>
            {look ? (
              <div className="bub-row">
                <CastFace look={look} mood={b.who === "other" ? moodOf(b.dir) : "calm"} size={30} />
                <div className="bub-col">{body}</div>
              </div>
            ) : body}
          </div>
        );
      })}
    </div>
  );
}
