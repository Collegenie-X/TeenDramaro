"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CARDS, cardById, type TarotCard } from "@/lib/cards";
import { CardArt } from "@/components/CardArt";
import CardSheet from "@/components/CardSheet";
import { loadStories } from "@/lib/store";
import type { StoryRecord } from "@/lib/types";
import TabBar from "@/components/TabBar";

/**
 * 이야기 서랍장.
 * 여기 쌓이는 건 카드가 아니라 이야기다. 카드는 각 이야기의 표지이자,
 * 다음 이야기를 시작하는 입구로만 쓴다 — 모으라고 재촉하지 않는다.
 */
export default function Drawer() {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [open, setOpen] = useState<TarotCard | null>(null);
  useEffect(() => setStories(loadStories()), []);

  const used = new Set(stories.map((s) => s.cardId));

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">📖 이야기 서랍장</div>
            <div className="topbar-sub">
              {stories.length === 0 ? "아직 비어 있어" : `이야기 ${stories.length}편`} · 카드는 다음 이야기의 입구
            </div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="sect-t" style={{ marginTop: 4 }}>📖 완성된 이야기</div>
        {stories.length === 0 ? (
          <p className="note">아직 비어 있어. 무대를 한 번 올리면 여기에 이야기가 쌓여. 아래에서 카드를 골라 시작해도 돼.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {stories.map((s) => {
              const c = cardById(s.cardId);
              return (
                <Link key={s.id} href={`/story/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="row-item">
                    <span className="story-cover"><CardArt card={c} width={34} label={false} /></span>
                    <div style={{ flex: 1 }}>
                      <b>{s.title || "제목 없는 이야기"}</b>
                      <small>{s.date} · {c.name} → {c.flip.name} · {s.characterName}의 이야기</small>
                    </div>
                    <span style={{ fontSize: 15 }}>{s.emotionFlow.slice(-3).join("")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="sect-t">🃏 카드로 시작하기</div>
        <p className="note" style={{ margin: "0 0 10px" }}>
          카드를 누르면 그 카드가 무엇을 묻는지, 내가 그 카드로 만든 이야기가 무엇인지 볼 수 있어.
          마음 가는 카드로 바로 무대를 올릴 수도 있어.
        </p>
        <div className="card-grid">
          {CARDS.map((c) => (
            <button key={c.id} className={`mini ${used.has(c.id) ? "got" : ""}`} onClick={() => setOpen(c)} aria-label={`${c.name} 카드 자세히`}>
              <CardArt card={c} width={80} label={false} />
              <small>{c.name}{used.has(c.id) ? " ✓" : ""}</small>
            </button>
          ))}
        </div>

        <p className="note" style={{ marginTop: 16 }}>
          이야기는 이 기기 안에만 저장돼. 서버로 올라가지 않아.<br />
          보호자에게 공유하는 기능은 네가 직접 켜야만 동작해 (아직 준비 중).
        </p>
      </div>

      {open && <CardSheet card={open} stories={stories} onClose={() => setOpen(null)} />}

      <TabBar />
    </>
  );
}
