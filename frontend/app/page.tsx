"use client";

/** 화면 1 · 🏠 홈 — §19 */
import Link from "next/link";
import TabBar, { useNewInsightCount } from "@/components/TabBar";
import { GENRES, GRADES, SPICE, TASKS } from "@/lib/meta";
import { todaysArchetype } from "@/lib/data";
import { loadPieces, loadProfile, loadWorks, saveProfile, useStore } from "@/lib/store";
import type { Grade } from "@/lib/types";

export default function Home() {
  const [profile] = useStore(loadProfile, { grade: "m2", cls: "chick", showAll: false });
  const [pieces] = useStore(loadPieces, []);
  const [works] = useStore(loadWorks, []);
  const fresh = useNewInsightCount();
  const today = todaysArchetype();
  const building = works.find((w) => !w.done);

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

      <div className="scroll">
        <div className="hero-stage">
          <div className="tag">MINDSCENE</div>
          <h1 className="h1">씬 하나씩 모아서,<br />내 안의 무대를 짓는다.</h1>
          <p className="lead" style={{ marginTop: 6 }}>씬은 한 테이크로 쭉 가는 작은 이야기야. 모으면 네 무대가 돼.</p>
        </div>

        {/* 🎞 상황극 무대 */}
        <section className="card card-sit track-sit" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="h2" style={{ margin: 0, color: "var(--sit)" }}>🎞 상황극 무대</div>
          <Link href={`/situation/${today.id}`} className="row" style={{ background: "#241a0a", borderColor: "#4a3816" }}>
            <span className="ic">{today.origin === "classic" ? "🏛" : "🎬"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <small style={{ marginTop: 0, color: "var(--sit)" }}>오늘의 상황극</small>
              <b>「{today.adaptTitle}」</b>
              <small>{TASKS[today.task.kind].icon} {TASKS[today.task.kind].label} · {SPICE[today.spice].icon} · {today.minutes}분</small>
            </div>
            <span className="chev">›</span>
          </Link>
          <div className="grid3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {GENRES.filter((g) => !g.lower).map((g) => (
              <Link key={g.id} href={`/situation?genre=${g.id}`} className="genre-chip" aria-label={g.label}>
                <i>{g.icon}</i>{g.label.split("·")[0]}
              </Link>
            ))}
          </div>
        </section>

        {/* 🪞 내 무대 */}
        <section className="card card-inner track-inner" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="h2" style={{ margin: 0, color: "var(--inner)" }}>🪞 내 무대</div>
          <p className="lead">「장면 하나만 세워 볼래? 진행자가 같이 있어.」</p>
          <Link href="/inner" className="btn btn-tone btn-block">시작</Link>
        </section>

        {/* 🎬 내 씬 — 두 무대에서 나온 씬이 다 여기로. 잇기 · 보이는 것도 여기 안에 */}
        <Link href={building ? `/scenes/join/${building.id}` : "/scenes"} className="row">
          <span className="ic">🎬</span>
          <div style={{ flex: 1 }}>
            <b>
              내 씬 {pieces.length}개
              {fresh > 0 && <span className="pill" style={{ color: "var(--note)", marginLeft: 6 }}>🔍 보이는 것 {fresh}</span>}
            </b>
            <small>{building ? `잇는 중: 「${building.title}」 · 씬 ${building.slots.length}개` : "씬을 모으고, 이어 붙이고, 돌아보는 곳"}</small>
          </div>
          <span className="chev">›</span>
        </Link>

        <div className="sep" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <button className={`chip ${profile.showAll ? "on" : ""}`} onClick={() => saveProfile({ showAll: !profile.showAll })}>
            🐣 기초반 · {profile.showAll ? "다 보는 중" : "다 보기"}
          </button>
          <Link href="/situation?genre=tragedy" className="muted" style={{ textDecoration: "none" }}>🌶🌶 진한 방 · 🔥 따로 ›</Link>
        </div>
        <p className="note">
          진단이나 정답은 없어. 기록은 이 기기 안에만 남아.<br />
          아무것도 안 해도 괜찮고, 「여기까지」도 완결이야.
        </p>
      </div>
      <TabBar />
    </>
  );
}
