"use client";

/**
 * ✨ 소개 — 마음무대 /about 과 같은 「스테이지 스토리 스크롤」 형식
 * 문구는 data/about.json, 삽화는 components/AboutArt.tsx
 *
 * 위에 붙는 목차는 두 줄:
 *   큰 주제 — 01 씬 · 02 두 무대 · … (지금 읽는 스테이지가 켜진다)
 *   작은 주제 — 지금 스테이지 안의 소제목 (지금 읽는 소제목이 켜진다)
 */
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import TabBar from "@/components/TabBar";
import about from "@/data/about.json";
import { SAFETY } from "@/lib/safety";
import {
  AdaptArt, BridgeArt, CurtainCallArt, Glyph, HeroArt, InnerStepsArt, JourneyRing, SpiceArt, StoryArcArt, TruthArt,
  PieceAnatomy, PrivacyArt, PromiseArt, SafetyArt, SceneOneArt, SeenArt, StoryRoadArt, TakeArt, TwoStagesArt,
} from "@/components/AboutArt";

const a = about;
type StageId = keyof typeof a.stages;
const S = a.stages;
/** 목차 순서대로 — 번호 · 라벨 · 소제목만 쓰는 곳에서 */
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

function Stage({ id, active, children }: { id: StageId; active: number; children: ReactNode }) {
  const i = ORDER.findIndex((o) => o.id === id);
  const s = ORDER[i];
  const on = active === i;
  return (
    <section className={`ab-stage${on ? " on" : ""}`} id={`stage-${s.id}`} data-stage={i}>
      <div className="rv">
        <div className="ab-no">{NO(i)}</div>
        <span className="ab-label">STAGE {NO(i)} · {s.label}</span>
        <h2>{rich(s.title)}</h2>
      </div>
      <p className="rv">{rich(s.lead)}</p>
      {children}
    </section>
  );
}

/** 작은 주제 앵커 — 목차 둘째 줄이 이 위치를 따라간다 */
function Sub({ id, label, children }: { id: string; label?: string; children: ReactNode }) {
  return (
    <div className="ab-sub" id={`sub-${id}`} data-sub={id}>
      {label && <div className="ab-sub-h rv"><span />{label}</div>}
      {children}
    </div>
  );
}

