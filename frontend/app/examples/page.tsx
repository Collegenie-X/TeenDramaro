"use client";

/**
 * 예시 무대 — 청소년이 겪는 상황 3개를 실제 플레이 화면처럼 "재생"해보는 템플릿.
 *
 * 두 가지 모드:
 *   🎮 무대 재생 — 커스텀 SVG 무대(ExampleStage) 위에서 대화가 한 비트씩
 *      진행된다. 막이 바뀌면 무대 배경·조명·가면이 같이 바뀐다. 출구 연습 구간에서는
 *      재생이 멈추고, 보는 사람이 직접 출구를 골라야 이야기가 이어진다 — 출구 3개를
 *      모두 모으는 것이 이 "게임"의 목표다.
 *   📖 전체 읽기 — 전체 흐름을 한눈에. 연출 노트 토글로 기법 해설까지.
 *
 * 흐름 데이터는 data/*.json. 이 화면은 그 JSON의 플레이어다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ExampleStage, { type StageSpec } from "@/components/ExampleStage";
import EmotionPalette from "@/components/EmotionPalette";
import EmoIcon from "@/components/EmoIcon";
import { groupOf } from "@/lib/emotions";
import { Bubble } from "@/components/ChatBits";
import { MOVEMENTS, movementById, movementIndex } from "@/lib/stage";
import { rungAt, type DepthLevel } from "@/lib/depth";
import type { Msg } from "@/lib/types";
import type { CardId } from "@/lib/cards";
import love from "@/data/legend-40.json";
import grade from "@/data/example-grade.json";
import mirror from "@/data/example-mirror.json";

type Turn = {
  turn: number;
  movement: string;
  depth: number;
  director: string;
  user: string;
  technique?: string;
  why?: string;
  /** 🎬 디렉터의 무대 지시 — 질문 앞에 붙는 지문 한 줄 */
  stage?: string;
  /** 디렉터 기법 — set | freeze | double | reverse | chair | mirror | replay */
  move?: string;
  /** 🎮 출구 선택 지점 — 재생이 멈추고 보는 사람이 고른다 */
  choice?: { id: string; label: string };
  /** 출구를 다 돈 뒤의 정리 턴 */
  wrapup?: boolean;
  /** 💥 결심의 순간 — 인생극장 분기 */
  decision?: { prompt: string; label: string; alt: { label: string; branch: { role: "director" | "user" | "other"; speakerName?: string; text: string }[] } };
  /** 이 턴의 무대 — ExampleStage가 그린다 */
  scene?: StageSpec;
};
type Example = {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  theme: string;
  legend?: boolean;
  cast: Record<string, string>;
  principles_shown?: string[];
  turns: Turn[];
};

const EXAMPLES = [love, grade, mirror] as unknown as Example[];

/** 예시별 무대 설정 — StageScene과 /play?card= 연결에 쓴다 */
const STAGE_OF: Record<string, { card: CardId; hero: string; other: string }> = {
  love: { card: "door", hero: "수민", other: "태윤" },
  grade: { card: "chain", hero: "해든", other: "엄마" },
  mirror: { card: "mirror", hero: "린", other: "단톡방" },
};

const MOVE_LABEL: Record<string, string> = {
  set: "🎬 장면 세우기", freeze: "⏸ 멈춤", double: "👥 이중자아", reverse: "🔁 역할 바꾸기",
  chair: "🪑 빈 의자", mirror: "🪞 객석에서", replay: "🎞 다시 하기",
};

const MV_LABEL: Record<string, string> = {
  intake: "접수", casting: "캐스팅", draw: "카드 뽑기", open: "펼치기", deepen: "깊이 들어가기",
  meet: "마주침", mirror: "거울", replay: "다시 해보기", curtain: "커튼콜",
};

/* ══ 🎮 무대 재생 플레이어 ═══════════════════════════ */

