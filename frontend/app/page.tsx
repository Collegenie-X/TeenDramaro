"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStories, sessionsToday } from "@/lib/store";
import { DAILY_SESSION_LIMIT } from "@/lib/safety";
import TabBar from "@/components/TabBar";

export default function Home() {
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState(0);

  useEffect(() => {
    setCollected(new Set(loadStories().map((s) => s.cardId)));
    setUsed(sessionsToday());
  }, []);

  const left = Math.max(0, DAILY_SESSION_LIMIT - used);

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">🎭 마음무대 · MindStage</div>
            <div className="topbar-sub">타로 × 사이코드라마 × AI 디렉터</div>
          </div>
          <span className="turn-pill">오늘 {left}/{DAILY_SESSION_LIMIT}회</span>
        </div>
      </header>

      <div className="scroll">
        <div className="hero">
          <span className="badge">TONIGHT&apos;S STAGE</span>
          <h1>가상의 나를<br />무대에 올려볼래?</h1>
          <p>
            네 이야기를 직접 말하지 않아도 돼.<br />
            카드가 대신 꺼내고, 네가 만든 캐릭터가 대신 서.<br />
            너는 작가, 나는 연출자.
          </p>
        </div>

        <svg viewBox="0 0 360 150" className="scene-svg" aria-hidden>
          <defs>
            <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a1a44" /><stop offset="100%" stopColor="#120c22" />
            </linearGradient>
            <radialGradient id="hs" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="360" height="150" fill="url(#h)" />
          <rect width="360" height="150" fill="url(#hs)" />
          <path d="M0 0 H70 Q46 75 66 150 H0 Z" fill="#4a1026" opacity="0.8" />
          <path d="M360 0 H290 Q314 75 294 150 H360 Z" fill="#4a1026" opacity="0.8" />
          <ellipse cx="180" cy="132" rx="96" ry="14" fill="#fff" opacity="0.08" />
          {[110, 180, 250].map((x, i) => (
            <g key={x} transform={`translate(${x} 96) scale(${0.62 - i * 0.02})`} opacity={i === 1 ? 1 : 0.55}>
              <path d="M-20 62 L-15 10 Q0 2 15 10 L20 62 Z" fill="#e8d9c5" />
              <circle cx="0" cy="-12" r="19" fill="#fdf3e6" />
              <text x="0" y="-4" fontSize="24" textAnchor="middle">{["🎭", "🙂", "🌙"][i]}</text>
            </g>
          ))}
        </svg>

        <Link href="/play" className="cta cta-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          무대 올리기 · 20턴 시작
        </Link>

        <Link href="/drawer" className="row-item" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="lg">🗄️</span>
          <div style={{ flex: 1 }}>
            <b>내 카드 서랍장</b>
            <small>모은 카드 {collected.size}장 / 12장 · 지난 이야기 다시 보기</small>
          </div>
          <span style={{ color: "var(--ink-faint)" }}>›</span>
        </Link>

        <p className="note">
          진단이나 처방은 하지 않아. 여기는 탐색하고 알아차리는 무대야.<br />
          하기 싫은 질문은 넘겨도 되고, 한 줄만 써도 충분해.<br />
          한 세션은 약 25분, 하루 {DAILY_SESSION_LIMIT}회까지.
        </p>
      </div>

      <TabBar />
    </>
  );
}
