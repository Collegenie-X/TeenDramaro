"use client";

/**
 * 🎞 상황극 한 판 — 화면 3~7 (§6)
 *   card    📜 상황 카드 + 🎯 과제 카드
 *   action  🎭 액션 — 말풍선 · ✋ 컷(크게) · 🪪 칩 · 30초 칩
 *   pd      🎛 PD — 다이얼 · 🟡 새 사실 보드 · 🔎 속마음 · 🤫 귓속말 · ⚡ 돌발 · ⏪ 다시 찍기
 *   pivot   🌟 나였다면? — 빈칸 하나 · 결 칩 · 가지 여러 개
 *   lastcut 마지막 컷 — 대사 한 줄 + 지문 한 줄, 내가 쓴다
 *   reveal  🏛 원작에선… — 컷 뒤에 공개
 *   room    🎬 작가실 카드 5장(+👀 지켜본 사람의 눈) → [한 테이크 더] [서랍으로]
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Feed from "@/components/Feed";
import Composer from "@/components/Composer";
import DialPanel from "@/components/DialPanel";
import SceneHeader from "@/components/SceneHeader";
import PopDock, { type DockItem } from "@/components/PopDock";
import { GUIDE, buildGuide, pathIndex, pathOf, type GuideAction } from "@/lib/guide";
import { SitArt } from "@/components/SituationArt";
import { CastCard, castLooks } from "@/components/CastArt";
import SafetySheet from "@/components/SafetySheet";
import Sheet from "@/components/Sheet";
import { askAI, type AiResult } from "@/lib/ai";
import { INNER, pick } from "@/lib/data";
import { castOf, freshImprov, improvReply, nextState, turnsOf, type Aside, type ImprovState } from "@/lib/improv";
import { DEFAULT_DIALS, DIALS, PIVOT_TONES, SPICE, TASKS, WORK_KINDS, genreOf, lengthOf, originLabel } from "@/lib/meta";
import { blankPiece, finishPiece } from "@/lib/pieces";
import { checkSafety, type SafetyLevel } from "@/lib/safety";
import { getArchetype, getPiece, logRevision, uid } from "@/lib/store";
import { useQuery, withWork } from "@/lib/useQuery";
import { josa } from "@/lib/text";
import type { Archetype, Beat, Dials, LastCut, PdLog, Take } from "@/lib/types";

type Phase = "card" | "action" | "pd" | "pivot" | "lastcut" | "reveal" | "room";

const beat = (who: Beat["who"], text: string, extra: Partial<Beat> = {}): Beat => ({ id: uid("b"), who, text, ...extra });
/** 📜 · 👀 — 엔진이 돌려준 곁가지를 비트로 */
const asideBeat = (x: Aside): Beat =>
  x.kind === "event" ? beat("system", x.text) : x.kind === "watch" ? beat("watch", x.text, { by: x.by }) : beat("other", x.text, { dir: x.dir, by: x.by });