/**
 * 기본 단위는 "던지고-받고" 한 쌍이다. 한 프레임 = 디렉터의 말 + 작가(너)의 답.
 * ‹ › 로 테이크를 넘기면 무대도 그 장면으로 돌아간다.
 *
 * 🎮 직접 모드(기본): 매 턴 작가의 답 차례에 멈춘다. 그날의 답을 그대로 보내도
 *    되고(객관식), 다른 보기를 고르거나, 네 말로 직접 써도 된다(주관식).
 *    바꾼 답은 ✍️ 표시가 붙고, 이야기는 계속 흘러간다 — 무대니까.
 * 👀 관람 모드: 그날의 선택대로 자동 재생.
 *
 * 💥 결심의 순간 — 다른 결심을 고르면 이야기가 실제로 그쪽으로 몇 비트
 *    흘러갔다가 되감긴다. 🧩 출구 수집 — 리허설 출구를 직접 골라 모은다.
 */

type BranchMsg = { role: "director" | "user" | "other"; speakerName?: string; text: string };
type Decision = { prompt: string; label: string; alt: { label: string; branch: BranchMsg[] } };

/** 한 프레임 = 한 번의 주고받기 (분기 연출은 한 줄짜리 프레임) */
type Frame = { id: string; turn?: Turn; msgs: Msg[]; edited?: boolean };

type Gate =
  | { kind: "answer"; turn: Turn }
  | { kind: "exit" }
  | { kind: "decision"; turn: Turn; altSeen: boolean }
  | { kind: "rewind"; turn: Turn }
  | { kind: "wrap" };

