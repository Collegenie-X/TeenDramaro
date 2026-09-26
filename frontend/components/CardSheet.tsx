"use client";

import type { TarotCard } from "@/lib/cards";

export default function CardSheet({
  card, owned, onClose,
}: { card: TarotCard; owned: boolean; onClose: () => void }) {
  return (
    <div className="sheet-bg" role="dialog" aria-modal onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ borderTopColor: "var(--gold)" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div className="card-face" style={{ margin: "0 auto", animation: "none" }}>
            <span className="em">{card.emoji}</span>
            <div className="nm">{card.name}</div>
            <div className="kw">{card.keyword}</div>
          </div>
        </div>

        <div className="sect-t" style={{ marginTop: 0 }}>이 카드가 부르는 이야기</div>
        <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 12px" }}>
          {card.situations.join(" · ")}
        </p>

        <div className="sect-t">이 카드가 던지는 질문</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 0 12px" }}>{card.cardHint}</p>

        {owned ? (
          <>
            <div className="sect-t">뒤집으면</div>
            <div className="tomorrow">
              {card.flip.emoji} {card.flip.name} — {card.flip.reading}
            </div>
          </>
        ) : (
          <p className="note" style={{ marginTop: 4 }}>
            아직 안 뽑은 카드야. 뒤집힌 면은 이 카드로 이야기를 만들면 열려.
          </p>
        )}

        <button className="cta" style={{ marginTop: 14 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
