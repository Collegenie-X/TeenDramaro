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
import { type Branch, type Direction, type Msg, type PersonaCard, type SceneState, type SessionState, type Thread } from "@/lib/types";
import { BRANCH_SCRIPTS } from "@/lib/branches";
import { MOVEMENTS, movementById, movementIndex, nextMovement, stageBrief, type Movement, type MovementId } from "@/lib/stage";
import { localBeat, openingDirections, pullThreads, type OpenBeat } from "@/lib/openbeat";
import { nextDepth, rungAt, type DepthLevel } from "@/lib/depth";
import { checkSafety, SESSION_LIMIT_MS } from "@/lib/safety";
import { bumpSessionCount, dailyLimitReached, resetSessionCount, saveStory } from "@/lib/store";
import { CARDS, type TarotCard } from "@/lib/cards";
import { feelingEmoji } from "@/lib/emotions";
import GroundingSheet from "@/components/GroundingSheet";
import { DEMO_PACE } from "@/lib/demo";
import { useSpeaker } from "@/lib/voice";
import { patternBlock } from "@/lib/patterns";

let seq = 0;
const uid = () => `m${++seq}`;
let tseq = 0;
const tid = () => `t${++tseq}`;

/**
 * 애매한 답 감지 — "몰라", "그냥", 아주 짧은 답이 이어지면 캐묻는 대신
 * 카드 뽑기를 제안한다 (심문 → 놀이). AI의 suggestCard와 OR로 작동한다.
 */
const VAGUE = /^(몰라|모르겠|그냥|글쎄|별로|음+|어+|엄+|\.+|…+|ㅋ+|ㅎ+|ㅠ+|ㅜ+)/;
const isVague = (t: string) => {
  const x = t.trim();
  return x.length > 0 && (x.replace(/\s/g, "").length <= 5 || VAGUE.test(x));
};

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
  depth: 1,
  depthBeats: 0,
  depthMax: 1,
  depthLog: [],
});

type Await = "none" | "input" | "confirm" | "draw" | "curtain";

/**
 * 막이 열릴 때 채팅에 꽂히는 한 줄 — 지금 어떤 장면에 서 있는지 이야기로 말해준다.
 * 안내 페이지(/about)의 타임라인과 같은 말투를 쓴다.
 */
const CHAPTER_NOTE: Record<MovementId, string> = {
  casting: "무대에 서는 건 네가 아니야. 네가 만든 애가 대신 여행해. 솔직하게 만들수록 이야기가 살아나.",
  draw: "카드는 해석하려고 뽑는 게 아니야. 말문을 여는 소품이야.",
  open: "하고 싶은 얘기를 꺼내. 줄거리보다 선명한 한 컷이 중요해.",
  deepen: "사건이 아니라, 사건이 건드린 자리를 봐. 「모르겠어」도 완결된 답이야.",
  meet: "사람이 있는 장면을 세워. 상대는 악역이 아니야.",
  mirror: "네 말만 모아서 다시 읽어줄게. 틀린 데는 네가 고쳐.",
  replay: "같은 장면, 다른 선택. 이게 정답이라는 뜻은 아니야.",
  curtain: "오늘 이야기를 한 편으로 묶을게. 전부 네가 실제로 쓴 말이야.",
};

/**
 * AI가 준 깊이를 이 막의 대역 안으로, 그리고 현재 깊이에서 ±1 안으로 조인다.
 * 단계도의 절대 규칙("한 비트에 두 단 이상 움직이지 않는다")을 코드에서도 지킨다 —
 * 프롬프트로만 막으면 긴 세션에서 결국 점프가 나온다.
 */
function clampDepth(
  want: number,
  band: readonly [DepthLevel, DepthLevel],
  current: DepthLevel
): DepthLevel {
  const step = Math.max(current - 1, Math.min(current + 1, Math.round(want)));
  return Math.max(band[0], Math.min(band[1], step)) as DepthLevel;
}

/**
 * AI가 준 aux(보조자아 한 턴)를 검증한다.
 * 비어 있거나, 상대가 아직 없거나, 대사가 너무 길면 무대에 세우지 않는다 —
 * 상대가 길게 말하면 무대가 상대 것이 되고 유저는 다시 구경꾼이 된다.
 */