function StagePlayer({ ex, onExit }: { ex: Example; onExit: () => void }) {
  const router = useRouter();
  const st = STAGE_OF[ex.id];
  const turns = ex.turns;

  const [frames, setFrames] = useState<Frame[]>([]);
  const [view, setView] = useState(0);
  const [gate, setGate] = useState<Gate | null>(null);
  const [collected, setCollected] = useState<string[]>([]);
  const [decisions, setDecisions] = useState(0);
  const [edits, setEdits] = useState(0);
  const [auto, setAuto] = useState(true);
  /** 🎮 직접 모드 — 매 턴 답 차례에 멈춘다 */
  const [hands, setHands] = useState(true);
  const [fast, setFast] = useState(false);
  const [ended, setEnded] = useState(false);
  /** 주관식 입력 */
  const [draft, setDraft] = useState("");
  /* 💗 턴마다 고른 감정 — { [turn번호]: 감정[] }, 예시별로 localStorage에 둔다 */
  const feelKey = `teendramaro:feels:${ex.id}`;
  const [feelMap, setFeelMap] = useState<Record<number, string[]>>({});
  useEffect(() => {
    try { setFeelMap(JSON.parse(localStorage.getItem(feelKey) ?? "{}")); } catch { setFeelMap({}); }
  }, [feelKey]);
  const toggleFeel = (turn: number, f: string) => setFeelMap((m) => {
    const cur = m[turn] ?? [];
    const next = { ...m, [turn]: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f] };
    if (!next[turn].length) delete next[turn];
    try { localStorage.setItem(feelKey, JSON.stringify(next)); } catch {}
    return next;
  });
  /** 🎬 연출 노트가 펼쳐진 프레임 */
  const [noteOpen, setNoteOpen] = useState<string | null>(null);

  /** 진행 커서 — 메인 흐름 */
  const ti = useRef(0);                   // turns 인덱스
  const half = useRef<"d" | "u">("d");   // 이번에 낼 것: 디렉터 or 작가
  /** 출구 구간 재생 큐 — 턴 인덱스들 */
  const segQ = useRef<number[]>([]);
  const inSeg = useRef(false);
  /** 결심 분기 재생 큐 */
  const branchQ = useRef<Msg[]>([]);
  const pendingRewind = useRef<Turn | null>(null);
  const resolved = useRef<Set<number>>(new Set());
  const altSeen = useRef<Set<number>>(new Set());
  const playedTurn = useRef<Set<number>>(new Set());
  const seq = useRef(0);

  const choiceTurns = useMemo(() => turns.filter((t) => t.choice), [turns]);
  const wrapAt = useMemo(() => turns.findIndex((t) => t.wrapup), [turns]);
  const firstChoiceAt = useMemo(() => turns.findIndex((t) => t.choice), [turns]);

  /* ── 프레임 쌓기 ── */
  const addFrame = useCallback((f: Omit<Frame, "id">) => {
    setFrames((p) => {
      setView(p.length);
      return [...p, { ...f, id: `f${++seq.current}` }];
    });
  }, []);
  const appendMsg = useCallback((m: Msg, edited?: boolean) => {
    setFrames((p) => {
      const last = p[p.length - 1];
      setView(p.length - 1);
      return [...p.slice(0, -1), { ...last, msgs: [...last.msgs, m], edited: last.edited || edited }];
    });
  }, []);

  const dirMsg = (t: Turn): Msg => ({ id: `d${++seq.current}`, role: "director", text: t.director });
  const userMsg = (text: string): Msg => ({ id: `u${++seq.current}`, role: "user", text });

  /** 출구 구간 — 선택 턴부터 다음 선택/정리 턴 직전까지의 턴 인덱스 */
  const segmentOf = useCallback((choiceId: string): number[] => {
    const begin = turns.findIndex((t) => t.choice?.id === choiceId);
    const out: number[] = [];
    for (let i = begin; i < turns.length; i++) {
      if (i !== begin && (turns[i].choice || turns[i].wrapup)) break;
      if (!playedTurn.current.has(i)) out.push(i);
    }
    return out;
  }, [turns]);

  /* ── 심장 박동 — 다음 반쪽을 낸다 ── */
  const advance = useCallback(() => {
    /* 결심 분기 재생 */
    if (branchQ.current.length > 0) {
      const m = branchQ.current.shift()!;
      addFrame({ msgs: [m] });
      if (branchQ.current.length === 0 && pendingRewind.current) {
        setGate({ kind: "rewind", turn: pendingRewind.current });
      }
      return;
    }

    /* 어느 흐름에서 턴을 꺼낼지 */
    let idx: number;
    if (inSeg.current) {
      if (segQ.current.length === 0) {
        inSeg.current = false;
        const remaining = choiceTurns.filter((t) => !collected.includes(t.choice!.id));
        setGate(remaining.length > 0 ? { kind: "exit" } : { kind: "wrap" });
        return;
      }
      idx = segQ.current[0];
    } else {
      idx = ti.current;
      if (idx >= turns.length) { setEnded(true); return; }
      const t = turns[idx];
      // 출구 선택 지점 — 디렉터가 출구를 제시하고 멈춘다
      if (t.choice && half.current === "d" && !playedTurn.current.has(idx)) {
        addFrame({ turn: t, msgs: [dirMsg(t)] });
        half.current = "u";
        setGate({ kind: "exit" });
        return;
      }
      if (t.choice && half.current === "u") { setGate({ kind: "exit" }); return; }
      // 정리 턴 — 출구를 돌기 전엔 안 연다
      if (t.wrapup && collected.length < choiceTurns.length && firstChoiceAt >= 0) {
        setGate({ kind: "wrap" });
        return;
      }
    }

    const t = turns[idx];
    if (half.current === "d") {
      addFrame({ turn: t, msgs: [dirMsg(t)] });
      half.current = "u";
      return;
    }

    /* 작가의 답 차례 */
    if (t.decision && !resolved.current.has(t.turn)) {
      setGate({ kind: "decision", turn: t, altSeen: altSeen.current.has(t.turn) });
      return;
    }
    if (hands) { setDraft(""); setGate({ kind: "answer", turn: t }); return; }
    appendMsg(userMsg(t.user));
    finishTurn(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFrame, appendMsg, choiceTurns, collected, firstChoiceAt, hands, turns]);

  const finishTurn = (idx: number) => {
    playedTurn.current.add(idx);
    half.current = "d";
    if (inSeg.current) segQ.current.shift();
    else ti.current = idx + 1;
    if (!inSeg.current && ti.current >= turns.length) setEnded(true);
  };

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  /* ── ✍️ 답하기 — 그날의 답 / 다른 보기 / 직접 쓰기 ── */
  const answer = useCallback((t: Turn, text: string, edited: boolean) => {
    setGate(null);
    appendMsg(userMsg(text), edited);
    if (edited) setEdits((e) => e + 1);
    const idx = inSeg.current ? segQ.current[0] : ti.current;
    finishTurn(idx);
    setTimeout(() => advanceRef.current(), 60);
  }, [appendMsg]);

  /* ── 💥 결심 ── */
  const decide = useCallback((t: Turn, canonical: boolean) => {
    const dec = t.decision as Decision;
    setGate(null);
    if (canonical) {
      resolved.current.add(t.turn);
      setDecisions((d) => d + 1);
      setTimeout(() => advanceRef.current(), 60);
      return;
    }
    altSeen.current.add(t.turn);
    pendingRewind.current = t;
    branchQ.current = dec.alt.branch.map((b) => ({
      id: `b${++seq.current}`, role: b.role, speakerName: b.speakerName, text: b.text,
    }));
    advanceRef.current();
  }, []);

  const rewind = useCallback((t: Turn) => {
    setGate(null);
    pendingRewind.current = null;
    addFrame({ msgs: [{ id: `rw${++seq.current}`, role: "director", text: "⏪ 되감는다… 필름이 드르륵 감기고, 무대가 아까 그 순간으로 돌아온다." }] });
    setTimeout(() => setGate({ kind: "decision", turn: t, altSeen: true }), fast ? 400 : 1100);
  }, [addFrame, fast]);

  /* ── 🧩 출구 ── */
  const pickExit = useCallback((choiceId: string) => {
    setGate(null);
    setCollected((p) => [...p, choiceId]);
    segQ.current = segmentOf(choiceId);
    inSeg.current = true;
    half.current = "d";
    // 선택 턴의 디렉터 멘트는 이미 나왔을 수 있다 — 그럼 답부터
    const first = segQ.current[0];
    if (first !== undefined && turns[first].choice?.id === choiceId) {
      const alreadyAskedIdx = frames.length && frames[frames.length - 1].turn?.turn === turns[first].turn;
      if (alreadyAskedIdx) half.current = "u";
    }
    setTimeout(() => advanceRef.current(), 60);
  }, [frames, segmentOf, turns]);

  const toWrapup = useCallback(() => {
    setGate(null);
    inSeg.current = false;
    segQ.current = [];
    ti.current = Math.max(ti.current, wrapAt);
    half.current = "d";
    // 정리부터는 관람으로 흘려보낸다 — 답은 이미 다 했다
    setHands(false);
    setTimeout(() => advanceRef.current(), 60);
  }, [wrapAt]);

  /* 자동 재생 */
  useEffect(() => {
    if (!auto || gate || ended) return;
    const t = setTimeout(() => advanceRef.current(), fast ? 300 : 1200);
    return () => clearTimeout(t);
  }, [auto, fast, gate, ended, frames]);

  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    advanceRef.current();
  }, []);

  /* 현재 프레임 → 무대 */
  const curIdx = Math.max(0, Math.min(view, frames.length - 1));
  const cur = frames[curIdx];
  const mvId = (cur?.turn?.movement ?? "casting") as never;
  const mv = movementById(mvId) ?? MOVEMENTS[0];
  const spec: StageSpec = cur?.turn?.scene ?? { bg: "spotlight", cast: [{ id: "director", emo: "smile", x: 0.5 }], caption: "디렉터의 연출 노트" };
  const mvIdx = movementIndex(mv.id);
  const remaining = choiceTurns.filter((t) => !collected.includes(t.choice!.id));
  const atLast = curIdx >= frames.length - 1;
  const touchX = useRef<number | null>(null);

  const speakerOf = (m: Msg) =>
    m.role === "user" ? "✍️ 작가(너)" : m.role === "other" ? `🎭 ${m.speakerName ?? st.other} 역` : "🎬 디렉터";

  return (
    <div className="player">
      <header className="topbar">
        <div className="topbar-row">
          <button className="pause-btn" onClick={onExit}>‹ 나가기</button>
          <div style={{ marginLeft: 8 }}>
            <div className="topbar-title">{ex.emoji} {ex.title}</div>
            <div className="topbar-sub">{MV_LABEL[mv.id]}{cur?.turn ? ` · ${cur.turn.turn}번째 턴` : ""}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className={`pause-btn${hands ? " voice-on" : ""}`} onClick={() => setHands((h) => !h)}>
              {hands ? "🎮 직접" : "👀 관람"}
            </button>
            <button className="pause-btn" onClick={() => setFast((f) => !f)}>{fast ? "⏩" : "▶"}</button>
            <button className="pause-btn" onClick={() => setAuto((a) => !a)}>{auto ? "⏸" : "▶"}</button>
          </div>
        </div>
        <div className="acts">
          {MOVEMENTS.map((m, i) => (
            <div key={m.id} className="act-seg">
              <i style={{ width: i < mvIdx ? "100%" : i === mvIdx ? "55%" : "0%" }} />
            </div>
          ))}
        </div>
      </header>

      <div className="exit-bar">
        💥 결심 {decisions} <span style={{ opacity: 0.4 }}>·</span> ✍️ 바꾼 답 {edits} <span style={{ opacity: 0.4 }}>|</span> 🧩
        {choiceTurns.map((t) => (
          <span key={t.choice!.id} className={`exit-slot${collected.includes(t.choice!.id) ? " got" : ""}`}>
            {collected.includes(t.choice!.id) ? t.choice!.label : "❓"}
          </span>
        ))}
      </div>

      <div className="player-stage">
        <ExampleStage spec={spec} />
      </div>

      {/* ‹ 던지고-받고 한 쌍 › */}
      <div
        className="reel"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx > 44) setView((v) => Math.max(0, v - 1));
          else if (dx < -44) { if (!atLast) setView((v) => v + 1); else if (!gate && !ended) advance(); }
        }}
      >
        <div className="reel-track" style={{ transform: `translateX(-${curIdx * 100}%)` }}>
          {frames.map((f) => (
            <div key={f.id} className="reel-frame">
              {f.msgs.map((m) => (
                <div key={m.id} className={`reel-pair ${m.role}`}>
                  <div className={`reel-speaker ${m.role}`}>
                    {speakerOf(m)}{m.role === "user" && f.edited ? " · ✍️ 바꾼 답" : ""}
                  </div>
                  {m.role === "director" && f.turn?.stage && m.id === f.msgs[0].id && (
                    <span className="stage-dir">{f.turn.stage}</span>
                  )}
                  <div className={`bubble ${m.role === "user" ? "b-user" : m.role === "other" ? "b-other" : "b-director"} reel-bubble`}>
                    {m.text}
                  </div>
                  {m.role === "user" && f.turn && (feelMap[f.turn.turn]?.length ?? 0) > 0 && (
                    <div className="bubble-feels">
                      {feelMap[f.turn.turn].map((x) => {
                        const g = groupOf(x);
                        return (
                          <span key={x} className="emo-picked-tag" style={g ? { background: g.tone[0], borderColor: g.tone[1], color: g.tone[2] } : undefined}>
                            {g && <EmoIcon id={g.id} size={12} />}{x}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {m.role === "director" && f.turn?.technique && m.id === f.msgs[0].id && (
                    <button
                      className={`note-chip${noteOpen === f.id ? " on" : ""}`}
                      onClick={() => setNoteOpen((n) => (n === f.id ? null : f.id))}
                    >
                      {f.turn.move ? `${MOVE_LABEL[f.turn.move] ?? "🎬"} · ` : "🎬 "}{f.turn.technique}
                    </button>
                  )}
                  {m.role === "director" && noteOpen === f.id && f.turn?.why && m.id === f.msgs[0].id && (
                    <div className="note-why">{f.turn.why}</div>
                  )}
                </div>
              ))}
              {f.msgs.length === 1 && f.turn && f.msgs[0].role === "director" && (
                <div className="reel-wait">…</div>
              )}
            </div>
          ))}
          {frames.length === 0 && <div className="reel-frame" />}
        </div>

        {gate?.kind === "decision" && (
          <div className="fate">
            <div className="fate-flash">⚡ 그래, 결심했어!</div>
            <div className="fate-prompt">{(gate.turn.decision as Decision).prompt}</div>
            <button className="fate-btn fate-a" onClick={() => decide(gate.turn, true)}>
              {(gate.turn.decision as Decision).label}
            </button>
            <button className="fate-btn fate-b" onClick={() => decide(gate.turn, false)} disabled={gate.altSeen}>
              {gate.altSeen ? "👀 이미 본 결말 — " : ""}{(gate.turn.decision as Decision).alt.label}
            </button>
          </div>
        )}

        {gate?.kind === "rewind" && (
          <div className="fate">
            <div className="fate-flash">🎞 여기까지가 그 갈래</div>
            <button className="fate-btn fate-a" onClick={() => rewind(gate.turn)}>⏪ 시간을 되감는다</button>
          </div>
        )}

        {gate?.kind === "exit" && remaining.length > 0 && !ended && (
          <div className="fate">
            <div className="fate-flash">🎭 여기서부턴 네가 연출이야</div>
            <div className="fate-prompt">{st.hero}{collected.length ? "가 이번엔" : "가"} 어느 출구로 가볼까?</div>
            {remaining.map((t) => (
              <button key={t.choice!.id} className="fate-btn fate-a" onClick={() => pickExit(t.choice!.id)}>
                {t.choice!.label}
              </button>
            ))}
            {collected.length > 0 && (
              <button className="fate-btn fate-b" onClick={toWrapup}>▶ 이 정도면 됐어 — 정리로</button>
            )}
          </div>
        )}

        {(gate?.kind === "wrap" || (gate?.kind === "exit" && remaining.length === 0)) && !ended && (
          <div className="fate">
            <div className="fate-flash">🧩 출구를 다 모았다</div>
            <button className="fate-btn fate-a" onClick={toWrapup}>📖 오늘 무대 정리 보기</button>
          </div>
        )}

        {ended && atLast && (
          <div className="fate">
            <div className="fate-flash">🎉 커튼콜</div>
            <div className="fate-prompt">
              결심 {decisions} · 바꾼 답 {edits} · 출구 {collected.length}/{choiceTurns.length}
              {"\n"}같은 카드로 시작해도 네 이야기는 전혀 다르게 흘러가.
            </div>
            <button className="fate-btn fate-a" onClick={() => router.push(`/play?card=${st.card}`)}>🎭 이 카드로 내 무대 열기</button>
          </div>
        )}
      </div>

      {/* ✍️ 답하기 — 지금 턴의 질문 아래, 흐름 안에 붙는다 */}
      {gate?.kind === "answer" && atLast && (
        <div className="fate fate-answer">
          <div className="fate-flash" style={{ fontSize: 15 }}>✍️ 네 차례야 — {st.hero}의 작가는 너니까</div>
          <button className="fate-btn fate-a" onClick={() => answer(gate.turn, gate.turn.user, false)}>
            <span className="fate-btn-inner">
              <span>💬 {gate.turn.user.length > 44 ? gate.turn.user.slice(0, 44) + "…" : gate.turn.user}</span>
              <span className="fate-arrow">›</span>
            </span>
            <span className="fate-sub">그날의 답</span>
          </button>
          {gate.turn.decision && (
            <button className="fate-btn fate-b" onClick={() => { setGate(null); decide(gate.turn, false); }}>
              <span className="fate-btn-inner">
                <span>{(gate.turn.decision as Decision).alt.label}</span>
                <span className="fate-arrow">›</span>
              </span>
              <span className="fate-sub">다른 갈래를 본다</span>
            </button>
          )}
          <div className="fate-write">
            <textarea
              className="ta" rows={2} value={draft} placeholder="아니면 네 말로 바꿔 써 — 이야기가 그쪽으로 간다"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="send" disabled={!draft.trim()} onClick={() => answer(gate.turn, draft.trim(), true)}>↑</button>
          </div>
          <EmotionPalette
            picked={feelMap[gate.turn.turn] ?? []}
            onToggle={(f) => toggleFeel(gate.turn.turn, f)}
          />
        </div>
      )}

      <div className="reel-nav">
        <button className="reel-arrow" disabled={curIdx <= 0} onClick={() => setView((v) => Math.max(0, v - 1))}>‹</button>
        <span className="reel-count">{frames.length ? curIdx + 1 : 0} / {frames.length}</span>
        <button
          className="reel-arrow"
          disabled={Boolean(gate) && atLast}
          onClick={() => { if (!atLast) setView((v) => v + 1); else if (!gate && !ended) advance(); }}
        >›</button>
      </div>
    </div>
  );
}

/* ══ 📖 전체 읽기 (기존 뷰) ═══════════════════════════ */

function Reader({ ex, onExit }: { ex: Example; onExit: () => void }) {
  const router = useRouter();
  const [notes, setNotes] = useState(false);
  let lastMv = "";
  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <button className="pause-btn" onClick={onExit}>‹ 목록</button>
          <div style={{ marginLeft: 8 }}>
            <div className="topbar-title">{ex.emoji} {ex.title}</div>
            <div className="topbar-sub">{ex.tagline}</div>
          </div>
          <button className="pause-btn" style={{ marginLeft: "auto" }} onClick={() => setNotes((n) => !n)}>
            {notes ? "🎬 대화만" : "🔍 연출 노트"}
          </button>
        </div>
      </header>

      <div className="scroll">
        <div className="ex-cast">
          <div className="ex-cast-h">등장</div>
          {Object.entries(ex.cast).map(([k, v]) => <div key={k} className="ex-cast-row">{v}</div>)}
        </div>

        {ex.turns.map((t) => {
          const head = t.movement !== lastMv ? MV_LABEL[t.movement] ?? t.movement : null;
          lastMv = t.movement;
          return (
            <div key={t.turn} className="ex-beat">
              {head && <div className="ex-act">— {head} —</div>}
              <div className="ex-turn">
                <span className="ex-n">{t.turn}</span>
                <span className="ex-depth">L{t.depth}</span>
                {t.choice && <span className="ex-depth">🧩 {t.choice.label}</span>}
              </div>
              <div className="bubble b-director">{t.director}</div>
              <div className="bubble b-user">{t.user}</div>
              {notes && (t.technique || t.why) && (
                <div className="ex-note">
                  {t.technique && <b>{t.technique}</b>}
                  {t.why && <span> — {t.why}</span>}
                </div>
              )}
            </div>
          );
        })}

        {notes && ex.principles_shown && (
          <div className="ex-cast" style={{ marginTop: 14 }}>
            <div className="ex-cast-h">이 흐름이 보여주는 것</div>
            {ex.principles_shown.map((p) => <div key={p} className="ex-cast-row">· {p}</div>)}
          </div>
        )}

        <button className="cta cta-primary" style={{ marginTop: 16 }} onClick={() => router.push(`/play?card=${STAGE_OF[ex.id].card}`)}>
          🎭 이 카드로 내 무대 열기
        </button>
      </div>
    </>
  );
}

/* ══ 목록 ═══════════════════════════════════════════ */

export default function Examples() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"play" | "read">("play");
  const ex = EXAMPLES.find((e) => e.id === open);

  if (ex && mode === "play") return <StagePlayer ex={ex} onExit={() => setOpen(null)} />;
  if (ex) return <Reader ex={ex} onExit={() => setOpen(null)} />;

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div className="topbar-left">
            <button className="topbar-back" onClick={() => router.back()} aria-label="뒤로 가기">←</button>
            <div className="topbar-info">
              <div className="topbar-title">🎬 예시 무대</div>
              <div className="topbar-sub">세 가지 상황 · 실제 화면처럼 재생돼요</div>
            </div>
          </div>
        </div>
      </header>
      <div className="scroll">
        <div className="note" style={{ marginBottom: 12 }}>
          실제로 무대가 어떻게 흘러가는지 보여주는 예시야. 재생 중간의 <b>출구 선택</b>은
          네가 직접 골라 — 출구를 다 모으면 정리가 열려.
        </div>
        {EXAMPLES.map((e) => (
          <div key={e.id} className="ex-card" style={{ cursor: "pointer" }} onClick={() => { setMode("read"); setOpen(e.id); }}>
            <div className="ex-emoji">{e.emoji}</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div className="ex-title">
                {e.title}
                {e.legend && <span className="ex-badge">전설의 40턴</span>}
              </div>
              <div className="ex-tag">{e.tagline}</div>
              <div className="ex-meta">{e.theme} · {e.turns.length}턴</div>
              <div className="ex-actions">
                <button className="choice-chip" onClick={(ev) => { ev.stopPropagation(); setMode("play"); setOpen(e.id); }}>🎮 무대로 재생</button>
                <button className="helm-chip" onClick={(ev) => { ev.stopPropagation(); setMode("read"); setOpen(e.id); }}>📖 전체 읽기</button>
              </div>
            </div>
          </div>
        ))}
        <button className="cta" style={{ marginTop: 14 }} onClick={() => router.push("/play")}>
          🎭 내 무대 바로 열기
        </button>
      </div>
    </>
  );
}
