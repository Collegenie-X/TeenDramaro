"use client";

import { useState } from "react";
import { CARDS, type TarotCard } from "@/lib/cards";

export default function Deck({ onDraw }: { onDraw: (c: TarotCard) => void }) {
  const [drawn, setDrawn] = useState<TarotCard | null>(null);

  const draw = (i: number) => {
    if (drawn) return;
    // 셔플된 덱에서 뽑는 느낌 — 탭한 위치와 무작위를 섞는다
    const c = CARDS[(Math.floor(Math.random() * CARDS.length) + i) % CARDS.length];
    setDrawn(c);
    setTimeout(() => onDraw(c), 1100);
  };

  if (drawn) {
    return (
      <div className="reveal">
        <div className="card-face">
          <span className="em">{drawn.emoji}</span>
          <div className="nm">{drawn.name}</div>
          <div className="kw">{drawn.keyword}</div>
        </div>
        <div className="note">뽑힌 카드 · {drawn.situations.join(" · ")}</div>
      </div>
    );
  }

  return (
    <>
      <div className="deck">
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} className="deck-card" onClick={() => draw(i)} aria-label={`${i + 1}번째 카드 뽑기`}>✦</button>
        ))}
      </div>
      <div className="note" style={{ textAlign: "center" }}>마음 가는 카드를 한 장 탭해</div>
    </>
  );
}
