"use client";

/** 화면 2 · 🎞 장르 서랍 — 위 칸이 🥛 순한 번안, 진한 번안은 아래쪽 */
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { SitArt } from "@/components/SituationArt";
import { CastFace } from "@/components/CastArt";
import TabBar from "@/components/TabBar";
import { archetypesByGenre } from "@/lib/data";
import { GENRES, LENGTHS, SPICE, TASKS, genreOf, lengthOf, originLabel, type LengthId } from "@/lib/meta";
import { turnsOf } from "@/lib/improv";
import { loadCustom, loadProfile, saveProfile, useStore } from "@/lib/store";
import { useQuery, withWork } from "@/lib/useQuery";
import type { Archetype, Genre } from "@/lib/types";

export default function GenreDrawer() {
  const [q] = useQuery();
  const [profile] = useStore(loadProfile, { grade: "m2", cls: "chick", showAll: false });
  const [custom] = useStore(loadCustom, []);
  const genre = (q.genre as Genre) || null;
  const lower = genre ? genreOf(genre).lower : false;
  const showAll = profile.showAll || !!lower;
  const len = (q.len as LengthId) || null;
  const byLen = (a: Archetype) => !len || lengthOf(turnsOf(a)).id === len;
  const list = archetypesByGenre(genre, showAll).filter(byLen);
  const hidden = archetypesByGenre(genre, true).filter(byLen).length - list.length;
  const href = (g: Genre | null, l: LengthId | null) => {
    const p = new URLSearchParams();
    if (g) p.set("genre", g);
    if (l) p.set("len", l);
    const s = p.toString();
    return withWork(s ? `/situation?${s}` : "/situation", q.work);
  };

  return (
    <div className="track track-sit">
      <TopBar back="/" title={genre ? `${genreOf(genre).icon} ${genreOf(genre).label}` : "🎞 상황극 고르기"} sub="고전·영화에 있던 상황을 중학생 자리로" />
      <div className="scroll">
        <div className="chips-scroll">
          <Link href={href(null, len)} className={`chip ${!genre ? "on" : ""}`} style={{ textDecoration: "none" }}>전체</Link>
          {GENRES.map((g) => (
            <Link key={g.id} href={href(g.id, len)} className={`chip ${genre === g.id ? "on" : ""}`} style={{ textDecoration: "none" }}>
              {g.icon} {g.label}
            </Link>
          ))}
        </div>
        <div className="chips-scroll len-chips">
          <span className="len-h">💬 길이</span>
          <Link href={href(genre, null)} className={`chip ${!len ? "on" : ""}`} style={{ textDecoration: "none" }}>다</Link>
          {LENGTHS.map((l) => (
            <Link key={l.id} href={href(genre, l.id)} className={`chip ${len === l.id ? "on" : ""}`} style={{ textDecoration: "none" }}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>

        {lower && (
          <div className="card" style={{ fontSize: 12.5 }}>
            🌶🌶 메뉴판 아래쪽이야. 조금 진한 상황이 있어. 하다가 무거우면 언제든 ✋ 컷.
          </div>
        )}

        {list.map((a) => <ArchCard key={a.id} a={a} work={q.work} />)}

        {hidden > 0 && (
          <button className="row" onClick={() => saveProfile({ showAll: true })}>
            <span className="ic">🌶</span>
            <div style={{ flex: 1 }}><b>🌶 보통 맛 · 🌶🌶 매운 맛 {hidden}장 더 보기</b><small>기본은 🥛 순한 맛만 보여 줘</small></div>
          </button>
        )}

        {custom.length > 0 && !genre && (
          <>
            <div className="h2">🪞→🎞 내 장면에서 온 상황극</div>
            {custom.map((a) => <ArchCard key={a.id} a={a} work={q.work} />)}
          </>
        )}

        <p className="note">대사는 0줄. 상대는 네 말에 반응하며 판을 같이 끌고 가.<br />📺 🎬 📚 유명한 장면은 상황만 빌려 와 — 원작 대사는 안 써.</p>
      </div>
      <TabBar />
    </div>
  );
}

function ArchCard({ a, work }: { a: Archetype; work?: string }) {
  const g = genreOf(a.genre);
  return (
    <Link href={withWork(`/situation/${a.id}`, work)} className="card card-sit" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <SitArt a={a} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <span className="pill pill-sit">{g.icon} {g.label}</span>
        <span className="pill">{originLabel(a)}</span>
        <span className="pill">{SPICE[a.spice].icon} · {lengthOf(turnsOf(a)).icon} 💬 {turnsOf(a)}턴</span>
      </div>
      <h3 style={{ marginTop: 10 }}>「{a.adaptTitle}」</h3>
      <p>원형 · {a.typeName} — {a.skeleton}</p>
      <div className="cast-mini">
        <CastFace look={a.scene.me.look} mood="calm" size={26} />
        <span className="cast-mini-vs">⋯</span>
        <span className="cast-stack">
          {[a.scene.other, ...(a.scene.others ?? [])].slice(0, 4).map((c) => <CastFace key={c.name} look={c.look} mood="talk" size={26} />)}
        </span>
        <span>
          <b>{a.scene.me.name}</b> × <b>{a.scene.other.name}</b>{a.scene.others?.length ? <> 외 {a.scene.others.length}명</> : null}
          {a.scene.watchers?.length ? <small className="cast-eyes"> · 👀 {a.scene.watchers.map((w) => w.name).join(", ")}</small> : null}
          {a.scene.other.persona && !a.scene.others?.length && <small> — {a.scene.other.persona.tag}</small>}
        </span>
      </div>
      <p style={{ color: "var(--sit)" }}>🎯 {TASKS[a.task.kind].icon} {TASKS[a.task.kind].label} · {TASKS[a.task.kind].acting}</p>
    </Link>
  );
}