function readAux(out: Record<string, unknown>, s: SessionState): OpenBeat["aux"] {
  const a = out.aux as { speak?: boolean; name?: string; action?: string; line?: string } | undefined;
  const line = (a?.line ?? "").trim();
  if (!a?.speak || !line) return undefined;
  const name = (a.name || s.other.name || "").trim();
  if (!name) return undefined;
  return { name, action: (a.action ?? "").trim().slice(0, 60), line: line.slice(0, 220) };
}

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
  /** 서랍장에서 "이 카드로 무대 올리기"로 들어온 경우 — 뽑기 대신 그 카드가 등장한다 */
  const [preset, setPreset] = useState<TarotCard | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("card");
    const c = CARDS.find((x) => x.id === q);
    if (!c) return;
    setPreset(c);
    // 디렉터가 "고른 카드"라는 걸 알고 말하도록 세션에도 미리 적어둔다
    setS((p) => ({ ...p, cardId: c.id }));
  }, []);

  /** 지금 비트의 방향 칩과, 이 비트가 쓴 렌즈 (mirrorsTo 반영용) */
  const [dirs, setDirs] = useState<Direction[]>([]);
  const [beatLens, setBeatLens] = useState<string>("");
  /** 이미 쓴 오프라인 질문 id — 같은 질문을 두 번 하지 않는다 */
  const usedQ = useRef<string[]>([]);
  /** 디렉터가 이미 던진 질문 원문 — AI에게 "겹치지 마라"를 알려준다 */
  const askedQ = useRef<string[]>([]);
  /** 디렉터 수첩 — 이 세션에서 디렉터가 실제로 쓴 패턴 id (되풀이 억제) */
  const usedPat = useRef<string[]>([]);
  /** 마지막 비트가 다음 막을 제안했는가 */
  const [nextReady, setNextReady] = useState(false);
  /** 디렉터가 쉬어가자고 먼저 제안했는가 — care 신호 */
  const [careHint, setCareHint] = useState<string>("");
  /** 애매한 답이 연속으로 온 횟수 — 2번이면 카드 제안 */
  const vagueStreak = useRef(0);
  /** "카드 한 장 뽑아볼까?" 제안이 떠 있는가 */
  const [cardOffer, setCardOffer] = useState(false);
  /** 이야기 중간 카드 뽑기 진행 중 */
  const [midDraw, setMidDraw] = useState(false);

  /**
   * AI가 준 장면 뼈대(frame)와 안전 신호(care)를 세션에 반영한다.
   * frame의 빈 칸은 다음 비트에서 "그걸 물어보라"는 힌트로 브리핑에 실린다.
   */
  const setFrame = useCallback((frame: unknown, care: unknown) => {
    if (frame && typeof frame === "object") {
      const f = frame as Record<string, unknown>;
      setS((p) => ({
        ...p,
        frame: {
          where: String(f.where ?? p.frame?.where ?? ""),
          when: String(f.when ?? p.frame?.when ?? ""),
          who: Array.isArray(f.who) ? (f.who as string[]) : p.frame?.who ?? [],
          light: String(f.light ?? p.frame?.light ?? ""),
          sound: String(f.sound ?? p.frame?.sound ?? ""),
        },
      }));
    }
    const c = care as { strain?: boolean; offerPause?: boolean } | undefined;
    setCareHint(c?.offerPause ? "잠깐 멈춰도 돼" : c?.strain ? "넘어가도 돼" : "");
  }, []);

  /* ── 데모 모드 (/play?demo=1) ───────────────── */
  const [demo, setDemo] = useState(false);
  const [demoNote, setDemoNote] = useState("");
  const demoRef = useRef(false);
  const autoKey = useRef("");
  const [autofill, setAutofill] = useState<{ text: string; chip?: string; feels?: string[]; nonce: number }>();

  /** 🔊 디렉터 목소리 — 켜면 디렉터 대사를 읽어준다 */
  const voice = useSpeaker();

  /* ── 유틸 ─────────────────────────────────── */
  const push = useCallback((m: Omit<Msg, "id">, scene?: SceneState) => {
    const msg: Msg = { ...m, id: uid() };
    setS((p) => ({ ...p, messages: [...p.messages, msg], scene: scene ?? p.scene }));
    // 🔊 디렉터와 보조자아의 대사만 읽어준다 — 유저가 쓴 말은 읽지 않는다
    if (voice.on && m.text && (m.role === "director" || m.role === "other")) void voice.speak(m.text);
    // voice는 ref 기반이라 의존성에 넣으면 push가 매번 새로 만들어진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.on, voice.speak]);

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

  /**
   * 🎭 상대 인물 카드 만들기 (character.ai의 Definition).
   * 상대 이름이나 "제일 힘든 한마디"가 잡힌 직후 백그라운드로 한 번 돌린다.
   * 카드가 있어야 이후 모든 비트에서 같은 사람이 무대에 선다 — 없으면
   * 상대는 매번 "평범한 또래" 한 명으로 리셋되고, 그게 지금까지의 약함이었다.
   */
  const personaSeq = useRef(0);
  const buildPersona = useCallback(async (snap: SessionState) => {
    const tick = ++personaSeq.current;
    try {
      const r = await fetch("/api/director", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "persona", input: snap.other.trigger || snap.other.name, session: snap }),
      });
      const j = await r.json();
      const pc = j?.persona as PersonaCard | undefined;
      if (tick !== personaSeq.current || !pc?.name) return;
      setS((p) => ({ ...p, other: { ...p.other, persona: { ...pc, speech: Array.isArray(pc.speech) ? pc.speech.slice(0, 3) : [] } } }));
    } catch {
      /* 카드가 없어도 무대는 돌아간다 — 유저 말 재료로 폴백한다 */
    }
  }, []);

  /* ── 비트 실행 — 이 엔진의 심장 ───────────────── */
  const runBeat = useCallback(
    async (m: Movement, snap: SessionState, beatNo: number, lastUser: string, mode: "beat" | "pivot" = "beat") => {
      setWait("none");
      setDirs([]);
      setNextReady(false);
      setCardOffer(false);

      /* 단계도 — 유저가 방금 쓴 말이 이번 비트의 깊이를 정한다 */
      const curDepth = (snap.depth as DepthLevel) ?? m.depthStart;
      const cue =
        mode === "pivot"
          ? { level: m.depthBand[0], move: "lighter" as const, why: "피벗 — 새 화제는 깊이를 물려받지 않는다" }
          : nextDepth(curDepth, lastUser, m.depthBand, snap.depthBeats ?? 0);

      const note = [
        stageBrief(m, snap, beatNo, cue),
        patternBlock(
          {
            movement: m.id, depth: cue.level, lastUser, beatNo,
            used: usedPat.current, vagueStreak: vagueStreak.current,
            hasOther: Boolean(snap.other.name || snap.other.persona?.name),
          },
          { A: snap.character.name || "그 애", B: snap.other.name || "그 사람" }
        ),
        askedQ.current.length
          ? `[이미 던진 질문 — 문장 구조를 겹치지 마라]\n${askedQ.current.slice(-6).map((q) => `  · ${q}`).join("\n")}`
          : "",
      ].filter(Boolean).join("\n");

      const out = await ask(mode, lastUser, snap, note);

      let beat: OpenBeat;
      const q = out?.question as { text?: string; depth?: number; lens?: string } | string | undefined;
      const aiQuestion = typeof q === "string" ? q : q?.text;

      if (out && !out.offline && typeof aiQuestion === "string" && aiQuestion.trim()) {
        const r = out.react as { text?: string } | string | undefined;
        beat = {
          react: (typeof r === "string" ? r : r?.text) ?? "",
          question: aiQuestion,
          // lens는 question 안으로 옮겨졌지만 구 스키마도 받아준다
          lens: (typeof q === "object" ? q.lens : undefined) ?? (out.lens as string) ?? "free",
          threads: Array.isArray(out.threads)
            ? (out.threads as (string | { text?: string })[])
                .map((t) => (typeof t === "string" ? t : t?.text ?? ""))
                .filter(Boolean)
                .slice(0, 3)
            : [],
          directions: Array.isArray(out.directions)
            ? (out.directions as Direction[]).filter((d) => d && d.label && d.text).slice(0, 4)
            : [],
          suggestNext: Boolean(out.suggestNext),
          // AI가 준 깊이는 대역 안으로 조인다 — 두 단 점프를 막는다
          depth: clampDepth(
            (typeof q === "object" ? q.depth : undefined) ?? cue.level,
            m.depthBand,
            curDepth
          ),
          depthMove: (out.depthMove as OpenBeat["depthMove"]) ?? cue.move,
          depthWhy: cue.why,
          aux: readAux(out, snap),
          stage: typeof out.stage === "string" ? out.stage.trim().slice(0, 60) : undefined,
          move: typeof out.move === "string" ? out.move : undefined,
        };
        if (typeof out.pattern === "string" && out.pattern) usedPat.current.push(out.pattern);
        setFrame(out.frame as SessionState["frame"], out.care);
      } else {
        beat = localBeat(m, snap, beatNo, lastUser, usedQ.current);
        // 오프라인 질문은 소진 처리 — 같은 질문이 되풀이되지 않게.
        // 반드시 질문 id로 기록한다. lens는 "free"가 여러 개라 소진이 안 된다.
        if (beat.qid && !usedQ.current.includes(beat.qid)) usedQ.current.push(beat.qid);
      }

      askedQ.current.push(beat.question);

      if (beat.react) {
        await sleep(240);
        push({ role: "director", text: beat.react });
      }
      /* 🎭 보조자아가 무대에 선다 — 질문 앞에 상대가 먼저 말한다.
         사이코드라마의 엔진은 질문이 아니라 거기 서 있는 사람이다. */
      if (beat.aux) {
        await sleep(beat.react ? 620 : 300);
        push(
          { role: "other", text: beat.aux.line, action: beat.aux.action || undefined, speakerName: beat.aux.name },
          { ...snap.scene, other: true }
        );
      }
      await sleep(beat.aux ? 760 : beat.react ? 560 : 240);
      // 🎬 무대 지시는 질문 위에 지문으로 붙는다 — 디렉터가 무대를 먼저 움직이고 묻는다
      push({ role: "director", text: beat.question, action: beat.stage || undefined });

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

      /* 단계도 기록 — 같은 단에 몇 비트 머물렀는지가 다음 이동의 근거가 된다 */
      setS((p) => ({
        ...p,
        depth: beat.depth,
        depthBeats: p.depth === beat.depth ? (p.depthBeats ?? 0) + 1 : 0,
        depthMax: Math.max(p.depthMax ?? 0, beat.depth),
        depthLog: [
          ...(p.depthLog ?? []),
          { movement: m.id, level: beat.depth, move: beat.depthMove, why: beat.depthWhy },
        ].slice(-40),
      }));

      setBeatLens(beat.lens);
      setDirs(beat.directions);
      setNextReady(beat.suggestNext || beatNo >= m.suggestAfter);
      // 애매한 답이 이어지거나 AI가 제안하면 카드로 푼다 — 캐스팅 전에는 안 띄운다
      setCardOffer(
        (Boolean(out?.suggestCard) || vagueStreak.current >= 2) && m.id !== "casting"
      );
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
      // 막이 바뀌면 깊이도 그 막의 시작 단으로 리셋한다. 장면이 바뀌었으니 무대도 비운다.
      setS((p) => ({
        ...p,
        movement: m.id,
        beats: 0,
        depth: m.depthStart,
        depthBeats: 0,
        depthMax: Math.max(p.depthMax ?? 0, m.depthStart),
        frame: undefined,
      }));
      setCareHint("");

      const lines = m.opening?.(snap) ?? [];
      for (let i = 0; i < lines.length; i++) {
        await sleep(i === 0 ? 300 : 620);
        push(
          {
            role: "director",
            text: lines[i],
            chapter: i === 0 ? { act: m.label, note: CHAPTER_NOTE[m.id] } : undefined,
          },
          i === 0 ? m.scene(snap) : undefined
        );
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

      /* 🎭 리플레이는 상대가 다시 서는 자리다. 저장된 한마디를 녹음기처럼 재생하지 않고,
         인물 카드로 그 사람을 연기시킨다. 실패하면 원래 한마디로 폴백한다. */
      if (m.ritual === "replay" && (snap.other.trigger || snap.other.persona?.name)) {
        await sleep(600);
        const out = await ask(
          "roleplay",
          snap.other.trigger,
          snap,
          `테이크 1. ${snap.other.name || "상대"}가 아바타 앞에 다시 섰다. 유저가 "제일 힘들다"고 한 그 말을 그 사람 입으로 다시 하게 해라. 말을 더 세게 만들지 말고, 그때의 질감 그대로.`
        );
        const line = ((out?.text as string) || "").trim() || snap.other.trigger;
        push(
          { role: "other", text: line, action: ((out?.action as string) || "").trim() || undefined, speakerName: snap.other.name },
          m.scene(snap)
        );
      }

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
        push(
          {
            role: "director",
            text: lines[i],
            chapter:
              i === 0 && c.i === 0
                ? { act: `재도전 · ${BRANCH_SCRIPTS[c.b].label}`, note: "본편은 이미 저장됐어. 여기서 한 건 덤이야." }
                : undefined,
          },
          i === 0 ? st.scene(snap) : undefined
        );
      }
      if (st.otherLine) {
        await sleep(700);
        push({ role: "other", text: st.otherLine(snap), speakerName: st.speaker?.(snap) ?? snap.other.name }, st.scene(snap));
      }
      if (st.kind === "ask") { setDirs([]); setWait("input"); return; }
      if (st.ai === "compare") {
        const out = await ask("compare", st.aiInput?.(snap) ?? snap.replayResponse, snap, st.aiNote?.(snap));
        await sleep(200);
        // 아바타가 어떻게 움직였는지 먼저 장면으로 돌려준다 — 선택의 결과를 보여주는 자리다
        if (out?.action) push({ role: "director", text: out.action as string });
        push({
          role: "other",
          text: (out?.otherLine as string) ?? "...어, 그래.",
          action: (out?.otherAction as string) || undefined,
          speakerName: st.speaker?.(snap) ?? snap.other.name,
        });
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

      // 상대 재료가 새로 잡혔으면 인물 카드를 세운다(또는 한마디로 보강한다)
      if (field === "otherName" || field === "otherTrigger") void buildPersona(next);

      vagueStreak.current = isVague(text) ? vagueStreak.current + 1 : 0;

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
    [advanceBranch, beatLens, beats, buildPersona, ctx, mv, runBeat, s]
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

  /* ── 이야기 중간 카드 뽑기 — 애매할 때 놀이로 푼다 ── */
  const onOfferDraw = useCallback(() => {
    setCardOffer(false);
    setWait("none");
    push({ role: "user", text: "🃏 카드 한 장 뽑아볼래." });
    void (async () => {
      await sleep(360);
      push({ role: "director", text: "좋아, 말이 안 나올 땐 머리 말고 손이 고르게 하자. 마음 가는 데를 탭해." });
      setMidDraw(true);
    })();
  }, [push]);

  const onMidDrawn = useCallback(
    (c: TarotCard) => {
      setMidDraw(false);
      vagueStreak.current = 0;
      push({ role: "director", text: `${c.emoji} ${c.name} — ${c.keyword}. ${c.cardHint}` });
      const nb = beats + 1;
      setBeats(nb);
      void runBeat(
        mv,
        s,
        nb,
        `(유저가 중간 카드를 뽑았다: ${c.emoji} ${c.name}, 키워드 "${c.keyword}". 이 카드를 지금 장면에 가볍게 걸쳐서 놀이처럼 새 실마리를 열어줘. 점·해석 강요 금지, 아니면 바로 버려도 된다고 말해줘.)`
      );
    },
    [beats, mv, push, runBeat, s]
  );

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
        setPreset(null); // 새 카드는 다시 뽑는다
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
        onDraw(preset ?? CARDS[Math.floor(Math.random() * CARDS.length)]);
        return;
      }
      if (wait === "confirm") {
        setDemoNote("이어서");
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
        setDemoNote("이름을 짓는 중");
        setAutofill({ text: "소라", nonce: Date.now() });
        await nap(DEMO_PACE.afterPickMs);
        if (cancelled) return;
        void onSubmit("소라", []);
        return;
      }

      setDemoNote("어느 쪽으로 갈지 고르는 중");
      const deadline = Date.now() + DEMO_PACE.waitChoicesMs;
      while (!cancelled && dirsRef.current.length === 0 && Date.now() < deadline) await nap(250);
      if (cancelled) return;

      const list = dirsRef.current;
      const pick = list.length ? list[beats % list.length] : null;
      const text = pick?.text ?? "그냥 그랬어. 말로 정리가 잘 안 돼.";
      setDemoNote(pick ? `「${pick.label}」 쪽으로` : "네 말로 적는 중");
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
  // 캐스팅 첫 비트(이름 짓기)에서는 조종간을 숨긴다 — 아직 되짚을 얘기가 없다
  const showControls = wait === "input" && !busy && !ctx && !(mv.id === "casting" && beats === 0);
  const rung = rungAt(s.depth ?? mv.depthStart);

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
          <div className="topbar-left">
            <button className="topbar-back" onClick={() => router.push("/")} aria-label="뒤로 가기">←</button>
            <div className="topbar-info">
              <div className="topbar-title">{branchLabel ? `🔄 ${branchLabel}` : mv.label}</div>
              <div className="topbar-sub">{branchLabel ? "재도전 무대 · 본편은 저장돼 있어" : mv.sub}</div>
            </div>
          </div>
          <div className="topbar-right">
            <button
              className={`pause-btn voice-btn${voice.on ? " voice-on" : ""}`}
              onClick={voice.toggle}
              aria-pressed={voice.on}
              title={voice.on ? "디렉터 목소리 끄기" : "디렉터 목소리 켜기"}
            >
              {voice.on ? (voice.speaking ? "🔊 말하는 중" : "🔊 목소리") : "🔇 목소리"}
            </button>
            {demo ? (
              <button className="pause-btn" onClick={() => { demoRef.current = false; setDemo(false); }}>
                ⏸ 자동 진행 멈춤
              </button>
            ) : (
              <button className="pause-btn" onClick={() => setGround(true)}>🫧 잠깐 멈출래</button>
            )}
            <span className="turn-pill">
              {ctx ? `${ctx.i + 1}/${ctx.steps.length}` : `${beats + 1}번째 말`}
            </span>
            {!ctx && !s.done && (
              <span className="turn-pill" title={rung.intent}>
                {rung.label}
              </span>
            )}
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
          🎬 데모 자동 진행 중 · {ctx ? `분기 ${ctx.i + 1}/${ctx.steps.length}` : `${mv.label} · ${beats + 1}번째 말`}
          {demoNote ? ` — ${demoNote}` : ""}
          <button className="demo-restart" onClick={() => window.location.reload()}>↻ 처음부터</button>
        </div>
      )}

      <div className="scroll" ref={scrollRef}>
        <StageScene scene={s.scene} cardId={s.cardId} protagonist={s.character.name || "?"} antagonist={s.other.name} />

        {careHint && !s.done && (
          <div className="infer" style={{ borderColor: "#2c3a4a", background: "#0d141a" }}>
            <div className="infer-body">🫧 {careHint}. 이 질문 넘기고 다른 데서 가도 돼.</div>
          </div>
        )}

        {timeUp && !s.done && (
          <div className="infer" style={{ borderColor: "#4a3a1c", background: "#1a1409" }}>
            <div className="infer-h" style={{ color: "var(--gold)" }}>⏳ 25분 지났어</div>
            <div className="infer-body">여기서 멈춰도 괜찮아. 계속하고 싶으면 계속해도 되고.</div>
          </div>
        )}

        {s.messages.map((m) => <Bubble key={m.id} m={m} />)}
        {busy && <Typing />}

        {wait === "draw" && <Deck onDraw={onDraw} preset={preset} />}

        {midDraw && <Deck onDraw={onMidDrawn} />}

        {wait === "confirm" && !busy && (
          <button className="cta cta-primary" onClick={onConfirm}>계속</button>
        )}

        {wait === "curtain" && s.done && <CurtainCall s={s} onBranch={onBranch} onSave={onSave} />}
      </div>

      {wait === "input" && !busy && (
        <>
          {showControls && (openThreads.length > 0 || nextReady || cardOffer) && (
            <div className="helm">
              {cardOffer && (
                <button className="helm-chip helm-card" onClick={onOfferDraw}>
                  🃏 카드 한 장 뽑아볼래?
                </button>
              )}
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
