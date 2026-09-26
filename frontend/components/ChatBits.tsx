"use client";

import type { Inference, Msg } from "@/lib/types";

export function Bubble({ m }: { m: Msg }) {
  if (m.inference) return <InferenceCard inf={m.inference} />;
  if (m.compare) return <CompareCard {...m.compare} />;

  const cls = m.role === "user" ? "b-user" : m.role === "other" ? "b-other" : "b-director";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", alignSelf: "stretch" }}>
      {m.chapter && <Chapter act={m.chapter.act} note={m.chapter.note} />}
      {m.role === "other" && m.speakerName && <span className="speaker">🎭 {m.speakerName} 역</span>}
      <div className={`bubble ${cls}`}>{m.text}</div>
      {m.feelings && m.feelings.length > 0 && (
        <div className="bubble-feels">
          {m.feelings.map((f) => <span key={f}>{f}</span>)}
        </div>
      )}
    </div>
  );
}

/** 이야기의 장이 바뀌는 자리 — about 페이지의 타임라인과 같은 톤 */
export function Chapter({ act, note }: { act: string; note: string }) {
  return (
    <div className="chapter">
      <span className="chapter-act">{act}</span>
      <p>{note}</p>
    </div>
  );
}

export function InferenceCard({ inf }: { inf: Inference }) {
  return (
    <div className="infer">
      <div className="infer-h">🔍 디렉터가 읽은 것</div>
      <div className="infer-body">{inf.reading}</div>
      <div className="chips">
        {inf.emotions.map((e) => <span key={e} className="chip chip-em">{e}</span>)}
        {inf.keywords.map((k) => <span key={k} className="chip">#{k}</span>)}
      </div>
      <div className="infer-note">이건 내 추측이야. 아니면 「아닌데」라고 해줘 — 바로 고칠게.</div>
    </div>
  );
}

export function CompareCard({
  first, replay, labels = ["1차 · 그때", "리플레이 · 다시"],
}: { first: string; replay: string; labels?: [string, string] }) {
  return (
    <div className="compare">
      <div className="cmp-col">
        <h4>{labels[0]}</h4>
        <p>{first || "(아무 말 안 함)"}</p>
      </div>
      <div className="cmp-col replay">
        <h4>{labels[1]}</h4>
        <p>{replay || "(아무 말 안 함)"}</p>
      </div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="bubble b-director" style={{ padding: "13px 16px" }}>
      <span className="typing"><i /><i /><i /></span>
    </div>
  );
}