export default function SituationPlay() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [q, qReady] = useQuery();
  const [arch, setArch] = useState<Archetype | null | undefined>(undefined);

  const [phase, setPhase] = useState<Phase>("card");
  const [beats, setBeats] = useState<Beat[]>([]);
  const [doneTakes, setDoneTakes] = useState<Take[]>([]);     // 이번 판에서 접은 테이크
  const [prevTakes, setPrevTakes] = useState<Take[]>([]);     // 서랍에서 「한 테이크 더」로 왔으면 이미 있던 테이크
  const [dials, setDials] = useState<Dials>(DEFAULT_DIALS);
  const [dialsAtStart, setDialsAtStart] = useState<Dials>(DEFAULT_DIALS);
  const [imp, setImp] = useState<ImprovState>(freshImprov(DEFAULT_DIALS));
  const [pdLog, setPdLog] = useState<PdLog[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [lastCut, setLastCut] = useState<LastCut>({ line: "", direction: "" });
  const [takeReason, setTakeReason] = useState<string>();
  const [cuts, setCuts] = useState(0);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<SafetyLevel | null>(null);
  const [sealed, setSealed] = useState(false);
  const [bridge, setBridge] = useState(false);
  const [retakePick, setRetakePick] = useState(false);
  const timeUpShown = useRef(false);

  useEffect(() => {
    if (!qReady) return;
    const a = getArchetype(id) ?? null;
    setArch(a);
    if (a && q.piece) {
      const p = getPiece(q.piece);
      if (p) {
        setPrevTakes(p.takes);
        setFacts(p.facts);
        const d = p.takes.at(-1)?.dials ?? DEFAULT_DIALS;
        setDials(d); setDialsAtStart(d); setImp(freshImprov(d));
      }
    }
  }, [id, q.piece, qReady]);

  // ⏱ 과제 시간 — PD 화면에선 멈춘다(씬 멈춤)
  useEffect(() => {
    if (phase !== "action" || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);
  useEffect(() => {
    if (phase === "action" && left === 0 && arch?.task.timer && !timeUpShown.current && beats.length > 1) {
      timeUpShown.current = true;
      setBeats((b) => [...b, beat("system", "⏱ 시간 다 됐어. 🌟 결정적 자리로 갈까? 더 해도 돼.")]);
    }
  }, [left, phase, arch, beats.length]);

  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => { feedRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [beats, phase]);

  const myBeats = useMemo(() => beats.filter((b) => b.who === "me"), [beats]);
  const atPivot = !!arch && imp.beat >= turnsOf(arch);
  const [guideOpen, setGuideOpen] = useState(true);

  if (arch === undefined) return <div className="track track-sit" />;
  if (arch === null) return (
    <div className="track track-sit">
      <TopBar back="/situation" title="상황극을 못 찾았어" />
      <div className="empty"><span className="big">🎞</span>없는 상황극 카드야.</div>
    </div>
  );

  const A = arch;
  const allTakeCount = prevTakes.length + doneTakes.length + 1;

  function startAction(reset = true) {
    if (reset) {
      setBeats([beat("other", A.opener.line, { dir: A.opener.dir, by: A.opener.by })]);
      setImp(freshImprov(dials));
      setBranches([]);
      setLastCut({ line: "", direction: "" });
      setPdLog([]);
      setDialsAtStart(dials);
      timeUpShown.current = false;
    }
    setLeft(A.task.timer ?? 0);
    setPhase("action");
  }

  async function send(text: string, opts: { direction: boolean }) {
    const hit = checkSafety(text);
    if (hit) { setSafety(hit.level); setSealed(true); return; }

    const mine = beat("me", text, { direction: opts.direction || undefined });
    setBeats((b) => [...b, mine]);
    setBusy(true);

    // ⭐ 추천 길 그대로 골랐으면 — 상대 대답도 대본대로
    const pi = pathIndex(A, beats);
    const step = pi >= 0 ? pathOf(A)?.steps[pi] : undefined;
    const onPath = !!step && step.me === text && !!step.dir === !!opts.direction;
    const local = improvReply(A, imp, text, { direction: opts.direction, path: onPath ? { reply: step!.reply } : undefined });
    const speaker = castOf(A).find((c) => c.name === local.by) ?? A.scene.other;
    const res: AiResult<{ line: string; dir?: string }> = local.scripted ? { kind: "offline" } : await askAI<{ line: string; dir?: string }>("improv", text, {
      me: A.scene.me.name, other: speaker, task: A.task, dials: imp.dials, whisper: imp.whisper,
      cast: castOf(A).map((c) => c.name), watchers: A.scene.watchers?.map((w) => `${w.name}${w.at ? ` (${w.at})` : ""}`),
      turn: imp.beat + 1, turns: turnsOf(A),
      recent: [...beats, mine].slice(-8).map((b) => `${b.who === "me" ? A.scene.me.name : b.who === "other" ? b.by ?? A.scene.other.name : b.who === "watch" ? `👀 ${b.by}` : b.who}: ${b.text}`),
      direction: opts.direction,
    });
    setBusy(false);
    if (res.kind === "safety") { setSafety(res.level); setSealed(true); return; }

    // 📜 arc에 정해진 턴은 대본대로, 나머지는 AI 애드립(없으면 내장 엔진)
    const reply = res.kind === "ai" && !local.scripted ? { ...local, line: res.data.line, dir: res.data.dir || local.dir } : local;
    const add: Beat[] = [beat("other", reply.line, { dir: reply.dir, by: local.by })];
    if (reply.fact) { add.push(beat("system", reply.fact, { fact: true })); setFacts((f) => (f.includes(reply.fact!) ? f : [...f, reply.fact!])); }
    add.push(...local.asides.map(asideBeat));
    const ns = nextState(imp, local);
    if (ns.beat === turnsOf(A)) add.push(beat("system", "🌟 결정적 자리에 왔어. 아래 버튼으로 넘어가도 되고, 더 놀아도 돼."));
    setImp(ns);
    setBeats((b) => [...b, ...add]);
  }

  function onIdle(chip: "패스" | "지문만" | "컷") {
    if (chip === "컷") return cut();
    if (chip === "패스") {
      const r = improvReply(A, imp, "", {});
      setBeats((b) => [...b, beat("system", "패스 — 괜찮아."), beat("other", r.line, { dir: r.dir, by: r.by })]);
    }
  }

  function cut() {
    setCuts((c) => c + 1);
    setPhase("pd");
  }

  function changeDial(key: keyof Dials, v: number) {
    const label = DIALS.find((d) => d.key === key)!.label;
    setPdLog((l) => [...l, { at: new Date().toISOString(), what: `${A.scene.other.name} ${label}`, before: String(dials[key]), after: String(v) }]);
    const nd = { ...dials, [key]: v };
    setDials(nd);
    setImp((s) => ({ ...s, dials: nd }));
  }

  function currentTake(): Omit<Take, "n"> {
    const lastMine = [...beats].reverse().find((b) => b.who === "me");
    return {
      beats, dials, branches, pdLog, reason: takeReason, createdAt: new Date().toISOString(),
      lastCut: lastCut.line ? lastCut : { line: lastMine?.text ?? "", direction: "" },
    };
  }

  /** ⏪ 다시 찍기 — 고른 비트 앞까지 들고 새 테이크. 전 테이크는 그대로 남는다 */
  function doRetake(fromIdx: number) {
    const n = prevTakes.length + doneTakes.length + 1;
    setDoneTakes((t) => [...t, { ...currentTake(), n }]);
    const kept = beats.slice(0, fromIdx);
    setBeats([...kept, beat("pd", `⏪ 테이크 ${n + 1} — 여기서부터 다시.`)]);
    setImp((s) => ({ ...s, beat: kept.filter((b) => b.who === "me").length }));
    setTakeReason(undefined);
    setBranches([]);
    setPdLog([]);
    setLastCut({ line: "", direction: "" });
    setPhase("action");
  }

  /** 🎬 작가실 → ⏪ 한 테이크 더 — 이유는 묻지 않고 바로 새 테이크 */
  function oneMoreTake() {
    const n = prevTakes.length + doneTakes.length + 1;
    setDoneTakes((t) => [...t, { ...currentTake(), n }]);
    setTakeReason(undefined);
    startAction(true);
  }

  function twist() {
    const t = pick(A.twists, beats.length + cuts);
    setBeats((b) => [...b, beat("system", `⚡ ${t}`)]);
    setPhase("action");
  }

  function buildPiece() {
    const n0 = prevTakes.length;
    const takes: Take[] = [
      ...prevTakes,
      ...doneTakes.map((t, i) => ({ ...t, n: n0 + i + 1 })),
      { ...currentTake(), n: n0 + doneTakes.length + 1 },
    ];
    const existing = q.piece ? getPiece(q.piece) : undefined;
    const base = existing ?? blankPiece({
      title: A.adaptTitle,
      source: { track: "situation", archetypeId: A.id, origin: A.custom ? "custom" : A.origin },
      scene: A.scene, task: A.task, pivot: A.pivot, takes: [], facts: [], techniques: [], spice: A.spice,
    });
    return { piece: { ...base, takes, facts: Array.from(new Set([...base.facts, ...facts])), sealed: base.sealed || sealed }, firstNew: n0 + 1 };
  }

  /** 서랍으로 — 저장 버튼 없이 자동 저장. 새 테이크마다 고친 기록 한 줄 */
  function toDrawer() {
    const { piece, firstNew } = buildPiece();
    const href = finishPiece(piece, q.work);
    piece.takes.filter((t) => t.n >= firstNew && t.n > 1).forEach((t) => {
      const prev = piece.takes.find((x) => x.n === t.n - 1);
      logRevision({
        target: { pieceId: piece.id, field: "take", label: `${piece.title} · 테이크 ${t.n}` },
        before: prev?.lastCut.line ?? "", after: t.lastCut.line, reason: t.reason ? { chip: t.reason } : undefined,
      });
    });
    piece.takes.filter((t) => t.n >= firstNew).forEach((t) => t.pdLog.forEach((l) => logRevision({
      target: { pieceId: piece.id, field: "dials", label: `${piece.title} · T${t.n} · 🎛 ${l.what}` },
      before: l.before ?? "", after: l.after ?? "",
    })));
    router.push(href);
  }

  /** 🪪 이거 내 얘긴데 — 여기까지 한 건 서랍에 넣고, 가명·장소·뼈대만 들고 내 무대로 */
  function crossToInner() {
    if (myBeats.length) {
      const { piece } = buildPiece();
      finishPiece(piece);
    }
    router.push(withWork(`/inner?from=${A.id}`, q.work));
  }

  const g = genreOf(A.genre);
  const t = TASKS[A.task.kind];

  /* 🧭 가이드 — 지금 자리에 맞는 한 줄 + 칩. 문구는 data/situation-guide.json */
  const guide = buildGuide(A, beats, { atPivot, left });
  const guideDock: DockItem[] = guide.chips.map((c) => ({ key: c.action ?? c.t, label: c.t, dir: c.dir, rec: c.rec, action: !!c.action }));
  function onGuide(it: DockItem) {
    const c = guide.chips.find((x) => (x.action ?? x.t) === it.key);
    if (!c) return;
    const act: GuideAction | undefined = c.action;
    if (act === "pivot") return setPhase("pivot");
    if (act === "cut") return cut();
    if (act === "task") {
      return setBeats((b) => [...b, beat("system", `🎯 ${t.icon} ${A.task.want}\n막는 것 — ${A.task.obstacle}${A.task.secret ? `\n비밀 — ${A.task.secret}` : ""}`)]);
    }
    void send(c.t, { direction: !!c.dir });
  }
  const mm = `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, "0")}`;

  return (
    <div className="track track-sit">
      <TopBar
        back={phase === "card" ? withWork(`/situation?genre=${A.genre}`, q.work) : undefined}
        title={`「${A.adaptTitle}」`}
        sub={`${g.icon} ${g.label} · ${originLabel(A)} · 테이크 ${allTakeCount}`}
        right={
          phase === "action" ? (
            <>
              {A.task.timer ? <span className={`pill pill-sit timer ${left <= 30 ? "low" : ""}`}>⏱ {mm}</span> : null}
            </>
          ) : phase === "pd" ? <span className="pill pill-sit">🎛 PD</span> : null
        }
      >
        {(phase === "action" || phase === "pd") && (
          <div style={{ fontSize: 11.5, color: "var(--sit)", marginTop: 6 }}>🎯 {t.icon} {A.task.want}</div>
        )}
      </TopBar>

      {/* ── 📜 상황 카드 ─────────────────────────── */}
      {phase === "card" && (
        <div className="scroll">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pill pill-sit">{g.icon} {g.label}</span>
            <span className="pill">{SPICE[A.spice].icon} {SPICE[A.spice].label}</span>
            <span className="pill">{originLabel(A)} · {A.typeName}</span>
            <span className="pill">{lengthOf(turnsOf(A)).icon} {lengthOf(turnsOf(A)).label} · 💬 {turnsOf(A)}턴</span>
          </div>
          <SitArt a={A} slug={false} />
          {A.work && (
            <div className="card work-card">
              <div className="label">{WORK_KINDS[A.work.kind].icon} 원작의 그 장면 — {A.work.title}</div>
              <p>{A.work.scene}</p>
            </div>
          )}
          <div className="card card-sit">
            <SceneHeader scene={A.scene} noCast />
          </div>
          <CastCard me={A.scene.me} other={A.scene.other} others={A.scene.others} watchers={A.scene.watchers} />
          <div className="task">
            <div className="t-h">🎯 과제 카드 · {t.icon} {t.label} — {t.acting}</div>
            <dl className="kv">
              <dt>원하는 것</dt><dd>{A.task.want}</dd>
              <dt>막는 것</dt><dd>{A.task.obstacle}</dd>
              {A.task.secret && (<><dt>비밀</dt><dd>{A.task.secret}</dd></>)}
              {A.task.timer && (<><dt>시간</dt><dd>⏱ {Math.round(A.task.timer / 60)}분</dd></>)}
              {A.task.body && (<><dt>몸 하나</dt><dd>{A.task.body}</dd></>)}
            </dl>
          </div>
          <p className="note">상대는 대사가 0줄이야. 네 말의 한 단어를 받아서 반응해.<br />막히면 ✋ 컷. 판 전체가 보이는 PD 화면으로 가.</p>
          <button className="btn btn-tone btn-block" onClick={() => startAction()}>들어가기</button>
        </div>
      )}

      {/* ── 🎭 액션 ────────────────────────────── */}
      {phase === "action" && (
        <>
          <div className="scroll" ref={feedRef}>
            <SceneHeader scene={A.scene} compact />
            <Feed beats={beats} meName={A.scene.me.name} otherName={A.scene.other.name} meLook={A.scene.me.look} otherLook={A.scene.other.look} looks={castLooks(A.scene)} />
            {busy && <div className="muted" style={{ fontSize: 12 }}>🎭 {A.scene.other.name} …</div>}
          </div>
          <Composer
            onSend={send}
            onIdle={onIdle}
            allowDirection
            disabled={busy}
            placeholder={`${josa(A.scene.me.name, "로")} 말해 봐…`}
            extra={
              <>
              {guideOpen && !sealed && (
                <div className="guide">
                  <div className="guide-h">
                    <span className="label">{GUIDE.title}</span>
                    <span className="guide-hint" key={guide.hint}>{guide.hint}</span>
                    <button className="chip guide-x" onClick={() => setGuideOpen(false)}>{GUIDE.hide}</button>
                  </div>
                  <PopDock compact items={guideDock} popKey={`${guide.stage}-${beats.length}`} disabled={busy} onPick={onGuide} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="chips" style={{ flex: 1 }}>
                  {!guideOpen && <button className="chip" onClick={() => setGuideOpen(true)}>{GUIDE.show}</button>}
                  {!sealed && <button className="chip" onClick={() => setBridge(true)}>🪪 이거 내 얘긴데</button>}
                  {(!guideOpen || sealed) && (atPivot || left === 0 && !!A.task.timer && beats.length > 1) && (
                    <button className="chip on" onClick={() => setPhase("pivot")}>🌟 결정적 자리로</button>
                  )}
                </div>
                <button className="cut" onClick={cut} aria-label="컷">✋<small>컷</small></button>
              </div>
              </>
            }
          />
        </>
      )}

      {/* ── 🎛 PD ─────────────────────────────── */}
      {phase === "pd" && (
        <div className="scroll">
          <div className="card card-sit" style={{ textAlign: "center" }}>
            <b>씬 멈췄어. 판 전체가 보여.</b>
            <p style={{ marginTop: 4 }}>상대를 바꿔 보거나, 귓속말을 넣거나, 다시 찍어도 돼.</p>
          </div>

          <div className="card">
            <div className="label">🎚 {A.scene.other.name} 다이얼</div>
            <DialPanel value={dials} was={dialsAtStart} onChange={changeDial} />
          </div>

          <div className="card">
            <div className="label">🟡 새 사실 보드</div>
            {facts.length === 0 ? <p>아직 없어. 솔직함을 올리거나 캐물으면 나와.</p> :
              <ul className="list" style={{ marginTop: 6 }}>{facts.map((f) => <li key={f}>{f}</li>)}</ul>}
          </div>

          <details className="card">
            <summary style={{ fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔎 {A.scene.others?.length ? "다들" : A.scene.other.name} 속마음 보기</summary>
            {castOf(A).map((c) => (
              <p key={c.name}>{A.scene.others?.length ? <><b>{c.name}</b><br /></> : null}원하는 것 — {c.want}<br />숨기는 것 — {c.hide}</p>
            ))}
          </details>

          <Whisper other={A.scene.other.name} value={imp.whisper} onSet={(w) => {
            setImp((s) => ({ ...s, whisper: w || undefined }));
            if (w) setPdLog((l) => [...l, { at: new Date().toISOString(), what: "🤫 귓속말", after: w }]);
          }} />

          <div className="grid2">
            <button className="btn" onClick={twist}>⚡ 돌발 하나</button>
            <button className="btn" onClick={() => setRetakePick(true)} disabled={!myBeats.length}>⏪ 다시 찍기</button>
          </div>
          <button className="btn btn-tone btn-block" onClick={() => startAction(false)}>🎬 액션</button>
          {atPivot && <button className="btn btn-block" onClick={() => setPhase("pivot")}>🌟 결정적 자리로</button>}
        </div>
      )}

      {/* ── 🌟 나였다면? ────────────────────────── */}
      {phase === "pivot" && (
        <PivotStep
          arch={A}
          rec={pathIndex(A, beats) >= 0 ? pathOf(A)?.pivot : undefined}
          before={beats.filter((b) => b.who === "me" || b.who === "other").slice(-2)}
          branches={branches}
          onBranch={(s) => { const hit = checkSafety(s); if (hit) { setSafety(hit.level); setSealed(true); return; } setBranches((b) => [...b, s]); }}
          onNext={() => { setLastCut((c) => ({ ...c, line: c.line || branches.at(-1) || "" })); setPhase("lastcut"); }}
        />
      )}

      {/* ── 마지막 컷 ───────────────────────────── */}
      {phase === "lastcut" && (
        <div className="scroll">
          <div className="card card-sit">
            <h3>🎬 마지막 컷 — 네가 쓴다</h3>
            <p>대사 한 줄 + 지문 한 줄. 이게 이 씬의 끝이야.</p>
          </div>
          {(() => {
            const rc = pathIndex(A, beats) >= 0 ? pathOf(A)?.lastCut : undefined;
            if (!rc || (lastCut.line === rc.line && lastCut.direction === rc.direction)) return null;
            return (
              <button className="rec-pick" onClick={() => setLastCut(rc)}>
                <i>⭐ 추천</i><span>「{rc.line}」</span><small>*{rc.direction}*</small>
              </button>
            );
          })()}
          <label className="field-label">대사 한 줄</label>
          <input className="field" value={lastCut.line} onChange={(e) => setLastCut({ ...lastCut, line: e.target.value })} placeholder="「…」" />
          <label className="field-label">지문 한 줄</label>
          <input className="field" value={lastCut.direction} onChange={(e) => setLastCut({ ...lastCut, direction: e.target.value })} placeholder={`${josa(A.scene.other.name, "가")} …`} />
          {branches.length > 1 && (
            <div className="chips">{branches.map((b) => <button key={b} className="chip" onClick={() => setLastCut({ ...lastCut, line: b })}>🌿 {b}</button>)}</div>
          )}
          <button className="btn btn-tone btn-block" disabled={!lastCut.line.trim()}
            onClick={() => {
              const hit = checkSafety(lastCut.line + " " + lastCut.direction);
              if (hit) { setSafety(hit.level); setSealed(true); return; }
              setPhase("reveal");
            }}>이걸로 끝</button>
        </div>
      )}

      {/* ── 🏛 원작에선… ────────────────────────── */}
      {phase === "reveal" && (
        <div className="scroll">
          <div className="card card-sit">
            <div className="label">{A.custom ? "🪞 이 상황극의 원작은" : A.work ? `${WORK_KINDS[A.work.kind].icon} 원작에선 — ${A.work.title}` : A.origin === "classic" ? `🏛 원작에선 — ${A.classicTitle}` : "🎬 이런 상황, 영화에서 많이 봤지?"}</div>
            {A.reveal.original && <p style={{ fontStyle: "italic", color: "var(--sit)", marginTop: 8 }}>“{A.reveal.original}”</p>}
            <p style={{ marginTop: 8 }}>{A.reveal.gloss}</p>
          </div>
          <div className="side">
            <div><h5>{A.custom ? "원래 장면" : "원작의 길"}</h5>{A.reveal.after.split(" — ")[0]}</div>
            <div style={{ borderColor: "#4a3816" }}><h5>🎬 네 마지막 컷</h5>「{lastCut.line}」{lastCut.direction && <><br /><i className="muted">*{lastCut.direction}*</i></>}</div>
          </div>
          <button className="btn btn-tone btn-block" onClick={() => setPhase("room")}>작가실로</button>
        </div>
      )}

      {/* ── 🎬 작가실 ───────────────────────────── */}
      {phase === "room" && (
        <WriterRoom
          arch={A} beats={beats} facts={facts} lastCut={lastCut} cuts={cuts}
          takes={allTakeCount} pdLog={[...doneTakes.flatMap((t) => t.pdLog), ...pdLog]}
          onAgain={oneMoreTake}
          onDrawer={toDrawer}
          toDrawerLabel={q.work ? "이어 붙인 씬으로" : "내 씬으로"}
        />
      )}

      {/* ── 시트들 ──────────────────────────────── */}
      {retakePick && (
        <Sheet onClose={() => setRetakePick(false)} label="다시 찍을 비트">
          <h3>⏪ 어디서부터 다시 찍을까?</h3>
          <p>고른 줄부터 새로 해. 지금 테이크는 지우지 않고 남아.</p>
          {beats.map((b, i) => b.who === "me" && (
            <button key={b.id} className="row" onClick={() => { setRetakePick(false); doRetake(i); }}>
              <span className="ic">🙋</span><div style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{b.text}</b></div><span className="chev">⏪</span>
            </button>
          ))}
        </Sheet>
      )}
      {bridge && (
        <Sheet onClose={() => setBridge(false)} label="이거 내 얘긴데">
          <h3>🪪 이거 내 얘긴데</h3>
          <p>{INNER.bridges.fromSituation}</p>
          <p className="muted" style={{ fontSize: 12 }}>넘어가는 건 장소 · 상황 뼈대 · 가명({A.scene.me.name})뿐이야. 지금까지 한 건 내 씬에 남겨 둘게.</p>
          <button className="btn btn-block" style={{ background: "var(--inner-deep)", color: "var(--inner)", borderColor: "#24405c" }} onClick={crossToInner}>🪞 가명 그대로 내 장면으로</button>
          <button className="btn btn-block btn-ghost" onClick={() => setBridge(false)}>여기서 그냥 놀래</button>
        </Sheet>
      )}
      {safety && <SafetySheet level={safety} onClose={() => { setSafety(null); router.push("/"); }} />}
    </div>
  );
}

function Whisper({ other, value, onSet }: { other: string; value?: string; onSet: (w: string) => void }) {
  const [w, setW] = useState(value ?? "");
  return (
    <div className="card">
      <div className="label">🤫 귓속말 — {other}한테만, 다음 한 비트</div>
      <div className="input-row" style={{ marginTop: 8 }}>
        <input className="field" value={w} onChange={(e) => setW(e.target.value)} placeholder="예: 갑자기 웃으면서 말 돌리기" />
        <button className="btn btn-sm" onClick={() => onSet(w.trim())}>{value ? "바꾸기" : "넣기"}</button>
      </div>
      {value && <p style={{ color: "var(--sit)" }}>다음 비트에 들어가: {value}</p>}
    </div>
  );
}

function PivotStep({
  arch, rec, before, branches, onBranch, onNext,
}: { arch: Archetype; rec?: string; before: Beat[]; branches: string[]; onBranch: (s: string) => void; onNext: () => void }) {
  const [tone, setTone] = useState<string>();
  const [text, setText] = useState("");
  return (
    <div className="scroll">
      <Feed beats={before} meName={arch.scene.me.name} otherName={arch.scene.other.name} meLook={arch.scene.me.look} otherLook={arch.scene.other.look} looks={castLooks(arch.scene)} />
      <div className="card card-sit" style={{ textAlign: "center" }}>
        <div className="label">🌟 결정적 자리</div>
        <h3 style={{ marginTop: 6 }}>{arch.pivot}</h3>
      </div>
      {rec && !branches.includes(rec) && (
        <button className="rec-pick" onClick={() => onBranch(rec)}>
          <i>⭐ 추천</i><span>「{rec}」</span>
        </button>
      )}
      <textarea className="ta" rows={2} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={tone ? `${tone} 한 줄 — ⬜` : "⬜ ________________"} />
      <div className="chips">
        {PIVOT_TONES.map((t) => <button key={t} className={`chip ${tone === t ? "on" : ""}`} onClick={() => setTone(tone === t ? undefined : t)}>{t}</button>)}
      </div>
      <button className="btn btn-block" disabled={!text.trim()} onClick={() => { onBranch(tone ? `${text.trim()}` : text.trim()); setText(""); setTone(undefined); }}>
        {branches.length ? "🌿 다른 결로 한 번 더" : "이 한 줄 놓기"}
      </button>
      {branches.length > 0 && (
        <div className="side">
          {branches.map((b, i) => <div key={i}><h5>가지 {i + 1}</h5>「{b}」</div>)}
        </div>
      )}
      <button className="btn btn-tone btn-block" disabled={!branches.length} onClick={onNext}>마지막 컷 쓰기</button>
    </div>
  );
}

/** 🎬 작가실 카드 — ✅ 살아 있는 데 · ⚠️ 한 번 더 볼 데 · 🔎 · 👀 지켜본 사람의 눈 · 🎥 PD 기록 · 🎬 같은 자리 다른 길 */
function WriterRoom({
  arch, beats, facts, lastCut, cuts, takes, pdLog, onAgain, onDrawer, toDrawerLabel,
}: {
  arch: Archetype; beats: Beat[]; facts: string[]; lastCut: LastCut; cuts: number; takes: number; pdLog: PdLog[];
  onAgain: () => void; onDrawer: () => void; toDrawerLabel: string;
}) {
  const [i, setI] = useState(0);
  const mine = beats.filter((b) => b.who === "me" && !b.direction);
  const alive = mine.reduce<Beat | null>((a, b) => (!a || b.text.length > a.text.length ? b : a), null);
  // 그 줄을 실제로 받아친 사람 — 여러 명이면 by
  const replier = (alive && beats.slice(beats.indexOf(alive) + 1).find((b) => b.who === "other")?.by) || arch.scene.other.name;
  const directions = beats.filter((b) => b.direction).length;
  const dialMoves = pdLog.filter((l) => l.before !== undefined);
  const whispers = pdLog.filter((l) => l.what.includes("귓속말")).length;

  const look =
    facts.length && !mine.some((b) => facts.some((f) => f.split(" ").some((w) => w.length > 1 && b.text.includes(w))))
      ? `🟡 「${facts[0]}」 — 이 사실이 나왔는데, 그 뒤로 그 얘기는 안 꺼냈어. 일부러였을 수도 있고.`
      : directions === 0
        ? "몸짓(지문)은 한 번도 안 썼어. 🖐 하나만 넣어도 장면이 달라져."
        : dialMoves.length === 0
          ? `${arch.scene.other.name} 다이얼은 그대로였어. PD 화면에서 상대를 바꿔 볼 수 있어.`
          : "놓친 데는 안 보여. 이번 판은 네가 끝까지 끌고 갔어.";

  const cards = [
    { h: "✅ 살아 있는 데", b: alive ? `「${alive.text}」 — 이 줄에서 ${josa(replier, "가")} 네 말을 받아쳤어.` : "이번 판은 짧았어. 짧아도 씬이야." },
    { h: "⚠️ 한 번 더 볼 데", b: look },
    { h: `🔎 ${arch.scene.other.name} 속마음`, b: `원하던 것 — ${arch.scene.other.want}\n숨기던 것 — ${arch.scene.other.hide}` },
    ...(arch.scene.watchers ?? []).slice(0, 1).map((w) => ({ h: `👀 ${w.name}의 눈`, b: w.seen })),
    { h: "🎥 PD 기록", b: [`✋ 컷 ${cuts}번 · 테이크 ${takes}`, ...dialMoves.map((l) => `🎚 ${l.what} ${l.before}→${l.after}`), whispers ? `🤫 귓속말 ${whispers}번` : ""].filter(Boolean).join("\n") },
    { h: "🎬 같은 자리, 다른 길", b: `${arch.reveal.after}\n\n네 마지막 컷 — 「${lastCut.line}」` },
  ];
  const c = cards[i];
  return (
    <div className="scroll">
      <div className="label" style={{ textAlign: "center" }}>🎬 작가실 · {i + 1} / {cards.length}</div>
      <div className="card card-sit" style={{ minHeight: 180 }}>
        <h3>{c.h}</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{c.b}</p>
      </div>
      <div className="grid2">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>‹ 앞</button>
        <button className="btn" disabled={i === cards.length - 1} onClick={() => setI(i + 1)}>다음 ›</button>
      </div>
      <div className="sep" />
      <div className="grid2">
        <button className="btn" onClick={onAgain}>⏪ 한 테이크 더</button>
        <button className="btn btn-tone" onClick={onDrawer}>🎬 {toDrawerLabel}</button>
      </div>
      <p className="note">저장 버튼은 없어. 끝내면 내 씬에 자동으로 남아.</p>
    </div>
  );
}
