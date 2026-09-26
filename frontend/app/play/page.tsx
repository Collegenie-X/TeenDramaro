"use client";

/**
 * 열린 무대 — 턴 수 제한이 없는 막(Movement) 기반 플레이.
 *
 * 고정 스크립트가 아니라, 매 비트마다 디렉터가 유저의 직전 말에서 실마리를
 * 잡아 질문과 네 갈래 방향을 새로 만든다. 유저는 언제든:
 *   · 칩을 골라 답하거나, 자기 말로 쓰거나
 *   · "이 얘기 더 할래" (스레드)로 흘린 말을 다시 펼치거나
 *   · "다른 얘기 할래" (피벗)로 방향을 통째로 바꾸거나
 *   · "다음 장면으로"로 막을 넘기거나
 *   · "이제 마무리할래"로 커튼콜로 갈 수 있다.
 *
 * 10비트에 끝나도, 100비트를 가도 구조가 무너지지 않는다.
 * 구조(막·렌즈)는 디렉터의 방향 감각일 뿐, 유저를 가두지 않는다.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StageScene from "@/components/StageScene";
import Composer from "@/components/Composer";
import Deck from "@/components/Deck";
import SafetySheet from "@/components/SafetySheet";
import CurtainCall from "@/components/CurtainCall";
import { Bubble, Typing } from "@/components/ChatBits";
import { type Step } from "@/lib/flow";
import { type Branch, type Direction, type Msg, type SceneState, type SessionState, type Thread } from "@/lib/types";
import { BRANCH_SCRIPTS } from "@/lib/branches";
import { MOVEMENTS, movementById, movementIndex, nextMovement, stageBrief, type Movement, type MovementId } from "@/lib/stage";
import { localBeat, openingDirections, pullThreads, type OpenBeat } from "@/lib/openbeat";
import { checkSafety, SESSION_LIMIT_MS } from "@/lib/safety";
import { bumpSessionCount, dailyLimitReached, resetSessionCount, saveStory } from "@/lib/store";
import { CARDS, type TarotCard } from "@/lib/cards";
import { feelingEmoji } from "@/lib/emotions";
import GroundingSheet from "@/components/GroundingSheet";
import { DEMO_PACE } from "@/lib/demo";

let seq = 0;
const uid = () => `m${++seq}`;
let tseq = 0;
const tid = () => `t${++tseq}`;

/** 커튼콜 뒤 재도전 분기(기존 Step 스크립트)를 돌릴 때만 쓴다 */
type Ctx = { b: Exclude<Branch, "newcard">; steps: Step[]; i: number } | null;

const freshSession = (): SessionState => ({
  id: `s${Date.now()}`,
  createdAt: Date.now(),
  turn: 1,
  character: { name: "", profile: "" },
  cardId: null,
  other: { name: "", trigger: "" },
  answers: {},
  branchAnswers: {},
  firstResponse: "",
  replayResponse: "",
  coreFeeling: "",
  emotionFlow: [],
  feelings: [],
  messages: [],
  scene: { backdrop: "curtain", light: 1, mood: "flat", mask: 1, chain: 0, other: false, card: "none" },
  done: false,
  branchesUsed: [],
  movement: "casting",
  beats: 0,
  threads: [],
});

type Await = "none" | "input" | "confirm" | "draw" | "curtain";

/** 막 진입 직후 첫 입력이 저장될 필드 */
const FIRST_FIELD: Partial<Record<MovementId, "characterName" | "firstResponse" | "coreFeeling" | "otherName" | "replayResponse">> = {
  casting: "characterName",
  open: "firstResponse",
  deepen: "coreFeeling",
  meet: "otherName",
  mirror: "coreFeeling",
  replay: "replayResponse",
};

