"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cardById } from "@/lib/cards";
import { loadStories } from "@/lib/store";
import type { StoryRecord } from "@/lib/types";
import StageScene from "@/components/StageScene";

export default function Story() {
  const { id } = useParams<{ id: string }>();
  const [st, setSt] = useState<StoryRecord | null | undefined>(undefined);

  useEffect(() => setSt(loadStories().find((x) => x.id === id) ?? null), [id]);

  if (st === undefined) return <div className="scroll" />;
  if (!st) {
    return (
      <div className="scroll">
        <p className="note">그 이야기를 찾을 수 없어.</p>
        <Link href="/drawer" className="cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>서랍장으로</Link>
      </div>
    );
  }

  const c = cardById(st.cardId);

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">📖 {st.title || "제목 없는 이야기"}</div>
            <div className="topbar-sub">{st.date} · {c.emoji} {c.name} → {c.flip.emoji} {c.flip.name}</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <StageScene
          scene={{ backdrop: "stage", light: 4, mood: "warm", mask: 0, chain: 0, other: false, card: "flipped", caption: `${st.characterName}의 이야기 · 커튼콜` }}
          cardId={st.cardId}
          protagonist={st.characterName}
        />

        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>감정 흐름</div>
          <div className="flowline">
            {st.emotionFlow.map((e, i) => (
              <span key={i}>{i > 0 && <span className="arrow"> ▸ </span>}{e}</span>
            ))}
          </div>
          <div className="sect-t">인사이트</div>
          <ul style={{ margin: 0, padding: 0 }}>{st.insights.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <div className="sect-t">내일의 한마디</div>
          <div className="tomorrow">{st.tomorrow}</div>
        </div>

        <Link href="/drawer" className="cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>← 서랍장</Link>
      </div>
    </>
  );
}
