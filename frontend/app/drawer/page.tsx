"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CARDS, SPECIAL_CARDS, cardById, type TarotCard } from "@/lib/cards";
import CardSheet from "@/components/CardSheet";
import { loadStories } from "@/lib/store";
import type { StoryRecord } from "@/lib/types";
import TabBar from "@/components/TabBar";

export default function Drawer() {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [open, setOpen] = useState<TarotCard | null>(null);
  useEffect(() => setStories(loadStories()), []);

  const got = new Set(stories.map((s) => s.cardId));
  const replays = stories.filter((s) => s.branchesUsed.includes("lines")).length;
  const swaps = stories.filter((s) => s.branchesUsed.includes("swap")).length;
  const unlocked = [replays >= 3, stories.length >= 3, swaps >= 2];

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">🗄️ 내 카드 서랍장</div>
            <div className="topbar-sub">모은 카드 {got.size}장 / 12장 · 이야기 {stories.length}편</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="card-grid">
          {CARDS.map((c) => {
            const has = got.has(c.id);
            return (
              <button key={c.id} className={`mini ${has ? "got" : ""}`} onClick={() => setOpen(c)}>
                <span style={{ opacity: has ? 1 : 0.4 }}>{c.emoji}</span>
                <small>{c.name}</small>
                {!has && <small style={{ fontSize: 8, opacity: 0.7 }}>아직</small>}
              </button>
            );
          })}
        </div>

        <div className="sect-t">📖 완성된 이야기</div>
        {stories.length === 0 ? (
          <p className="note">아직 비어 있어. 무대를 한 번 올리면 여기에 이야기가 쌓여.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {stories.map((s) => {
              const c = cardById(s.cardId);
              return (
                <Link key={s.id} href={`/story/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="row-item">
                    <span className="lg">{c.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <b>{s.title || "제목 없는 이야기"}</b>
                      <small>{s.date} · {c.name} · {s.characterName}의 이야기</small>
                    </div>
                    <span style={{ fontSize: 15 }}>{s.emotionFlow.slice(-3).join("")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="sect-t">🏆 특별 카드 해금</div>
        <div style={{ display: "grid", gap: 8 }}>
          {SPECIAL_CARDS.map((sp, i) => (
            <div key={sp.name} className="row-item" style={{ opacity: unlocked[i] ? 1 : 0.5 }}>
              <span className="lg">{unlocked[i] ? sp.emoji : "🔒"}</span>
              <div>
                <b>{sp.name}</b>
                <small>{sp.condition}{unlocked[i] ? " · 해금됨" : ""}</small>
              </div>
            </div>
          ))}
        </div>

        <p className="note">
          카드를 누르면 그 카드가 어떤 이야기를 부르는지 볼 수 있어.<br />
          이야기는 이 기기 안에만 저장돼. 서버로 올라가지 않아.<br />
          보호자에게 공유하는 기능은 네가 직접 켜야만 동작해 (아직 준비 중).
        </p>
      </div>

      {open && <CardSheet card={open} owned={got.has(open.id)} onClose={() => setOpen(null)} />}

      <TabBar />
    </>
  );
}
