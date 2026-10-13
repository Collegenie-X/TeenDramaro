"use client";

/**
 * ✨ 소개 — 짧고 그림 먼저. 스테이지마다 「삽화 → 큰 한 줄 → 한 문장 → 칩」
 * 문구는 data/about.json, 삽화는 components/AboutArt.tsx · HomeArt.tsx
 * 위에 붙는 목차는 큰 주제 한 줄 — 지금 읽는 스테이지가 켜진다.
 */
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import TabBar from "@/components/TabBar";
import about from "@/data/about.json";
import { SAFETY } from "@/lib/safety";
import { HeroArt, PromiseArt, SceneOneArt, SeenArt, SpiceArt, StoryArcArt, TwoStagesArt } from "@/components/AboutArt";
import { TrackArt } from "@/components/HomeArt";

const a = about;
type StageId = keyof typeof a.stages;
const S = a.stages;
const ORDER = (a.order as StageId[]).map((id) => ({ id, ...S[id] }));
const NO = (i: number) => String(i + 1).padStart(2, "0");

/** JSON의 ==강조== → 형광펜, \n → 줄바꿈 */
function rich(text: string): ReactNode {
  return text.split("\n").map((line, li, lines) => (
    <Fragment key={li}>
      {line.split(/==(.+?)==/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}
      {li < lines.length - 1 && <br />}
    </Fragment>
  ));
}

/** 그림 → 번호 · 큰 한 줄 → 한 문장 → 설명 → children(그림 칩) → 요점 세 개 */
function Stage({ id, art, active, children }: { id: StageId; art: ReactNode; active: number; children?: ReactNode }) {
  const i = ORDER.findIndex((o) => o.id === id);
  const s = ORDER[i];
  return (
    <section className={`ab-stage ax-stage${active === i ? " on" : ""}`} id={`stage-${s.id}`}>
      <div className="rv ax-art">{art}</div>
      <div className="rv ax-head">
        <span className="ab-label">{NO(i)} · {s.label}</span>
        <h2>{rich(s.title)}</h2>
        <p>{rich(s.lead)}</p>
      </div>
      <p className="rv ax-desc">{rich(s.desc)}</p>
      {children}
      <div className="ab-rows rv">
        {s.points.map((pt) => (
          <div key={pt.name} className="ab-row"><span className="lg">{pt.icon}</span><div style={{ flex: 1 }}><b>{pt.name}</b><small>{rich(pt.body)}</small></div></div>
        ))}
      </div>
    </section>
  );
}

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  /** 지금 읽는 스테이지 (-1 = 아직 히어로) */
  const [active, setActive] = useState(-1);

  /* 스크롤 등장 + 지금 스테이지 추적. SSR에선 전부 보이고, 첫 페인트 전에 아래쪽만 감춘다. */
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const stages = Array.from(root.querySelectorAll<HTMLElement>(".ab-stage"));
    let pending = Array.from(root.querySelectorAll<HTMLElement>(".rv"));

    const check = () => {
      const box = root.getBoundingClientRect();
      const limit = box.bottom - 28;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > limit) return true;
        el.classList.add("in");
        return false;
      });
      const mark = box.top + 120;
      let cur = -1;
      stages.forEach((s, i) => { if (s.getBoundingClientRect().top <= mark) cur = i; });
      setActive(cur);
    };

    root.classList.add("rv-ready");
    check();
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; check(); });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      root.classList.remove("rv-ready");
    };
  }, []);

  /** 켜진 칩이 줄 밖이면 가운데로 끌어온다 */
  useEffect(() => {
    const bar = indexRef.current;
    const chip = bar?.children[active];
    if (!bar || !(chip instanceof HTMLElement)) return;
    bar.scrollTo({ left: Math.max(0, chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2), behavior: "smooth" });
  }, [active]);

  const scrollTo = (el: HTMLElement | null) => {
    const root = scrollRef.current;
    if (!root || !el) return;
    root.scrollTo({ top: root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - 60, behavior: "smooth" });
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div className="topbar-info">
            <div className="topbar-title">{a.top.title}</div>
            <div className="topbar-sub">{a.top.sub}</div>
          </div>
        </div>
      </header>

      <div className="scroll ab-scroll" ref={scrollRef}>
        {/* ── 히어로 ── */}
        <div className="ab-hero">
          <span className="ab-badge">{a.hero.badge}</span>
          <h1>{rich(a.hero.title)}</h1>
          <p>{rich(a.hero.lead)}</p>
        </div>
        <HeroArt />
        <Link href={a.hero.cta.href} className="btn btn-block ax-cta">{a.hero.cta.label}</Link>
        <div className="ax-stats">
          {a.stats.map((st, i) => (
            <div key={st.small} style={{ animationDelay: `${0.2 + i * 0.1}s` }}><b>{st.big}</b><small>{st.small}</small></div>
          ))}
        </div>

        {/* ── 처음이라면 3단계 ── */}
        <div className="ax-start rv">
          <div className="ab-sub-h"><span />{a.start.title}</div>
          <ol>
            {a.start.steps.map((st, i) => (
              <li key={st.name}><span className="ab-dot">{i + 1}</span><div><b>{st.icon} {st.name}</b><small>{rich(st.body)}</small></div></li>
            ))}
          </ol>
        </div>

        {/* ── 목차 (위에 고정) ── */}
        <nav className="ab-nav" aria-label="소개 목차">
          <div className="ab-index" ref={indexRef}>
            {ORDER.map((s, i) => (
              <button key={s.id} className={active === i ? "on" : ""} aria-current={active === i ? "true" : undefined}
                onClick={() => scrollTo(document.getElementById(`stage-${s.id}`))}>
                <b>{NO(i)}</b>{s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* 01 씬 */}
        <Stage id="scene" active={active} art={<SceneOneArt />}>
          <div className="ax-flow rv">
            {S.scene.flow.map((f, k) => (
              <Fragment key={f.name}>
                {k > 0 && <i aria-hidden="true">→</i>}
                <span className={k === S.scene.flow.length - 1 ? "end" : ""}><b>{f.icon}</b>{f.name}</span>
              </Fragment>
            ))}
          </div>
        </Stage>

        {/* 02 두 무대 */}
        <Stage id="tracks" active={active} art={<TwoStagesArt />}>
          <div className="hm-tracks rv">
            {S.tracks.cards.map((c) => (
              <Link key={c.kind} href={c.href} className={`hm-track ${c.kind}`}>
                <TrackArt kind={c.kind as "sit" | "inner"} />
                <b>{c.name}</b>
                <small>{c.line}<br /><span className="ax-go">{c.cta}</span></small>
              </Link>
            ))}
          </div>
        </Stage>

        {/* 03 맛 */}
        <Stage id="spice" active={active} art={<SpiceArt />}>
          <div className="ax-spice rv">
            {S.spice.levels.map((l, k) => (
              <div key={l.key} className={l.key}>
                <span>{l.icon}</span><b>{l.name}</b><small>{l.ex}</small>
                {k === 0 && <em className="ab-dial-def">기본</em>}
              </div>
            ))}
          </div>
        </Stage>

        {/* 04 모으기 */}
        <Stage id="pile" active={active} art={<StoryArcArt />}>
          <div className="ax-flow rv">
            {S.pile.steps.map((st, k) => (
              <Fragment key={st}>
                {k > 0 && <i aria-hidden="true">→</i>}
                <span className={k === 2 ? "end" : ""}>{st}</span>
              </Fragment>
            ))}
          </div>
        </Stage>

        {/* 05 돌아보기 */}
        <Stage id="seen" active={active} art={<SeenArt />}>
          <div className="insight rv">
            <div className="label" style={{ color: "var(--note)" }}>🔍 보이는 것</div>
            <div className="i-text">{S.seen.line}</div>
            <div className="marks" aria-hidden="true">
              {S.seen.marks.map((m, k) => <button key={m} className={k === 0 ? "on" : ""} tabIndex={-1}>{m}</button>)}
            </div>
          </div>
        </Stage>

        {/* 06 약속 */}
        <Stage id="promise" active={active} art={<PromiseArt />}>
          <div className="ax-chips rv">
            {S.promise.chips.map((c) => <span key={c}>{c}</span>)}
          </div>
          <div className="ax-safe rv">
            <b>{S.promise.safeLead}</b>
            {SAFETY.messages.crisis.lines.map((l) => (
              <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}><span>{l.label}</span><b>{l.value}</b></a>
            ))}
            <p className="note">{S.promise.safeNote}</p>
          </div>
        </Stage>

        {/* ── 아웃트로 ── */}
        <div className="ab-outro rv">
          <h2>{rich(a.outro.title)}</h2>
          <div className="grid2">
            <Link href={a.outro.primary.href} className="btn" style={{ color: "var(--sit)" }}>{a.outro.primary.label}</Link>
            <Link href={a.outro.secondary.href} className="btn" style={{ color: "var(--inner)" }}>{a.outro.secondary.label}</Link>
          </div>
        </div>
        <p className="note">{a.ai}<br />{a.footer}</p>
      </div>
      <TabBar />
    </>
  );
}