function Cap({ children }: { children: ReactNode }) {
  return <div className="scene-cap">{children}</div>;
}

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  /** 지금 읽는 스테이지 (-1 = 아직 히어로) · 소제목 id */
  const [active, setActive] = useState(-1);
  const [activeSub, setActiveSub] = useState("");

  /*
   * 스크롤 등장 + 지금 읽는 스테이지/소제목 추적 — 마음무대 /about 과 같은 방식.
   * SSR에선 전부 보이고, 첫 페인트 전에 화면 아래쪽만 감췄다가 올라오면 켠다.
   */
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const stages = Array.from(root.querySelectorAll<HTMLElement>(".ab-stage"));
    const subs = Array.from(root.querySelectorAll<HTMLElement>(".ab-sub"));
    let pending = Array.from(root.querySelectorAll<HTMLElement>(".rv"));

    const check = () => {
      const box = root.getBoundingClientRect();
      const limit = box.bottom - 28;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > limit) return true;
        el.classList.add("in");
        return false;
      });
      // 두 줄 목차 바로 아래를 지난 마지막 스테이지 · 소제목
      const mark = box.top + 120;
      let cur = -1;
      stages.forEach((s, i) => { if (s.getBoundingClientRect().top <= mark) cur = i; });
      let sub = "";
      subs.forEach((s) => { if (s.getBoundingClientRect().top <= mark + 40) sub = s.dataset.sub ?? ""; });
      // 맨 끝까지 내리면 마지막 소제목
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4 && subs.length) sub = subs[subs.length - 1].dataset.sub ?? sub;
      setActive(cur);
      setActiveSub(sub);
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
  const center = (bar: HTMLElement | null, chip: Element | null | undefined) => {
    if (!bar || !(chip instanceof HTMLElement)) return;
    bar.scrollTo({ left: Math.max(0, chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2), behavior: "smooth" });
  };
  useEffect(() => { if (active >= 0) center(indexRef.current, indexRef.current?.children[active]); }, [active]);
  useEffect(() => { center(subRef.current, subRef.current?.querySelector(".on")); }, [activeSub, active]);

  const scrollTo = (el: HTMLElement | null | undefined) => {
    const root = scrollRef.current;
    if (!root || !el) return;
    const top = root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - 96;
    root.scrollTo({ top, behavior: "smooth" });
  };

  const cur = active >= 0 ? ORDER[active] : null;

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
        {/* ── 히어로 ───────────────────────────── */}
        <div className="ab-hero">
          <span className="ab-badge">{a.hero.badge}</span>
          <h1>{rich(a.hero.title)}</h1>
          <p>{rich(a.hero.lead)}</p>
        </div>
        <HeroArt />
        <div className="ab-down">{a.hero.down}<i>↓</i></div>

        {/* ── 두 줄 목차 (위에 고정) ───────────────── */}
        <nav className="ab-nav" aria-label="소개 목차">
          <div className="ab-index" ref={indexRef}>
            {ORDER.map((s, i) => (
              <button key={s.id} className={active === i ? "on" : ""} aria-current={active === i ? "true" : undefined}
                onClick={() => scrollTo(document.getElementById(`stage-${s.id}`))}>
                <b>{NO(i)}</b>{s.label}
              </button>
            ))}
          </div>
          <div className="ab-subindex" ref={subRef}>
            {cur ? (
              <>
                <span className="ab-subindex-h">{NO(active)} {cur.label}</span>
                {cur.subs.map((sb) => (
                  <button key={sb.id} className={activeSub === sb.id ? "on" : ""}
                    onClick={() => scrollTo(document.getElementById(`sub-${sb.id}`))}>{sb.label}</button>
                ))}
              </>
            ) : (
              <span className="ab-subindex-h muted">위 번호를 누르면 그 무대로 가</span>
            )}
          </div>
        </nav>

        {/* ── 씬 ───────────────────────────── */}
        <Stage id="scene" active={active}>
          <Sub id="scene-one">
            <div className="rv"><SceneOneArt /><Cap>{rich(S.scene.cap)}</Cap></div>
            <p className="rv ab-p" style={{ marginTop: 6 }}>{rich(S.scene.beatsLead)}</p>
            <ol className="ab-beats rv">
              {S.scene.beats.map((b, k) => (
                <li key={b.no} className={k === S.scene.beats.length - 1 ? "end" : ""}>
                  <span className="ab-beat-no">{b.no}</span>
                  <b>{b.name}</b>
                  <small>{b.body}</small>
                </li>
              ))}
            </ol>
          </Sub>
          <Sub id="scene-paper" label={S.scene.subs[1].label}>
            <p className="rv ab-p">{rich(S.scene.paperLead)}</p>
            <div className="rv"><PieceAnatomy ex={S.scene.example} /></div>
            <ol className="ab-legend rv">
              {S.scene.parts.map((p) => (
                <li key={p.no} className={p.no === 4 ? "pivot" : ""}>
                  <span className="ab-legend-no">{p.no}</span>
                  <div><b>{p.name}</b><small>{p.body}</small></div>
                </li>
              ))}
            </ol>
          </Sub>
        </Stage>

        {/* ── 두 무대 ───────────────────────── */}
        <Stage id="tracks" active={active}>
          <Sub id="tracks-two">
            <div className="rv"><TwoStagesArt /><Cap>{rich(S.tracks.cap)}</Cap></div>
          </Sub>
          <Sub id="tracks-diff" label={S.tracks.subs[1].label}>
            <div className="ab-vs rv">
              {(["sit", "inner"] as const).map((k) => {
                const t = S.tracks[k];
                return (
                  <div key={k} className={`ab-track ab-track-${k}`}>
                    <div className="ab-track-name">{t.name}</div>
                    <div className="ab-track-line">{t.line}</div>
                    <dl>{t.rows.map(([l, b]) => <div key={l}><dt>{l}</dt><dd>{b}</dd></div>)}</dl>
                  </div>
                );
              })}
            </div>
          </Sub>
        </Stage>

        {/* ── 맛 ──────────────────────────────── */}
        <Stage id="spice" active={active}>
          <Sub id="spice-three">
            <div className="rv"><SpiceArt /><Cap>{rich(S.spice.cap)}</Cap></div>
            <div className="ab-spice rv">
              {S.spice.levels.map((l) => (
                <div key={l.key} className={`ab-spice-card ${l.key}`}>
                  <div className="ab-spice-h"><span>{l.icon}</span><b>{l.name}</b><i>{l.tag}</i></div>
                  <small>{l.body}</small>
                  <div className="ab-spice-ex">{l.ex}</div>
                  <div className="ab-spice-who">{l.who}</div>
                </div>
              ))}
            </div>
          </Sub>
          <Sub id="spice-dial" label={S.spice.subs[1].label}>
            <div className="ab-dial rv" aria-hidden="true">
              {S.spice.levels.map((l, k) => (
                <div key={l.key} className={`ab-dial-step ${l.key}${k === 0 ? " on" : ""}`}><span>{l.icon}</span>{l.name}{k === 0 && <em className="ab-dial-def">기본</em>}</div>
              ))}
            </div>
            <p className="rv ab-p">{rich(S.spice.dialLead)}</p>
          </Sub>
        </Stage>

        {/* ── 상황극 ───────────────────────── */}
        <Stage id="play" active={active}>
          <Sub id="play-adapt">
            <div className="rv"><AdaptArt /><Cap>{rich(S.play.cap)}</Cap></div>
          </Sub>
          <Sub id="play-task" label={S.play.subs[1].label}>
            <div className="task rv">
              <div className="t-h">🎞 오늘의 과제</div>
              <dl className="kv">
                {S.play.task.map(([l, b]) => <Fragment key={l}><dt>{l}</dt><dd>{b}</dd></Fragment>)}
              </dl>
            </div>
          </Sub>
          <Sub id="play-loop" label={S.play.subs[2].label}>
            <p className="rv ab-p">{rich(S.play.loopLead)}</p>
            <div className="ab-chat rv track-sit">
              {S.play.chat.map((c, i) => (
                <div key={i} className={`bub-wrap ${c.who}`}>
                  <div className="who">{c.name}</div>
                  <div className="bub">{c.text}</div>
                </div>
              ))}
              <Cap>{rich(S.play.chatCap)}</Cap>
            </div>
          </Sub>
          <Sub id="play-curtain" label={S.play.subs[3].label}>
            <p className="rv ab-p">{rich(S.play.curtainLead)}</p>
            <div className="rv"><CurtainCallArt /></div>
            <Link href={S.play.cta.href} className="btn btn-block rv" style={{ color: "var(--sit)", marginTop: 10 }}>{S.play.cta.label}</Link>
          </Sub>
        </Stage>

        {/* ── 내 무대 ───────────────────────── */}
        <Stage id="inner" active={active}>
          <Sub id="inner-steps">
            <div className="rv"><InnerStepsArt /></div>
            <div className="ab-steps3 rv">
              {S.inner.steps.map((s, i) => (
                <div key={s.name}><span className="ab-dot">{i + 1}</span><b>{s.name}</b><small>{s.body}</small></div>
              ))}
            </div>
          </Sub>
          <Sub id="inner-tech" label={S.inner.subs[1].label}>
            <div className="ab-techs rv">
              {S.inner.techs.map((t) => (
                <div key={t.name} className="ab-tech"><span>{t.icon}</span><b>{t.name}</b><small>{t.body}</small></div>
              ))}
            </div>
            <Link href={S.inner.cta.href} className="btn btn-block rv" style={{ color: "var(--inner)", marginTop: 10 }}>{S.inner.cta.label}</Link>
          </Sub>
        </Stage>

        {/* ── 다리 ─────────────────────────── */}
        <Stage id="bridges" active={active}>
          <Sub id="bridges-art">
            <div className="rv"><BridgeArt /><Cap>{rich(S.bridges.cap)}</Cap></div>
            <div className="ab-rows rv">
              {S.bridges.items.map((b, i) => (
                <div key={b.name} className="ab-row">
                  <span className={`ab-badge-n ${i === 0 ? "to-inner" : "to-sit"}`}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <b>{b.icon} {b.name} <span className="ab-dir">{b.dir}</span></b>
                    <small>{b.body}</small>
                  </div>
                </div>
              ))}
            </div>
          </Sub>
          <Sub id="bridges-lock" label={S.bridges.subs[1].label}>
            <div className="ab-lock rv"><Glyph name="lock" size={24} color="#ffcf7a" /><span>{S.bridges.lock}</span></div>
          </Sub>
        </Stage>

        {/* ── 모으기 ───────────────────────── */}
        <Stage id="pile" active={active}>
          <Sub id="pile-journey">
            <div className="rv"><JourneyRing steps={S.pile.journey} /><Cap>{rich(S.pile.journeyCap)}</Cap></div>
          </Sub>
          <Sub id="pile-join" label={S.pile.subs[1].label}>
            <p className="rv ab-p">{rich(S.pile.storyLead)}</p>
            <div className="rv"><StoryArcArt /><Cap>{rich(S.pile.storyCap)}</Cap></div>
            <ol className="ab-arc rv">
              {S.pile.storyParts.map((sp) => (
                <li key={sp.no} className={sp.name.startsWith("갈등") ? "peak" : ""}>
                  <span className="ab-arc-no">{sp.no}</span>
                  <div>
                    <b>{sp.name} <i>{sp.scenes}</i></b>
                    <small>{sp.body}</small>
                    <em className="ab-arc-ex">{sp.ex}</em>
                  </div>
                </li>
              ))}
            </ol>
            <p className="note rv" style={{ textAlign: "left" }}>{rich(S.pile.storyEnd)}</p>
            <div className="ab-sub-h rv" style={{ fontSize: 12, color: "var(--ink-dim)" }}><span />{S.pile.framesLead}</div>
            <div className="ab-frames rv">
              {S.pile.frames.map((f) => (
                <div key={f.name}><span>{f.icon}</span><b>{f.name}</b><small>{f.body}</small></div>
              ))}
            </div>
          </Sub>
          <Sub id="pile-take" label={S.pile.subs[2].label}>
            <p className="rv ab-p">{rich(S.pile.takeLead)}</p>
            <div className="rv"><TakeArt reason={S.pile.reason} /></div>
            <div className="ab-diff rv">
              <div><span>Take 1</span><del className="del">{S.pile.before}</del></div>
              <div><span>Take 2</span><mark className="add">{S.pile.after}</mark></div>
            </div>
          </Sub>
        </Stage>

        {/* ── 진심 ─────────────────────────────── */}
        <Stage id="truth" active={active}>
          <Sub id="truth-two">
            <div className="rv"><TruthArt fake={S.truth.fake} real={S.truth.real} /><Cap>{rich(S.truth.cap)}</Cap></div>
          </Sub>
          <Sub id="truth-how" label={S.truth.subs[1].label}>
            <div className="ab-rows rv">
              {S.truth.points.map((t) => (
                <div key={t.name} className="ab-row"><span className="lg">{t.icon}</span><div style={{ flex: 1 }}><b>{t.name}</b><small>{t.body}</small></div></div>
              ))}
            </div>
            <p className="rv ab-p" style={{ marginTop: 12, textAlign: "center" }}>{rich(S.truth.end)}</p>
          </Sub>
        </Stage>

        {/* ── 돌아보기 ─────────────────────── */}
        <Stage id="seen" active={active}>
          <Sub id="seen-art">
            <div className="rv"><SeenArt /><Cap>{rich(S.seen.cap)}</Cap></div>
          </Sub>
          <Sub id="seen-marks" label={S.seen.subs[1].label}>
            <div className="insight rv">
              <div className="label" style={{ color: "var(--note)" }}>🔍 보이는 것</div>
              <div className="i-text">{S.seen.line}</div>
              <div className="ab-evidence">{S.seen.evidence.map((e) => <span key={e}>{e}</span>)}</div>
              <div className="marks" aria-hidden="true">
                <button className="on" tabIndex={-1}>맞아</button>
                <button tabIndex={-1}>잘 모르겠어</button>
                <button tabIndex={-1}>아닌데</button>
              </div>
              <div className="mine">✍️ 내 말 — {S.seen.mine}</div>
            </div>
            <p className="note rv" style={{ marginTop: 10 }}>{rich(S.seen.marksLead)}</p>
          </Sub>
        </Stage>

        {/* ── 예시 ─────────────────────────── */}
        <Stage id="story" active={active}>
          <Sub id="story-road">
            <div className="rv"><StoryRoadArt /></div>
            <div className="story" style={{ marginTop: 14 }}>
              {S.story.days.map((d) => (
                <div key={d.day} className="story-step rv">
                  <span className="story-em" aria-hidden="true" />
                  <span className="story-act">{d.day}</span>
                  <b>{d.name}</b>
                  <p style={{ whiteSpace: "pre-line" }}>{d.body}</p>
                </div>
              ))}
            </div>
            <Link href={S.story.cta.href} className="btn btn-block rv" style={{ color: "#ffe27a", borderColor: "#5a4a10", marginTop: 4 }}>{S.story.cta.label}</Link>
            <p className="note rv">{S.story.cta.note}</p>
          </Sub>
        </Stage>

        {/* ── 약속 ─────────────────────────── */}
        <Stage id="promise" active={active}>
          <Sub id="promise-dir">
            <div className="rv"><PromiseArt /></div>
            <div className="ab-dodont rv">
              <div className="ab-do">
                <h4><Glyph name="check" size={16} color="#6fd39b" stroke={2.6} /> 하는 거</h4>
                <ul>{S.promise.do.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
              <div className="ab-dont">
                <h4><Glyph name="cross" size={16} color="#ff8a8a" stroke={2.6} /> 안 하는 거</h4>
                <ul>{S.promise.dont.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </div>
          </Sub>
          <Sub id="promise-app" label={S.promise.subs[1].label}>
            <div className="rv"><PrivacyArt /></div>
            <div className="ab-rows rv">
              {S.promise.app.map((p) => (
                <div key={p.name} className="ab-row"><span className="lg">{p.icon}</span><div style={{ flex: 1 }}><b>{p.name}</b><small>{p.body}</small></div></div>
              ))}
            </div>
            <p className="note rv">{a.ai}</p>
          </Sub>
          <Sub id="promise-safe" label={S.promise.subs[2].label}>
            <p className="rv ab-p">{rich(S.promise.safeLead)}</p>
            <div className="rv"><SafetyArt /></div>
            <div className="rv" style={{ display: "grid", gap: 6, marginTop: 10 }}>
              {SAFETY.messages.crisis.lines.map((l) => (
                <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}><span>{l.label}</span><b>{l.value}</b></a>
              ))}
              <p className="note">{S.promise.safeNote}</p>
            </div>
          </Sub>
        </Stage>

        {/* ── 아웃트로 ─────────────────────────── */}
        <div className="ab-outro rv">
          <h2>{rich(a.outro.title)}</h2>
          <p>{rich(a.outro.lead)}</p>
          <div className="grid2">
            <Link href={a.outro.primary.href} className="btn" style={{ color: "var(--sit)" }}>{a.outro.primary.label}</Link>
            <Link href={a.outro.secondary.href} className="btn" style={{ color: "var(--inner)" }}>{a.outro.secondary.label}</Link>
          </div>
          <Link href={a.outro.tertiary.href} className="btn btn-block btn-ghost" style={{ marginTop: 8 }}>{a.outro.tertiary.label}</Link>
        </div>
        <p className="note">{a.footer}</p>
      </div>
      <TabBar />
    </>
  );
}
