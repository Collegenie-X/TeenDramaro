"use client";

/** 화면 1 · 🏠 홈 — §19 */
import Link from "next/link";
import { useEffect, useState } from "react";
import TabBar, { useNewInsightCount } from "@/components/TabBar";
import { HomeStageArt, ShelfArt, TrackArt } from "@/components/HomeArt";
import { SitArt } from "@/components/SituationArt";
import { GENRES, GRADES, SPICE, TASKS } from "@/lib/meta";
import { todaysArchetype } from "@/lib/data";
import { loadPieces, loadProfile, loadWorks, saveProfile, useStore } from "@/lib/store";
import type { Grade } from "@/lib/types";

/** 히어로 아래에서 돌아가는 한 줄 */
const TICKER = [
  "🎭 시라노가 되어 대신 고백해 볼까?",
  "🔍 사라진 체육복, 범인은 누구?",
  "🪞 오늘 마음에 남은 장면 하나",
  "😂 몸이 바뀐 날, 엄마 앞에서",
  "🌱 졸업식 오후, 운동장 끝 벤치",
];

export default function Home() {
  const [profile] = useStore(loadProfile, { grade: "m2", cls: "chick", showAll: false });
  const [pieces] = useStore(loadPieces, []);
  const [works] = useStore(loadWorks, []);
  const fresh = useNewInsightCount();
  const today = todaysArchetype();
  const building = works.find((w) => !w.done);
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((n) => (n + 1) % TICKER.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mindscene-mark.svg" alt="" width={30} height={30} />
          <div className="topbar-info">
            <div className="topbar-title">마음씬 · MindScene</div>
            <div className="topbar-sub">내 안의 무대, 한 씬씩.</div>
          </div>
          <div className="topbar-right">
            <label className="muted" style={{ fontSize: 11.5 }}>지금 어디쯤이야?</label>
            <select
              className="pill"
              value={profile.grade}
              onChange={(e) => {
                const g = GRADES.find((x) => x.id === e.target.value)!;
                saveProfile({ grade: g.id as Grade, cls: g.cls });
              }}
            >
              {GRADES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="scroll hm-scroll">
        {/* 🎭 히어로 — 막이 열리는 무대 */}
        <section className="hm-hero">
          <HomeStageArt />
          <div className="hm-hero-copy">
            <h1>오늘, <span className="hm-grad">한 씬</span> 찍자.</h1>
            <p className="hm-what">짧은 장면을 <em>연기하듯</em> 해 보고, <em>씬 한 편</em>으로 모으는 곳.<br />씬 = 한 테이크로 쭉 가는 3~10분짜리 작은 이야기.</p>
            <p className="hm-ticker" key={line}>{TICKER[line]}</p>
            <Link href="/about" className="hm-about">처음이야? 30초 소개 보기 ›</Link>
          </div>
        </section>

        {/* 두 무대 — 그림 카드 */}
        <div className="hm-sec"><b>어디서 시작할까?</b><small>입구는 두 개. 어느 쪽이든 <em>씬 한 편</em>이 남아.</small></div>
        <div className="hm-tracks">
          <Link href="/situation" className="hm-track sit">
            <TrackArt kind="sit" />
            <b>🎞 상황극</b>
            <small><em>유명 장면</em> 속 주인공이 돼서 상대와 말 주고받기</small>
          </Link>
          <Link href="/inner" className="hm-track inner">
            <TrackArt kind="inner" />
            <b>🪞 내 무대</b>
            <small><em>내가 겪은 장면</em>을 세우고 진행자와 들여다보기</small>
          </Link>
        </div>

        {/* 오늘의 상황극 — 그 장면 그림 그대로 */}
        <div className="hm-sec"><b>🎞 오늘 바로 해 볼 장면</b><small>고민 말고 이거 하나. <em>매일 바뀌는</em> 순한 맛 상황극이야.</small></div>
        <Link href={`/situation/${today.id}`} className="hm-today">
          <SitArt a={today} />
          <div className="hm-today-body">
            <span className="hm-today-tag">✨ 오늘의 상황극</span>
            <b>「{today.adaptTitle}」</b>
            <small>{TASKS[today.task.kind].icon} {TASKS[today.task.kind].label} · {SPICE[today.spice].icon} · {today.minutes}분</small>
          </div>
          <span className="hm-play" aria-hidden="true">▶</span>
        </Link>

        {/* 장르 칩 — 하나씩 튀어나온다 */}
        <div className="hm-sec"><b>장르로 고르기</b><small>좋아하는 장르를 누르면 그 장르 <em>상황극 목록</em>이 나와.</small></div>
        <div className="hm-genres">
          {GENRES.filter((g) => !g.lower).map((g, i) => (
            <Link key={g.id} href={`/situation?genre=${g.id}`} className="genre-chip hm-genre" style={{ animationDelay: `${0.5 + i * 0.07}s` }} aria-label={g.label}>
              <i>{g.icon}</i>{g.label.split("·")[0]}
            </Link>
          ))}
        </div>

        {/* 🎬 내 씬 — 모은 만큼 선반에 꽂힌다 */}
        <div className="hm-sec"><b>🎬 내 씬 선반</b><small>끝낸 씬이 한 장씩 꽂혀. 골라 이으면 <em>나만의 이야기</em>가 돼.</small></div>
        <Link href={building ? `/scenes/join/${building.id}` : "/scenes"} className="hm-shelf-card">
          <div className="hm-shelf-h">
            <b>🎬 내 씬 <span className="hm-count">{pieces.length}</span></b>
            {fresh > 0 && <span className="pill" style={{ color: "var(--note)" }}>🔍 보이는 것 {fresh}</span>}
            <span className="chev">›</span>
          </div>
          <ShelfArt count={pieces.length} />
          <small>{building ? `잇는 중: 「${building.title}」 · 씬 ${building.slots.length}개` : pieces.length ? "모은 씬을 이어 붙여 봐" : "첫 씬을 찍으면 여기 꽂혀"}</small>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <button className={`chip ${profile.showAll ? "on" : ""}`} onClick={() => saveProfile({ showAll: !profile.showAll })}>
            🐣 기초반 · {profile.showAll ? "다 보는 중" : "다 보기"}
          </button>
          <Link href="/situation?genre=tragedy" className="muted" style={{ textDecoration: "none" }}>🌶🌶 진한 방 · 🔥 따로 ›</Link>
        </div>
        <p className="note">진단도 정답도 없어. 기록은 이 기기에만. 「여기까지」도 완결이야.</p>
      </div>
      <TabBar />
    </>
  );
}