export default function Play() {
  const router = useRouter();
  const [s, setS] = useState<SessionState>(freshSession);
  const [mv, setMv] = useState<Movement>(MOVEMENTS[0]);
  const [beats, setBeats] = useState(0);
  const [ctx, setCtx] = useState<Ctx>(null);
  const [wait, setWait] = useState<Await>("none");
  const [busy, setBusy] = useState(false);
  const [safety, setSafety] = useState<"crisis" | "abuse" | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [ground, setGround] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  /** 지금 비트의 방향 칩과, 이 비트가 쓴 렌즈 (mirrorsTo 반영용) */
  const [dirs, setDirs] = useState<Direction[]>([]);
  const [beatLens, setBeatLens] = useState<string>("");
  /** 이미 쓴 오프라인 질문 id — 같은 질문을 두 번 하지 않는다 */
  const usedQ = useRef<string[]>([]);
  /** 디렉터가 이미 던진 질문 원문 — AI에게 "겹치지 마라"를 알려준다 */
  const askedQ = useRef<string[]>([]);
  /** 마지막 비트가 다음 막을 제안했는가 */
  const [nextReady, setNextReady] = useState(false);

  /* ── 데모 모드 (/play?demo=1) ───────────────── */
  const [demo, setDemo] = useState(false);
  const [demoNote, setDemoNote] = useState("");
  const demoRef = useRef(false);
  const autoKey = useRef("");
  const [autofill, setAutofill] = useState<{ text: string; chip?: string; feels?: string[]; nonce: number }>();

  /* ── 유틸 ─────────────────────────────────── */
  const push = useCallback((m: Omit<Msg, "id">, scene?: SceneState) => {
    const msg: Msg = { ...m, id: uid() };
    setS((p) => ({ ...p, messages: [...p.messages, msg], scene: scene ?? p.scene }));
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const ask = useCallback(async (kind: string, input: string, snapshot: SessionState, note?: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/director", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, input, session: snapshot, note }),
      });
      const j = await r.json();
      if (j.safety) { setSafety(j.safety); return null; }
      return j as Record<string, unknown>;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  /* ── 비트 실행 — 이 엔진의 심장 ───────────────── */
  const runBeat = useCallback(
    async (m: Movement, snap: SessionState, beatNo: number, lastUser: string, mode: "beat" | "pivot" = "beat") => {
      setWait("none");
      setDirs([]);
      setNextReady(false);

      const note = [
        stageBrief(m, snap, beatNo),
        askedQ.current.length
          ? `[이미 던진 질문 — 문장 구조를 겹치지 마라]\n${askedQ.current.slice(-6).map((q) => `  · ${q}`).join("\n")}`
          : "",
      ].filter(Boolean).join("\n");

      const out = await ask(mode, lastUser, snap, note);

      let beat: OpenBeat;
      if (out && !out.offline && typeof out.question === "string") {
        beat = {
          react: (out.react as string) ?? "",
          question: out.question as string,
          lens: (out.lens as string) ?? "free",
          threads: Array.isArray(out.threads) ? (out.threads as string[]).slice(0, 3) : [],
          directions: Array.isArray(out.directions)
            ? (out.directions as Direction[]).filter((d) => d && d.label && d.text).slice(0, 4)
            : [],
          suggestNext: Boolean(out.suggestNext),
        };
      } else {
        beat = localBeat(m, snap, beatNo, lastUser, usedQ.current);
        // 오프라인 질문은 소진 처리 — 같은 질문이 되풀이되지 않게
        const bankId = `${m.id}.${beat.lens}`;
        if (beat.lens !== "free" && !usedQ.current.includes(bankId)) usedQ.current.push(bankId);
      }

      askedQ.current.push(beat.question);

      if (beat.react) {
        await sleep(240);
        push({ role: "director", text: beat.react });
      }
      await sleep(beat.react ? 560 : 240);
      push({ role: "director", text: beat.question });

      // 유저가 흘린 말을 스레드로 쌓는다 (중복 제거)
      if (beat.threads.length) {
        setS((p) => {
          const known = new Set((p.threads ?? []).map((t) => t.text));
          const add: Thread[] = beat.threads
            .filter((t) => t && !known.has(t))
            .map((t) => ({ id: tid(), text: t, from: m.id }));
          return add.length ? { ...p, threads: [...(p.threads ?? []), ...add] } : p;
        });
      }

      setBeatLens(beat.lens);
      setDirs(beat.directions);
      setNextReady(beat.suggestNext || beatNo >= m.suggestAfter);
      setWait("input");
    },
    [ask, push]
  );

  /* ── 막 전환 ─────────────────────────────── */
  const enterMovement = useCallback(
    async (m: Movement, snap: SessionState) => {
      setWait("none");
      setMv(m);
      setBeats(0);
      setDirs([]);
      setNextReady(false);
      setS((p) => ({ ...p, movement: m.id, beats: 0 }));

      const lines = m.opening?.(snap) ?? [];
      for (let i = 0; i < lines.length; i++) {
        await sleep(i === 0 ? 300 : 620);
        push({ role: "director", text: lines[i] }, i === 0 ? m.scene(snap) : undefined);
      }

      if (m.ritual === "draw") { setWait("draw"); return; }

      if (m.ritual === "curtain") {
        const out = await ask("curtain", "", snap);
        setS((p) => ({
          ...p,
          done: true,
          title: (out?.title as string) ?? `${p.character.name}의 이야기`,
          insights: (out?.insights as string[]) ?? [],
          tomorrow: (out?.tomorrow as string) ?? "오늘 한 말 한 줄이면 충분해.",
        }));
        setWait("curtain");
        return;
      }

      if (m.ritual === "mirror") {
        const out = await ask("mirror", snap.coreFeeling || snap.firstResponse, snap);
        await sleep(260);
        push({ role: "director", text: (out?.text as string) ?? "" });
        await sleep(500);
        void runBeat(m, snap, 0, "");
        return;
      }

      if (m.ritual === "replay" && snap.other.trigger) {
        await sleep(600);
        push({ role: "other", text: snap.other.trigger, speakerName: snap.other.name }, m.scene(snap));
      }

      // casting은 오프닝이 이미 이름을 물었다 — 비트 없이 바로 입력을 연다
      if (m.id === "casting") { setWait("input"); return; }

      // 오프닝이 이미 질문을 던진 막 — 같은 질문을 또 만들지 않고 방향 칩만 붙인다
      if (m.openingLens) {
        usedQ.current.push(`${m.id}.${m.openingLens}`);
        askedQ.current.push(lines[lines.length - 1] ?? "");
        setBeatLens(m.openingLens);
        setDirs(openingDirections(m, snap));
        setNextReady(false);
        setWait("input");
        void enrichOpeningChips(m, snap, lines.join(" "));
        return;
      }

      void runBeat(m, snap, 0, "");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ask, push, runBeat]
  );

  /** AI가 있으면 오프닝 방향 칩을 세션 맥락에 맞게 갈아끼운다 (백그라운드, busy 없이) */
  const chipSeq = useRef(0);
  const enrichOpeningChips = useCallback(async (m: Movement, snap: SessionState, question: string) => {
    const tick = ++chipSeq.current;
    try {
      const r = await fetch("/api/director", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "choices", input: "", session: snap, note: `디렉터가 방금 던진 질문: ${question}` }),
      });
      const j = (await r.json()) as { choices?: { label: string; text: string }[] };
      if (tick !== chipSeq.current) return;
      if (Array.isArray(j.choices) && j.choices.length >= 3) {
        const kinds: Direction["kind"][] = ["scene", "feeling", "turn", "hold"];
        setDirs(j.choices.slice(0, 4).map((c, i) => ({ kind: kinds[i] ?? "scene", label: c.label, text: c.text })));
      }
    } catch { /* 오프라인 칩 유지 */ }
  }, []);

  const advanceMovement = useCallback(
    (snap: SessionState) => {
      const nx = nextMovement(mv.id);
      if (!nx) return;
      void enterMovement(nx, snap);
    },
    [enterMovement, mv]
  );

  /* ── 시작 ─────────────────────────────────── */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
    demoRef.current = isDemo;
    setDemo(isDemo);
    if (!isDemo) {
      if (dailyLimitReached()) { setBlocked(true); return; }
      bumpSessionCount();
    }
    const init = freshSession();
    setS(init);
    void enterMovement(MOVEMENTS[0], init);
    const t = setTimeout(() => setTimeUp(true), SESSION_LIMIT_MS);
    return () => clearTimeout(t);
  }, [enterMovement]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    const t = setTimeout(() => { el.scrollTop = el.scrollHeight; }, 380);
    return () => clearTimeout(t);
  }, [s.messages.length, wait, busy]);

  /* ── 재도전 분기 (기존 Step 스크립트 그대로) ──── */
  const runBranchStep = useCallback(
    async (st: Step, snap: SessionState, c: NonNullable<Ctx>) => {
      setWait("none");
      setCtx(c);
      const lines = st.lines(snap);
      for (let i = 0; i < lines.length; i++) {
        await sleep(i === 0 ? 260 : 620);
        push({ role: "director", text: lines[i] }, i === 0 ? st.scene(snap) : undefined);
      }
      if (st.otherLine) {
        await sleep(700);
        push({ role: "other", text: st.otherLine(snap), speakerName: st.speaker?.(snap) ?? snap.other.name }, st.scene(snap));
      }
      if (st.kind === "ask") { setDirs([]); setWait("input"); return; }
      if (st.ai === "compare") {
        const out = await ask("compare", st.aiInput?.(snap) ?? snap.replayResponse, snap, st.aiNote?.(snap));
        await sleep(200);
        push({ role: "other", text: (out?.otherLine as string) ?? "...어, 그래.", speakerName: st.speaker?.(snap) ?? snap.other.name });
        await sleep(600);
        push({ role: "director", text: (out?.text as string) ?? "" });
      }
      if (st.compare) {
        await sleep(400);
        push({ role: "director", text: "", compare: st.compare(snap) });
      }
      setWait("confirm");
    },
    [ask, push]
  );

  const advanceBranch = useCallback(
    (snap: SessionState, c: NonNullable<Ctx>) => {
      const nx = c.steps[c.i + 1];
      if (!nx) {
        void (async () => {
          await sleep(400);
          push({ role: "director", text: "여기까지 해보자. 이것도 네 이야기에 들어갔어." });
          setS((p) => ({ ...p, done: true, branchesUsed: [...new Set([...p.branchesUsed, c.b])] }));
          setCtx(null);
          setWait("curtain");
        })();
        return;
      }
      void runBranchStep(nx, snap, { ...c, i: c.i + 1 });
    },
    [push, runBranchStep]
  );

  /* ── 입력 처리 ─────────────────────────────── */
  const onSubmit = useCallback(
    async (text: string, feelings: string[] = []) => {
      const hit = checkSafety(text);
      if (hit) { setSafety(hit.level); return; }

      const next: SessionState = {
        ...s,
        messages: [...s.messages, { id: uid(), role: "user", text, feelings: feelings.length ? feelings : undefined }],
        feelings: [...new Set([...s.feelings, ...feelings])],
        emotionFlow: feelings.length ? [...s.emotionFlow, ...feelings.map(feelingEmoji)] : s.emotionFlow,
      };

      /* 분기 스크립트 안이면 기존 방식대로 */
      if (ctx) {
        const st = ctx.steps[ctx.i];
        if (st.bkey) next.branchAnswers = { ...next.branchAnswers, [st.bkey]: text };
        setS(next);
        setWait("none");
        advanceBranch(next, ctx);
        return;
      }

      /* 열린 엔진 — 렌즈의 mirrorsTo 또는 막의 첫 필드에 저장 */
      const lensDef = mv.lenses.find((l) => l.id === beatLens);
      const field = beats === 0 ? FIRST_FIELD[mv.id] : lensDef?.mirrorsTo;
      switch (field) {
        case "characterName": next.character = { ...next.character, name: text.slice(0, 12) }; break;
        case "characterProfile": next.character = { ...next.character, profile: text }; break;
        case "otherName": next.other = { ...next.other, name: text.slice(0, 12) }; break;
        case "otherTrigger": next.other = { ...next.other, trigger: text }; break;
        case "firstResponse": next.firstResponse = text; break;
        case "replayResponse": next.replayResponse = text; break;
        case "coreFeeling": next.coreFeeling = text; break;
      }
      // 프로필이 비어 있는데 casting 중이면 두 번째 답부터 프로필에 쌓는다
      if (mv.id === "casting" && beats > 0 && !field) {
        next.character = { ...next.character, profile: [next.character.profile, text].filter(Boolean).join(" · ") };
      }
      // 유저 답에서도 스레드를 줍는다
      {
        const known = new Set((next.threads ?? []).map((t) => t.text));
        const add = pullThreads(text).filter((t) => !known.has(t)).map((t) => ({ id: tid(), text: t, from: mv.id }));
        if (add.length) next.threads = [...(next.threads ?? []), ...add];
      }

      const nb = beats + 1;
      next.beats = nb;
      setS(next);
      setBeats(nb);
      setWait("none");
      setDirs([]);
      setAutofill(undefined);
      ++chipSeq.current; // 진행 중인 오프닝 칩 요청 무효화

      void runBeat(mv, next, nb, text);
    },
    [advanceBranch, beatLens, beats, ctx, mv, runBeat, s]
  );

  /* ── 유저 조종간 — 스레드 / 피벗 / 다음 막 / 마무리 ── */
  const onPullThread = useCallback(
    (t: Thread) => {
      const next: SessionState = {
        ...s,
        messages: [...s.messages, { id: uid(), role: "user", text: `"${t.text}" — 이 얘기 더 할래.` }],
        threads: (s.threads ?? []).map((x) => (x.id === t.id ? { ...x, pulled: true } : x)),
      };
      setS(next);
      const nb = beats + 1;
      setBeats(nb);
      void runBeat(mv, next, nb, t.text);
    },
    [beats, mv, runBeat, s]
  );

  const onPivot = useCallback(() => {
    const next: SessionState = {
      ...s,
      messages: [...s.messages, { id: uid(), role: "user", text: "다른 얘기 할래." }],
    };
    setS(next);
    const nb = beats + 1;
    setBeats(nb);
    void runBeat(mv, next, nb, "", "pivot");
  }, [beats, mv, runBeat, s]);

  const onNextMovement = useCallback(() => {
    push({ role: "user", text: "다음 장면으로 갈래." });
    advanceMovement(s);
  }, [advanceMovement, push, s]);

  const onFinish = useCallback(() => {
    push({ role: "user", text: "이제 마무리할래." });
    void enterMovement(movementById("curtain"), s);
  }, [enterMovement, push, s]);

  const onDraw = useCallback(
    (c: TarotCard) => {
      const next = { ...s, cardId: c.id };
      setS((p) => ({ ...p, cardId: c.id }));
      const nx = nextMovement("draw");
      if (nx) void enterMovement(nx, next);
    },
    [enterMovement, s]
  );

  const onConfirm = useCallback(() => {
    if (ctx) advanceBranch(s, ctx);
  }, [advanceBranch, ctx, s]);

  const onBranch = useCallback(
    (b: Branch) => {
      if (b === "newcard") {
        const reset: SessionState = {
          ...freshSession(),
          character: s.character,
          branchesUsed: [...new Set([...s.branchesUsed, b])],
        };
        usedQ.current = [];
        askedQ.current = [];
        setS(reset);
        void enterMovement(movementById("draw"), reset);
        return;
      }
      const script = BRANCH_SCRIPTS[b];
      setS((p) => ({ ...p, done: false }));
      void runBranchStep(script.steps[0], { ...s, done: false }, { b, steps: script.steps, i: 0 });
    },
    [enterMovement, runBranchStep, s]
  );

  const onSave = useCallback(() => {
    if (!s.cardId) return;
    saveStory({
      id: s.id,
      date: new Date(s.createdAt).toISOString().slice(0, 10),
      cardId: s.cardId,
      flippedTo: s.cardId,
      title: s.title ?? "",
      characterName: s.character.name,
      emotionFlow: s.emotionFlow,
      feelings: s.feelings,
      insights: s.insights ?? [],
      tomorrow: s.tomorrow ?? "",
      branchesUsed: s.branchesUsed,
    });
    router.push("/drawer");
  }, [router, s]);

  /* ── 데모 자동 진행 ─────────────────────────── */
  const dirsRef = useRef(dirs);
  dirsRef.current = dirs;

  useEffect(() => {
    if (!demo || busy || safety || ground || blocked) return;
    if (wait === "none" || wait === "curtain") return;

    const key = `${wait}|${ctx ? `${ctx.b}-${ctx.i}` : `${mv.id}-${beats}`}|${s.messages.length}`;
    if (autoKey.current === key) return;
    autoKey.current = key;

    let cancelled = false;
    const nap = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      if (wait === "draw") {
        await nap(DEMO_PACE.beforeDrawMs);
        if (cancelled) return;
        setDemoNote("카드를 뽑는 중");
        onDraw(CARDS[Math.floor(Math.random() * CARDS.length)]);
        return;
      }
      if (wait === "confirm") {
        setDemoNote("계속");
        await nap(DEMO_PACE.beforeConfirmMs);
        if (cancelled) return;
        onConfirm();
        return;
      }

      /* input — 충분히 머물렀으면 다음 막으로, 아니면 방향 칩을 고른다 */
      if (!ctx && nextReady && beats >= mv.suggestAfter) {
        setDemoNote("다음 장면으로");
        await nap(DEMO_PACE.beforeConfirmMs);
        if (cancelled) return;
        onNextMovement();
        return;
      }

      if (!ctx && mv.id === "casting" && beats === 0) {
        setDemoNote("이름 입력");
        setAutofill({ text: "소라", nonce: Date.now() });
        await nap(DEMO_PACE.afterPickMs);
        if (cancelled) return;
        void onSubmit("소라", []);
        return;
      }

      setDemoNote("방향을 기다리는 중");
      const deadline = Date.now() + DEMO_PACE.waitChoicesMs;
      while (!cancelled && dirsRef.current.length === 0 && Date.now() < deadline) await nap(250);
      if (cancelled) return;

      const list = dirsRef.current;
      const pick = list.length ? list[beats % list.length] : null;
      const text = pick?.text ?? "그냥 그랬어. 말로 정리가 잘 안 돼.";
      setDemoNote(pick ? `"${pick.label}" 고름` : "대본 답변 입력");
      setAutofill({ text, chip: pick?.label, nonce: Date.now() });
      await nap(DEMO_PACE.afterPickMs);
      if (cancelled) return;
      void onSubmit(text, []);
    };

    const t = setTimeout(() => void run(), DEMO_PACE.beforeAnswerMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [demo, wait, busy, safety, ground, blocked, ctx, mv, beats, nextReady, s.messages.length, onDraw, onConfirm, onNextMovement, onSubmit]);

  /* ── 렌더 ─────────────────────────────────── */
  const mvIdx = movementIndex(mv.id);
  const branchLabel = ctx ? BRANCH_SCRIPTS[ctx.b].label : null;
  const openThreads = (s.threads ?? []).filter((t) => !t.pulled).slice(-3);
  const showControls = wait === "input" && !busy && !ctx && mv.id !== "casting";

  if (blocked) {
    return (
      <>
        <header className="topbar"><div className="topbar-row"><div className="topbar-title">🎭 마음무대</div></div></header>
        <div className="scroll">
          <div className="report">
            <h2>오늘은 여기까지</h2>
            <p className="note" style={{ marginTop: 10 }}>
              하루 3회까지만 무대를 열 수 있어. 한 번에 다 꺼내지 않는 게 더 안전해서 그래.<br />
              내일 다시 와. 오늘 한 이야기는 서랍장에 있어.
            </p>
          </div>
          <button className="cta" onClick={() => router.push("/drawer")}>🗄️ 카드 서랍장 보기</button>
          <button className="cta" style={{ marginTop: 8 }} onClick={() => { resetSessionCount(); window.location.reload(); }}>
            🧪 테스트용 — 횟수 초기화하고 다시 하기
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">{branchLabel ? `🔄 ${branchLabel}` : mv.label}</div>
            <div className="topbar-sub">{branchLabel ? "재도전 무대 · 본편은 저장돼 있어" : mv.sub}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {demo ? (
              <button className="pause-btn" onClick={() => { demoRef.current = false; setDemo(false); }}>
                ⏸ 자동 진행 멈춤
              </button>
            ) : (
              <button className="pause-btn" onClick={() => setGround(true)}>🫧 잠깐 멈출래</button>
            )}
            <span className="turn-pill" style={{ marginLeft: 0 }}>
              {ctx ? `${ctx.i + 1}/${ctx.steps.length}` : `BEAT ${beats + 1}`}
            </span>
          </div>
        </div>
        <div className="acts">
          {ctx
            ? ctx.steps.map((_, i) => (
                <div key={i} className="act-seg"><i style={{ width: i <= ctx.i ? "100%" : "0%" }} /></div>
              ))
            : MOVEMENTS.map((m, i) => (
                <div key={m.id} className="act-seg">
                  <i style={{ width: i < mvIdx ? "100%" : i === mvIdx ? "55%" : "0%" }} />
                </div>
              ))}
        </div>
      </header>

      {demo && (
        <div className="demo-bar">
          🎬 데모 자동 진행 중 · {ctx ? `분기 ${ctx.i + 1}/${ctx.steps.length}` : `${mv.label} · 비트 ${beats + 1}`}
          {demoNote ? ` — ${demoNote}` : ""}
          <button className="demo-restart" onClick={() => window.location.reload()}>↻ 처음부터</button>
        </div>
      )}

      <div className="scroll" ref={scrollRef}>
        <StageScene scene={s.scene} cardId={s.cardId} protagonist={s.character.name || "?"} antagonist={s.other.name} />

        {timeUp && !s.done && (
          <div className="infer" style={{ borderColor: "#4a3a1c", background: "#1a1409" }}>
            <div className="infer-h" style={{ color: "var(--gold)" }}>⏳ 25분 지났어</div>
            <div className="infer-body">여기서 멈춰도 괜찮아. 계속하고 싶으면 계속해도 되고.</div>
          </div>
        )}

        {s.messages.map((m) => <Bubble key={m.id} m={m} />)}
        {busy && <Typing />}

        {wait === "draw" && <Deck onDraw={onDraw} />}

        {wait === "confirm" && !busy && (
          <button className="cta cta-primary" onClick={onConfirm}>계속</button>
        )}

        {wait === "curtain" && s.done && <CurtainCall s={s} onBranch={onBranch} onSave={onSave} />}
      </div>

      {wait === "input" && !busy && (
        <>
          {showControls && (openThreads.length > 0 || nextReady) && (
            <div className="helm">
              {openThreads.map((t) => (
                <button key={t.id} className="helm-chip helm-thread" onClick={() => onPullThread(t)}>
                  🧵 {t.text.length > 14 ? t.text.slice(0, 14) + "…" : t.text}
                </button>
              ))}
              <button className="helm-chip" onClick={onPivot}>🧭 다른 얘기 할래</button>
              {nextReady && (
                <>
                  <button className="helm-chip helm-next" onClick={onNextMovement}>▶ 다음 장면으로</button>
                  {mvIdx >= 3 && (
                    <button className="helm-chip helm-next" onClick={onFinish}>📖 이제 마무리할래</button>
                  )}
                </>
              )}
            </div>
          )}
          <Composer
            key={ctx ? `${ctx.b}-${ctx.i}` : `${mv.id}-${beats}`}
            placeholder={mv.id === "casting" && beats === 0 ? "예: 소라" : "네 말로 편하게 적어줘"}
            hints={[]}
            onSubmit={onSubmit}
            feelings={!(mv.id === "casting" && beats === 0)}
            choices={dirs.map((d) => ({ label: `${d.kind === "scene" ? "🎬" : d.kind === "feeling" ? "💭" : d.kind === "turn" ? "🌀" : "🫧"} ${d.label}`, text: d.text }))}
            choiceReact=""
            autofill={autofill}
          />
        </>
      )}

      {ground && <GroundingSheet onResume={() => setGround(false)} onExit={() => router.push("/drawer")} />}
      {safety && <SafetySheet level={safety} onClose={() => setSafety(null)} />}
    </>
  );
}
