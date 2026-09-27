"use client";

import { useEffect, useRef, useState } from "react";
import { CARDS, type TarotCard } from "@/lib/cards";
import { CardArt, CardBack } from "./CardArt";

/**
 * 카드 뽑기 의식.
 * preset이 있으면(서랍장에서 "이 카드로 무대 올리기") 뒷면 덱을 건너뛰고
 * 바로 그 카드가 뒤집히며 등장한다 — 의식은 지키고, 선택은 존중한다.
 */
export default function Deck({ onDraw, preset }: { onDraw: (c: TarotCard) => void; preset?: TarotCard | null }) {
  const [drawn, setDrawn] = useState<TarotCard | null>(preset ?? null);
  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;

  useEffect(() => {
    if (!drawn) return;
    const t = setTimeout(() => onDrawRef.current(drawn), 1100);
    return () => clearTimeout(t);
  }, [drawn]);

  const draw = (i: number) => {
    if (drawn) return;
    // 셔플된 덱에서 뽑는 느낌 — 탭한 위치와 무작위를 섞는다
    setDrawn(CARDS[(Math.floor(Math.random() * CARDS.length) + i) % CARDS.length]);
  };

  if (drawn) {
    return (
      <div className="reveal">
        <CardArt card={drawn} width={132} className="card-art-pop" animate />
        <div className="note">
          {preset ? "네가 고른 카드" : "뽑힌 카드"} · {drawn.situations.join(" · ")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="deck">
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} className="deck-card" onClick={() => draw(i)} aria-label={`${i + 1}번째 카드 뽑기`}>
            <CardBack width={62} />
          </button>
        ))}
      </div>
      <div className="note" style={{ textAlign: "center" }}>마음 가는 카드를 한 장 탭해</div>
    </>
  );
}
