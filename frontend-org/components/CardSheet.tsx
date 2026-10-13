"use client";

import Link from "next/link";
import type { TarotCard } from "@/lib/cards";
import type { StoryRecord } from "@/lib/types";
import { CardArt } from "./CardArt";

/**
 * 카드 상세 팝업.
 * 카드는 모으는 물건이 아니라 이야기의 입구다 — 그래서 여기서는
 * (1) 이 카드가 묻는 것, (2) 이 카드로 내가 만든 이야기, (3) 이 카드로 새 무대 올리기를 보여준다.
 */
export default function CardSheet({
  card, stories, onClose,
}: { card: TarotCard; stories: StoryRecord[]; onClose: () => void }) {
  const mine = stories.filter((s) => s.cardId === card.id);
  const opened = mine.length > 0;

  return (
    <div className="sheet-bg" role="dialog" aria-modal onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ borderTopColor: "var(--gold)" }}>
        <div className="card-pair">
          <CardArt card={card} width={118} className="card-art-pop" animate />
          {opened && <CardArt card={card} flipped width={118} className="card-art-pop" style={{ animationDelay: "0.25s" }} />}
        </div>
        <div className="note" style={{ textAlign: "center", marginTop: 8 }}>
          {card.situations.join(" · ")}
        </div>

        <div className="sect-t">이 카드가 묻는 것</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 0 12px" }}>{card.cardHint}</p>

        {opened ? (
          <>
            <div className="sect-t">뒤집으면 · {card.flip.emoji} {card.flip.name}</div>
            <div className="tomorrow" style={{ marginBottom: 12 }}>{card.flip.reading}</div>

            <div className="sect-t">이 카드로 만든 내 이야기 {mine.length}편</div>
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              {mine.map((s) => (
                <Link key={s.id} href={`/story/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="row-item">
                    <div style={{ flex: 1 }}>
                      <b>{s.title || "제목 없는 이야기"}</b>
                      <small>{s.date} · {s.characterName}의 이야기</small>
                    </div>
                    <span style={{ fontSize: 15 }}>{s.emotionFlow.slice(-3).join("")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="note" style={{ margin: "0 0 12px" }}>
            아직 이 카드로 올린 무대는 없어. 뒤집힌 면은 이 카드로 이야기를 한 편 만들면 열려.
          </p>
        )}

        <Link href={`/play?card=${card.id}`} className="cta cta-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          이 카드로 무대 올리기
        </Link>
        <button className="cta" style={{ marginTop: 8 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
