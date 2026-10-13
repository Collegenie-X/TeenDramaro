"use client";

/**
 * 🪞 내 무대 — 화면 8~10 (§7~§10) · 소개(/about) 04 「내 장면은 진행자랑 같이 세워」와 같은 흐름
 *   enter    🚪 입장 — 나로 / 아바타로 · 이름 · 거리
 *   card     🃏 오늘의 카드 (건너뛰어도 됨)
 *   build    🎬 장면 세우기 — 장소 · 시간 · 물건 하나
 *   stage    🎬 무대 — 안쪽 보기 → 마주치기 → 객석에서 보기 → 다시 해 보기 (기법 칩 · ✋ 여기까지)
 *   curtain  🎭 커튼콜 — 제목 · 내 말 세 줄 · 내일의 한마디
 *   done     다리 둘 — 🎞 이 장면, 상황극으로 · 🏛 닮은 고전
 *
 * 대부분은 클릭으로 — 고를 거리는 data/inner.json 의 options 를 콤보 드롭 박스로. 「✏️ 직접 쓰기」를 골랐을 때만 입력칸이 열린다.
 * 무대 그림은 components/InnerArt 가 지금 상태 그대로 그린다.
 * 진행 중인 판은 localStorage(mindscene.v1.innerDraft)에 남아 새로고침해도 이어서 할 수 있다.
 * 🧪 동작 시나리오(data/inner-scenarios.json · ?demo=<id>)로 화면을 한 걸음씩 실행하며 확인한다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Feed from "@/components/Feed";
import Composer from "@/components/Composer";
import SafetySheet from "@/components/SafetySheet";
import Sheet from "@/components/Sheet";
import ComboBox, { type OptItem } from "@/components/ComboBox";
import PopDock, { type DockItem } from "@/components/PopDock";
import ScenarioDock, { type StepResult } from "@/components/ScenarioDock";
import { CardArt, DistanceArt, Ico, Portrait, StageView, StepRail } from "@/components/InnerArt";
import { askAI } from "@/lib/ai";
import { INNER, type ActId, type InnerOpt } from "@/lib/data";
import {
  actMeta, actOpening, classicBridgeLine, directorReply, doubleOffer, isHeavy,
  pieceToSituation, say, similarClassic, techniqueLine, type InnerOther, type InnerState,
} from "@/lib/inner";
import { SCENARIOS, SCENARIO_ABOUT, getScenario, verify, type Scenario, type ScenarioStep, type Snap } from "@/lib/innerScenario";
import { blankPiece, finishPiece } from "@/lib/pieces";
import { checkSafety, type SafetyLevel } from "@/lib/safety";
import {
  clearInnerDraft, getArchetype, loadInnerDraft, loadPieces, saveCustom, saveInnerDraft, wipeDemoPieces,
} from "@/lib/store";
import { fillJosa, josa } from "@/lib/text";
import { useQuery, withWork } from "@/lib/useQuery";
import type { Beat, ScenePiece, TechId } from "@/lib/types";

type Phase = "enter" | "card" | "build" | "stage" | "curtain" | "done";
const STAGE_ACTS: ActId[] = ["inside", "meet", "mirror", "replay"];
const OPT = INNER.options;
const DIST = ["", "가까이", "보통", "멀리"];

const initial: InnerState = {
  act: "enter", alias: "", avatar: true, distance: 2, place: "", time: "", object: "",
  mode: null, beats: [], actLines: 0, techniques: [], facts: [], replayFrom: -1,
};

type Draft = { v: 1; phase: Phase; s: InnerState; at: string };
type Curtain = { title: string; picked: string[]; tomorrow: string };
type Demo = { sc: Scenario; i: number; results: StepResult[]; auto: boolean; running: boolean };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 라벨 → 그림 key (직접 쓴 말이면 없음) */
const keyOf = (list: InnerOpt[], label: string) => list.find((o) => o.label === label)?.key;

export default function InnerStage() {
  const router = useRouter();
  const [q, qReady] = useQuery();
  const [phase, setPhase] = useState<Phase>("enter");
  const [s, setS] = useState<InnerState>(initial);
  const [busy, setBusy] = useState(false);
  const [propose, setPropose] = useState(false);
  const [offer, setOffer] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyLevel | null>(null);
  const [sealed, setSealed] = useState(false);
  const [saved, setSaved] = useState<{ piece: ScenePiece; href: string } | null>(null);
  const [typing, setTyping] = useState(false);
  const [showStage, setShowStage] = useState(true);
  // 폼 — 위로 올려 둬야 🧪 시나리오가 화면에 보이게 채울 수 있다
  const [enterD, setEnterD] = useState({ avatar: true, alias: OPT.alias[0], distance: 2 });
  const [buildD, setBuildD] = useState({ place: "", time: "", object: "" });
  const [meetD, setMeetD] = useState<{ name: string; line: string; habit?: string }>({ name: "", line: "" });
  const [curtainD, setCurtainD] = useState<Curtain>({ title: "", picked: [], tomorrow: "" });
  const [resume, setResume] = useState<Draft | null>(null);
  const [demo, setDemo] = useState<Demo | null>(null);
  const [picker, setPicker] = useState(false);
  const [editWarm, setEditWarm] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const fromArch = useMemo(() => (q.from ? getArchetype(q.from) : undefined), [q.from]);
  const card = INNER.cards.find((c) => c.id === s.cardId);
  const lastMe = [...s.beats].reverse().find((b) => b.who === "me");
  const heavy = phase === "stage" && !!lastMe && isHeavy(lastMe.text);
  const frozen = s.beats.at(-1)?.tech === "freeze";
  const myLines = s.beats.filter((b) => b.who === "me" && !b.direction).map((b) => b.text);
  const stageIdx = phase === "curtain" || phase === "done" ? 2 : phase === "stage" ? 1 : 0;
  const nextAct = STAGE_ACTS[STAGE_ACTS.indexOf(s.act) + 1];

  /* ── 🪪 상황극에서 건너왔으면 가명만 들고 온다 · 🧪 ?demo= · 💾 이어 하기 ── */
  useEffect(() => {
    if (!qReady) return;
    if (fromArch) {
      setEnterD((d) => ({ ...d, avatar: true, alias: fromArch.scene.me.name }));
      setS((x) => ({ ...x, fromArchetypeId: fromArch.id }));
    }
    const sc = getScenario(q.demo);
    if (sc) { startDemo(sc); return; }
    const d = loadInnerDraft<Draft>();
    if (d?.v === 1 && d.phase !== "enter" && d.phase !== "done") setResume(d);
    // 마운트 때 한 번
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qReady]);

  // 💾 진행 중인 판 — 시나리오 중엔 안 남긴다
  useEffect(() => {
    if (demo || phase === "enter" || phase === "done") return;
    saveInnerDraft({ v: 1, phase, s, at: new Date().toISOString() } satisfies Draft);
  }, [phase, s, demo]);

  useEffect(() => { feedRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [s.beats, offer, s.other]);

  const add = (bs: Beat[]) => setS((x) => ({ ...x, beats: [...x.beats, ...bs] }));
  const track = (t: TechId) => setS((x) => ({ ...x, techniques: x.techniques.includes(t) ? x.techniques : [...x.techniques, t] }));
  const stopFor = (level: SafetyLevel) => { setSafety(level); setSealed(true); };

  /* ── 웜업 ─────────────────────────────────────── */
  function commitEnter(alias: string, avatar: boolean, distance: number) {
    setResume(null);
    setS((x) => ({ ...x, alias, avatar, distance, act: "card" }));
    setPhase("card");
  }
  function commitCard(cardId?: string) {
    const c = INNER.cards.find((x) => x.id === cardId);
    // 카드가 가리키는 장소 · 물건을 미리 골라 둔다 — 바꾸는 건 한 번 클릭
    setBuildD({
      place: c ? keyLabel(OPT.places, c.place) : "",
      time: "",
      object: c ? keyLabel(OPT.objects, c.object) : "",
    });
    setS((x) => ({ ...x, cardId, act: "build" }));
    setPhase("build");
  }
  function commitBuild(place: string, time: string, object: string) {
    const hit = checkSafety([place, time, object].join(" "));
    if (hit) return stopFor(hit.level);
    setS((x) => {
      const nx: InnerState = { ...x, place, time, object, act: "inside", actLines: 0 };
      return { ...nx, beats: [say("system", `🎬 ${[place, time, object].filter(Boolean).join(" · ")}`), ...actOpening(nx, "inside")] };
    });
    setPhase("stage");
  }

  /* ── 행위 ─────────────────────────────────────── */
  function goAct(act: ActId) {
    setPropose(false);
    setTyping(false);
    setS((x) => {
      const nx: InnerState = { ...x, act, actLines: 0, mode: null, replayFrom: act === "replay" ? x.beats.length : x.replayFrom };
      return { ...nx, beats: [...x.beats, ...actOpening(nx, act)] };
    });
    if (act === "mirror" && !demo) void refineMirror();
  }

  /** 🪞 거울 — AI가 있으면 내 말로만 다시 읽기를 다듬는다. 없으면 내장 되읽기 그대로 */
  async function refineMirror() {
    const res = await askAI<{ text: string }>("mirror", "", {
      alias: s.alias, place: s.place, time: s.time, object: s.object, other: s.other?.name,
      lines: s.beats.filter((b) => b.who === "me" || b.who === "other").slice(-8).map((b) => ({ who: b.who === "me" ? (b.asOther ? `${s.other?.name}(자리 바꾸기)` : s.alias) : s.other?.name, text: b.text })),
    });
    if (res.kind === "ai" && res.data.text) {
      setS((x) => {
        const last = [...x.beats].reverse().find((y) => y.tech === "mirror");
        return { ...x, beats: x.beats.map((b) => (b === last ? { ...b, text: res.data.text } : b)) };
      });
    }
  }

  async function send(text: string, opts: { direction: boolean }) {
    const hit = checkSafety(text);
    if (hit) return stopFor(hit.level);

    const tech: TechId | undefined = s.mode === "soliloquy" ? "soliloquy" : s.mode === "chair" ? "chair" : s.mode === "future" ? "future" : undefined;
    const mine = say("me", text, { asOther: s.mode === "reversal" || undefined, tech, direction: opts.direction || undefined });
    const cur: InnerState = { ...s, beats: [...s.beats, mine] };
    setS({ ...cur, actLines: cur.actLines + 1, facts: s.mode === "reversal" ? [...s.facts, text] : s.facts });
    if (s.mode === "reversal") add([say("system", `${josa(s.other?.name ?? "상대", "의")} 자리에서 나온 말 — 「${text}」`, { fact: true })]);

    const local = directorReply(cur, text);
    let beats = local.beats;
    // 🧪 시나리오 중엔 AI를 안 부른다 — 매번 같은 결과가 나와야 확인할 수 있다
    if (!local.slow && !s.mode && !demo) {
      setBusy(true);
      const isOther = s.act === "meet" && !!s.other;
      const res = await askAI<{ text?: string; line?: string; dir?: string }>(isOther ? "other" : "director", text, {
        act: actMeta(s.act).label, mode: s.mode, alias: s.alias, place: s.place, object: s.object,
        other: s.other, distance: s.distance,
        recent: cur.beats.slice(-6).map((b) => `${b.who === "me" ? s.alias : b.who === "other" ? s.other?.name : "진행자"}: ${b.text}`),
      });
      setBusy(false);
      if (res.kind === "safety") return stopFor(res.level);
      if (res.kind === "ai") {
        beats = isOther
          ? [say("other", res.data.line ?? "", { dir: res.data.dir || undefined })]
          : [say("director", res.data.text ?? "")];
      }
    }
    add(beats);
    if (local.propose) setPropose(true);
  }

  function applyTech(t: TechId) {
    const line = techniqueLine(s, t);
    if (t === "freeze") { add([say("system", "✋ 장면 정지"), say("director", line, { tech: t })]); return track(t); }
    if (t === "double") { setOffer(doubleOffer(s)); return track(t); }
    if (t === "distance") {
      const d = s.distance >= 3 ? 1 : s.distance + 1;
      setS((x) => ({ ...x, distance: d, beats: [...x.beats, say("director", d === 3 ? line : d === 1 ? `${josa(x.other?.name ?? "상대", "를")} 가까이 세웠어.` : "보통 거리로 돌려놨어.", { tech: t })] }));
      return track(t);
    }
    if (t === "mirror") return goAct("mirror");
    if (t === "retake") return goAct("replay");
    const mode = t === "reversal" ? "reversal" : t === "chair" ? "chair" : t === "soliloquy" ? "soliloquy" : "future";
    setS((x) => ({ ...x, mode, beats: [...x.beats, say("director", line, { tech: t })] }));
    track(t);
  }

  function endMode() {
    const back = s.mode === "reversal" ? INNER.afterReversal.replace("{other}", s.other?.name ?? "그 사람") : "장면으로 돌아왔어.";
    setS((x) => ({ ...x, mode: null, beats: [...x.beats, say("director", back)] }));
  }

  /** 무거워졌을 때 칩 — 멀리 세우기 · 아바타로 바꾸기 */
  function goFar() {
    setS((x) => ({ ...x, distance: 3, beats: [...x.beats, say("director", techniqueLine(x, "distance"), { tech: "distance" })] }));
    track("distance");
  }
  function toAvatar() {
    setS((x) => ({ ...x, avatar: true, beats: [...x.beats, say("director", "아바타로 바꿨어. 이제 무대엔 네가 아니라 아바타가 서 있어.")] }));
  }

  function takeOffer(keep: boolean) {
    if (!offer) return;
    if (keep) {
      const m = offer.match(/「(.+)」/);
      add([say("me", m ? m[1] : offer, { tech: "double" }), say("director", "가져갔어. 네 말로 남겨 둘게.")]);
    } else add([say("director", "버렸어. 네 말이 아니면 아닌 거야.")]);
    setOffer(null);
  }

  function setOther(o: InnerOther) {
    const hit = checkSafety(o.name + " " + o.line);
    if (hit) return stopFor(hit.level);
    setS((x) => ({ ...x, other: o, beats: [...x.beats, say("other", o.line, { dir: x.distance >= 3 ? "멀리 서서" : x.distance === 1 ? "바로 앞에서" : undefined })] }));
  }

  function toCurtain(stop?: boolean) {
    if (stop) add([say("director", INNER.stop)]);
    setTyping(false);
    setOffer(null);
    setCurtainD({ title: defaultTitle(s), picked: [], tomorrow: "" });
    setPhase("curtain");
  }

  /* ── 나눔 — 저장 버튼 없이 내 씬에 ───────────────── */
  function finish(c: { title: string; lines: string[]; tomorrow: string }) {
    const hit = checkSafety([c.title, c.tomorrow, ...c.lines].join(" "));
    if (hit) return stopFor(hit.level);
    const split = s.replayFrom >= 0 ? s.replayFrom : s.beats.length;
    const lastMine = (bs: Beat[]) => [...bs].reverse().find((b) => b.who === "me" && !b.asOther)?.text ?? "";
    const t1 = s.beats.slice(0, split);
    const t2 = s.replayFrom >= 0 ? s.beats.slice(split) : [];
    const stamp = new Date().toISOString();
    const base = { dials: { honesty: 1, eyes: 1, stubborn: 1, play: 1 }, branches: [], pdLog: [], createdAt: stamp };
    const takes = [{ ...base, n: 1, beats: t1, lastCut: { line: lastMine(t1), direction: "" } }];
    if (t2.some((b) => b.who === "me")) takes.push({ ...base, n: 2, beats: t2, lastCut: { line: lastMine(t2), direction: "" }, reason: "그때 못 한 말" } as typeof takes[number]);

    const piece = blankPiece({
      title: c.title || defaultTitle(s),
      source: { track: "inner", avatar: s.avatar, cardId: s.cardId, fromArchetypeId: s.fromArchetypeId },
      scene: {
        place: s.place, time: s.time, light: s.object,
        me: { name: s.alias, want: "", hide: "" },
        other: { name: s.other?.name ?? "", want: "", hide: "", habit: s.other?.habit },
        fixed: [s.place, s.time, s.object].filter(Boolean), open: [],
      },
      pivot: "그때 못 한 말",
      takes, facts: s.facts, techniques: s.techniques, curtain: c, spice: "mild", sealed,
      demo: demo?.sc.id,
    });
    const href = finishPiece(piece, q.work);
    clearInnerDraft();
    setSaved({ piece, href });
    setPhase("done");
  }

  function reset() {
    setPhase("enter"); setS({ ...initial, fromArchetypeId: fromArch?.id }); setBusy(false); setPropose(false); setOffer(null);
    setSafety(null); setSealed(false); setSaved(null); setTyping(false);
    setEnterD({ avatar: true, alias: fromArch?.scene.me.name ?? OPT.alias[0], distance: 2 });
    setBuildD({ place: "", time: "", object: "" }); setMeetD({ name: "", line: "" }); setCurtainD({ title: "", picked: [], tomorrow: "" });
  }

  /* ── 🧪 동작 시나리오 ─────────────────────────── */
  const snapRef = useRef<Snap>({ phase, s, offer: !!offer, heavy, saved: saved?.piece ?? null });
  snapRef.current = { phase, s, offer: !!offer, heavy, saved: saved?.piece ?? null };

  function startDemo(sc: Scenario) {
    reset();
    setResume(null);
    setPicker(false);
    setDemo({ sc, i: 0, results: [], auto: false, running: false });
  }

  /** 걸음 하나 = 화면의 클릭 하나. 그 버튼이 지금 화면에 없으면 ✗ */
  async function perform(st: ScenarioStep): Promise<string | null> {
    const inStage = phase === "stage";
    const meetBlocked = s.act === "meet" && !s.other;
    switch (st.do) {
      case "enter":
        if (phase !== "enter") return "입장 화면이 아니야";
        setEnterD({ avatar: st.avatar, alias: st.alias, distance: st.distance });
        await wait(450);
        commitEnter(st.alias, st.avatar, st.distance);
        return null;
      case "card":
        if (phase !== "card") return "카드 화면이 아니야";
        commitCard(st.id);
        return null;
      case "build":
        if (phase !== "build") return "장면 세우기 화면이 아니야";
        setBuildD({ place: st.place, time: st.time, object: st.object });
        await wait(450);
        commitBuild(st.place, st.time, st.object);
        return null;
      case "say":
        if (!inStage || busy || meetBlocked) return "할 말 옵션이 꺼져 있어";
        if (st.typed) { setTyping(true); await wait(350); }
        await send(st.text, { direction: !!st.direction });
        return null;
      case "tech": {
        if (!inStage || s.mode) return `「${INNER.techniques[st.id].name}」 칩이 안 보여`;
        if ((st.id === "reversal" || st.id === "distance") && !s.other) return `「${INNER.techniques[st.id].name}」 칩이 꺼져 있어 (상대 없음)`;
        applyTech(st.id);
        return null;
      }
      case "offer":
        if (!offer) return "속말 카드가 없어";
        takeOffer(st.keep);
        return null;
      case "meet":
        if (!inStage || !meetBlocked) return "상대 세우기 카드가 없어";
        setMeetD({ name: st.name, line: st.line });
        await wait(450);
        setOther({ name: st.name, line: st.line });
        return null;
      case "end":
        if (!s.mode) return "끝낼 기법이 없어";
        endMode();
        return null;
      case "next":
        if (!inStage || s.mode || !nextAct) return "「다음 장면」 칩이 안 보여";
        goAct(nextAct);
        return null;
      case "stop":
        if (!inStage) return "「여기까지」 버튼이 안 보여";
        toCurtain(true);
        return null;
      case "curtain":
        if (!inStage || s.act !== "replay" || s.mode) return "「커튼콜로」 칩이 안 보여";
        toCurtain();
        return null;
      case "toAvatar":
        if (!heavy || s.avatar) return "「아바타로 바꾸기」 칩이 안 보여";
        toAvatar();
        return null;
      case "far":
        if (!heavy) return "「멀리 세우기」 칩이 안 보여";
        goFar();
        return null;
      case "finish": {
        if (phase !== "curtain") return "커튼콜 화면이 아니야";
        const missing = st.pick.filter((p) => !myLines.includes(p));
        if (missing.length) return `고를 줄이 없어: ${missing.join(", ")}`;
        const title = st.title || defaultTitle(s);
        setCurtainD({ title, picked: st.pick, tomorrow: st.tomorrow });
        await wait(500);
        finish({ title: st.title, lines: st.pick, tomorrow: st.tomorrow });
        return null;
      }
    }
  }

  async function runStep() {
    if (!demo || demo.running) return;
    const st = demo.sc.steps[demo.i];
    if (!st) return;
    setDemo((d) => d && { ...d, running: true });
    const err = await perform(st);
    await wait(160);   // 화면이 그려진 다음 상태를 본다
    const fails = err ? [err] : verify(st.check, snapRef.current);
    setDemo((d) => d && {
      ...d, running: false, i: d.i + 1,
      results: [...d.results, { ok: !fails.length, fails }],
      auto: fails.length || d.i + 1 >= d.sc.steps.length ? false : d.auto,
    });
  }

  useEffect(() => {
    if (!demo?.auto || demo.running || demo.i >= demo.sc.steps.length) return;
    const t = setTimeout(() => void runStep(), 750);
    return () => clearTimeout(t);
    // 매 걸음 뒤 새 화면(새 runStep)으로 다음 걸음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo?.auto, demo?.running, demo?.i]);

  const storageLine = (() => {
    if (!demo) return "";
    const all = typeof window === "undefined" ? [] : loadPieces();
    return `localStorage 씬 ${all.length}개 · 🧪 ${all.filter((p) => p.demo).length}개`;
  })();

  /* ── 배우 카드 — 상황극에서 만난 인물 ───────────── */
  const castCards = useMemo(() => {
    const seen = new Map<string, { name: string; habit?: string; from: string }>();
    loadPieces().filter((p) => p.source.track === "situation").forEach((p) => {
      if (!seen.has(p.scene.other.name)) seen.set(p.scene.other.name, { name: p.scene.other.name, habit: p.scene.other.habit, from: p.title });
    });
    return [...seen.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── 지금 무대 그림 ───────────────────────────── */
  const view = phase === "build"
    ? { place: keyOf(OPT.places, buildD.place), time: keyOf(OPT.times, buildD.time), object: keyOf(OPT.objects, buildD.object), placeLabel: buildD.place, timeLabel: buildD.time }
    : { place: keyOf(OPT.places, s.place), time: keyOf(OPT.times, s.time), object: keyOf(OPT.objects, s.object), placeLabel: s.place, timeLabel: s.time };
  const stageArt = (
    <StageView
      phase={phase} act={s.act} mode={s.mode}
      avatar={phase === "enter" ? enterD.avatar : s.avatar}
      alias={phase === "enter" ? enterD.alias : s.alias}
      distance={phase === "enter" ? enterD.distance : s.distance}
      {...view}
      otherName={s.other?.name} hasOther={!!s.other} frozen={phase === "stage" && frozen} heavy={heavy}
    />
  );

  const vars = { other: s.other?.name ?? "그 사람", object: s.object || "그거", alias: s.alias };
  const sayKey = (s.mode && s.mode !== "replay" ? s.mode : s.act) as keyof typeof OPT.say;
  const saidMine = new Set(s.beats.filter((b) => b.who === "me").map((b) => b.text));
  const sayOpts = (OPT.say[sayKey] ?? OPT.say.inside)
    .map((o) => ({ ...o, t: fillJosa(o.t, vars) }))
    .filter((o) => !saidMine.has(o.t));

  /* ── 세 단계 사이 오가기 — 무대에 한 번 섰으면 웜업은 고치고, 행위 · 나눔은 오간다 ── */
  const started = s.beats.length > 0;
  const railCan = [
    phase === "card" || phase === "build" || started,
    started && phase !== "stage",
    started && phase !== "curtain",
  ];
  function railGo(i: number) {
    if (i === 0) return started ? setEditWarm(true) : setPhase("enter");
    if (i === 1) { setPhase("stage"); return; }
    toCurtain();
  }
  function applyWarm(w: WarmEdit) {
    const hit = checkSafety([w.alias, w.place, w.time, w.object].join(" "));
    if (hit) return stopFor(hit.level);
    const changed = [
      w.alias !== s.alias && `이름 ${w.alias}`,
      w.avatar !== s.avatar && (w.avatar ? "아바타로" : "나로"),
      w.distance !== s.distance && `거리 ${DIST[w.distance]}`,
      w.place !== s.place && w.place,
      w.time !== s.time && (w.time || "시간 없음"),
      w.object !== s.object && (w.object || "물건 없음"),
    ].filter(Boolean);
    setEditWarm(false);
    if (!changed.length) return;
    setS((x) => ({ ...x, ...w, beats: [...x.beats, say("system", `✏️ 웜업 고침 — ${changed.join(" · ")}`), say("director", "바꿨어. 장면은 그대로 이어 가.")] }));
  }

  const meetBlocked = s.act === "meet" && !s.other;
  const sayDock: DockItem[] = sayOpts.map((o) => ({ key: o.t, label: o.t, dir: o.dir }));
  const modeName = s.mode ? INNER.techniques[s.mode === "replay" ? "retake" : s.mode].name : "";
  const techDock: DockItem[] = s.mode
    ? [{ key: "end", label: `${modeName} 끝`, icon: "next", on: true }]
    : [
        ...INNER.chipOrder.map((t) => ({
          key: t, label: INNER.techniques[t].name, icon: t, hint: INNER.techniques[t].when,
          disabled: (t === "reversal" || t === "distance") && !s.other,
        })),
        ...(nextAct ? [{ key: "next", label: actMeta(nextAct).label, icon: "next", on: propose, hint: "다음 장면으로" }] : []),
        ...(s.act === "replay" ? [{ key: "curtain", label: "커튼콜", icon: "curtain", on: true }] : []),
      ];
  function onTechDock(it: DockItem) {
    if (it.key === "end") return endMode();
    if (it.key === "next" && nextAct) return goAct(nextAct);
    if (it.key === "curtain") return toCurtain();
    applyTech(it.key as TechId);
  }

  const title = s.alias ? `🪞 내 무대 · ${s.alias}${s.avatar ? "(아바타)" : ""}` : "🪞 내 무대";

  return (
    <div className="track track-inner">
      <TopBar
        back={phase === "enter" ? "/" : undefined}
        title={title}
        sub={phase === "stage" ? `② 행위 · ${actMeta(s.act).label}${s.mode ? ` · ${INNER.techniques[s.mode === "replay" ? "retake" : s.mode].name} 중` : ""}` : "진행자가 같이 있어 · 고르는 건 늘 너"}
        right={phase === "stage" ? <button className="btn btn-sm in-stop" onClick={() => toCurtain(true)}><Ico name="hand" size={14} /> 여기까지</button> : undefined}
      >
        {phase !== "done" && <StepRail idx={stageIdx} labels={INNER.rail} can={railCan} onGo={railGo} />}
      </TopBar>

      {demo && (
        <ScenarioDock
          sc={demo.sc} i={demo.i} results={demo.results} auto={demo.auto} running={demo.running} storage={storageLine}
          onStep={() => void runStep()}
          onAuto={() => setDemo((d) => d && { ...d, auto: !d.auto })}
          onRestart={() => startDemo(demo.sc)}
          onClose={() => { setDemo(null); reset(); }}
          onWipe={() => { wipeDemoPieces(); setDemo((d) => d && { ...d }); }}
        />
      )}

      {/* ── 🚪 입장 ─────────────────────────── */}
      {phase === "enter" && (
        <div className="scroll">
          <div className="bub-wrap director"><div className="who">🎬 진행자</div><div className="bub">{fromArch ? INNER.bridges.fromSituation : actMeta("enter").line}</div></div>
          {stageArt}

          {resume && (
            <div className="card card-inner in-resume">
              <div className="label"><Ico name="save" size={12} /> 하던 무대가 이 기기에 남아 있어</div>
              <p>{[resume.s.alias, resume.s.place, resume.phase === "stage" ? actMeta(resume.s.act).label : resume.phase === "curtain" ? "커튼콜" : "웜업"].filter(Boolean).join(" · ")}</p>
              <div className="grid2" style={{ marginTop: 8 }}>
                <button className="btn btn-sm" onClick={() => { clearInnerDraft(); setResume(null); }}>새로 시작</button>
                <button className="btn btn-sm btn-tone" onClick={() => { setS(resume.s); setPhase(resume.phase); if (resume.phase === "curtain") setCurtainD({ title: defaultTitle(resume.s), picked: [], tomorrow: "" }); setResume(null); }}>이어서 하기</button>
              </div>
            </div>
          )}

          <div className="in-section-h"><span>1</span>누가 무대에 설까</div>
          <div className="grid2">
            {[false, true].map((av) => (
              <button key={String(av)} className={`in-choice${enterD.avatar === av ? " on" : ""}${av ? " av" : ""}`} aria-pressed={enterD.avatar === av}
                onClick={() => setEnterD((d) => ({ ...d, avatar: av, alias: av ? (d.alias === "나" ? OPT.alias[0] : d.alias) : "나" }))}>
                <Portrait avatar={av} on={enterD.avatar === av} />
                <b>{av ? "아바타로" : "나로"}</b>
                <small>{av ? "다른 이름으로 세워 거리 두기" : "나 그대로, 부를 이름 하나"}</small>
              </button>
            ))}
          </div>

          <div className="in-section-h"><span>2</span>{enterD.avatar ? "아바타 이름" : "무대에서 부를 이름"}</div>
          <ComboBox
            items={[...new Set([...(fromArch ? [fromArch.scene.me.name] : []), ...OPT.alias])].map((a) => ({ label: a, mark: fromArch?.scene.me.name === a ? "상황극" : undefined }))}
            value={enterD.alias} onPick={(alias) => setEnterD((d) => ({ ...d, alias }))} maxLength={10} placeholder="이름 고르기" customPlaceholder="실명 말고도 돼" label="이름"
          />

          <div className="in-section-h"><span>3</span>거리 — 상대를 얼마나 떨어뜨려 둘까</div>
          <div className="in-dist" role="radiogroup">
            {[1, 2, 3].map((d) => (
              <button key={d} role="radio" aria-checked={enterD.distance === d} className={enterD.distance === d ? "on" : ""} onClick={() => setEnterD((x) => ({ ...x, distance: d }))}>
                <DistanceArt d={d} /><span>{DIST[d]}</span>
              </button>
            ))}
          </div>

          <button className="btn btn-tone btn-block" disabled={!enterD.alias.trim()} onClick={() => commitEnter(enterD.alias.trim(), enterD.avatar, enterD.distance)}>무대 오르기</button>
          <ul className="in-promise">
            {INNER.promise.do.map((t) => <li key={t}><Ico name="check" size={13} stroke={2.6} />{t}</li>)}
          </ul>
          <p className="note">{INNER.promise.note}</p>
          {!demo && (
            <button className="btn btn-ghost btn-block in-test" onClick={() => setPicker(true)}><Ico name="flask" size={15} /> 동작 시나리오로 화면 테스트</button>
          )}
        </div>
      )}

      {/* ── 🃏 오늘의 카드 ──────────────────── */}
      {phase === "card" && <CardStep onPick={commitCard} />}

      {/* ── 🎬 장면 세우기 ─────────────────── */}
      {phase === "build" && (
        <div className="scroll">
          <div className="bub-wrap director"><div className="who">🎬 진행자</div><div className="bub">{actMeta("build").line}</div></div>
          {stageArt}
          {fromArch && <div className="card" style={{ fontSize: 12.5 }}>🪪 상황극 「{fromArch.adaptTitle}」의 뼈대: {fromArch.skeleton}</div>}
          <div className="in-section-h"><span>1</span>어디였어? <small>장소 하나</small></div>
          <ComboBox items={opts(OPT.places, card?.place)} value={buildD.place} onPick={(place) => setBuildD((d) => ({ ...d, place }))} placeholder="장소 고르기" customPlaceholder="예: 학교 뒷문" label="장소" />
          <div className="in-section-h"><span>2</span>언제였어? <small>안 골라도 돼</small></div>
          <ComboBox items={opts(OPT.times)} value={buildD.time} onPick={(time) => setBuildD((d) => ({ ...d, time }))} clearable="안 고를래" customPlaceholder="예: 시험 끝난 날" label="시간" />
          <div className="in-section-h"><span>3</span>거기 뭐가 있었어? <small>물건 하나</small></div>
          <ComboBox items={opts(OPT.objects, card?.object)} value={buildD.object} onPick={(object) => setBuildD((d) => ({ ...d, object }))} placeholder="물건 고르기" customPlaceholder="예: 체육복" label="물건" />
          <button className="btn btn-tone btn-block" disabled={!buildD.place.trim()} onClick={() => commitBuild(buildD.place.trim(), buildD.time.trim(), buildD.object.trim())}>
            {josa(s.alias || "나", "를")} 무대에 세우기
          </button>
          <p className="note">지금 여기, 현재형으로. 길게 안 해도 돼.</p>
        </div>
      )}

      {/* ── 🎬 무대 ─────────────────────────── */}
      {phase === "stage" && (
        <>
          <div className={`in-stagebox${showStage ? "" : " folded"}`}>
            {showStage && stageArt}
            <div className="in-acts">
              {STAGE_ACTS.map((a, k) => (
                <button key={a} type="button" className={a === s.act ? "on" : k < STAGE_ACTS.indexOf(s.act) ? "done" : ""}
                  disabled={a === s.act || !!s.mode || busy} aria-current={a === s.act ? "step" : undefined}
                  title={s.mode ? "기법을 끝내고 옮겨 가" : `${actMeta(a).label}(으)로`} onClick={() => goAct(a)}>
                  {actMeta(a).label}
                </button>
              ))}
              <button className="in-fold" onClick={() => setShowStage(!showStage)} aria-expanded={showStage}>{showStage ? "무대 접기 ▴" : "무대 펴기 ▾"}</button>
            </div>
          </div>
          <div className="scroll" ref={feedRef}>
            <Feed beats={s.beats} meName={s.alias} otherName={s.other?.name ?? "상대"} />
            {busy && <div className="muted" style={{ fontSize: 12 }}>🎬 …</div>}
            {s.act === "meet" && !s.other && (
              <div className="card card-inner in-meet">
                <div className="label"><Ico name="person" size={12} /> 상대 세우기 — 누구였고, 뭐라고 했어?</div>
                <ComboBox
                  items={[...castCards.map((c) => ({ label: c.name, mark: "배우 카드" })), ...OPT.others.filter((o) => !castCards.some((c) => c.name === o.name)).map((o) => ({ label: o.name, mark: o.tag }))]}
                  value={meetD.name} maxLength={10} placeholder="누구였어?" customPlaceholder="가명 OK" label="상대"
                  onPick={(name) => setMeetD((d) => ({ ...d, name, habit: castCards.find((c) => c.name === name)?.habit }))}
                />
                <div className="label">그 사람이 한 말 하나</div>
                <ComboBox items={OPT.otherLines.map((l) => ({ label: l }))} value={meetD.line} onPick={(line) => setMeetD((d) => ({ ...d, line }))} maxLength={40} placeholder="뭐라고 했어?" customPlaceholder="그 사람이 한 말" label="상대가 한 말" />
                <button className="btn btn-tone" disabled={!meetD.name.trim() || !meetD.line.trim()} onClick={() => setOther({ name: meetD.name.trim(), line: meetD.line.trim(), habit: meetD.habit })}>무대에 세우기</button>
              </div>
            )}
            {offer && (
              <div className="card card-inner">
                <div className="label">💭 속말 — 맞으면 가져가고, 아니면 버려</div>
                <p style={{ color: "var(--ink)" }}>{offer}</p>
                <div className="grid2" style={{ marginTop: 8 }}>
                  <button className="btn btn-sm" onClick={() => takeOffer(false)}>버리기</button>
                  <button className="btn btn-sm btn-tone" onClick={() => takeOffer(true)}>가져가기</button>
                </div>
              </div>
            )}
            {heavy && (
              <div className="chips in-slow">
                <span className="muted" style={{ fontSize: 11.5, width: "100%" }}>🫧 천천히 — 이 중에 하나 골라도 되고, 그냥 둬도 돼</span>
                {s.distance < 3 && <button className="chip" onClick={goFar}><Ico name="distance" size={13} /> 멀리 세우기</button>}
                {!s.avatar && <button className="chip" onClick={toAvatar}><Ico name="mask" size={13} /> 아바타로 바꾸기</button>}
                <button className="chip" onClick={() => toCurtain()}><Ico name="hand" size={13} /> 여기까지</button>
              </div>
            )}
          </div>

          {typing ? (
            <Composer
              onSend={(t, o) => void send(t, o)}
              allowDirection
              disabled={busy || meetBlocked}
              placeholder={s.mode === "reversal" ? `${s.other?.name ?? "상대"} 자리에서 말해 봐…` : s.mode === "chair" ? "빈 의자에게…" : s.mode === "soliloquy" ? "아무한테도 안 들리는 말…" : "말하거나 써도 돼…"}
              extra={
                <>
                  <div className="in-dock-h">
                    <span className="label">💡 막히면 하나 골라도 돼</span>
                    <button className="chip in-back" onClick={() => setTyping(false)}><Ico name="next" size={12} /> 고르기로</button>
                  </div>
                  {!meetBlocked && <PopDock compact items={sayDock} popKey={s.beats.length} disabled={busy} onPick={(it) => void send(it.label, { direction: !!it.dir })} />}
                </>
              }
            />
          ) : (
            <div className="composer in-dock">
              <div className="in-dock-h">
                <span className="label">
                  {s.mode ? `${INNER.techniques[s.mode === "replay" ? "retake" : s.mode].name} — 골라서 말하기` : meetBlocked ? "먼저 위에서 상대를 세워 줘" : "할 말 고르기 — 하나 눌러"}
                </span>
                <button className="chip in-type" onClick={() => setTyping(true)}><Ico name="pencil" size={12} /> 직접 쓰기</button>
              </div>
              {!meetBlocked && (sayDock.length
                ? <PopDock items={sayDock} popKey={s.beats.length} disabled={busy} onPick={(it) => void send(it.label, { direction: !!it.dir })} />
                : <span className="muted" style={{ fontSize: 12 }}>고를 말을 다 썼어 — 직접 쓰거나 다음으로 가도 돼</span>)}
              <div className="label">해 볼 수 있는 것 (안 해도 돼)</div>
              <PopDock variant="icon" items={techDock} popKey={`${s.act}-${s.mode ?? ""}`} disabled={busy} onPick={onTechDock} />
            </div>
          )}
        </>
      )}

      {/* ── 🎭 커튼콜 ───────────────────────── */}
      {phase === "curtain" && (
        <div className="scroll">
          <div className="bub-wrap director"><div className="who">🎬 진행자</div><div className="bub">{actMeta("curtain").line}</div></div>
          {stageArt}
          <div className="in-section-h"><span>1</span>오늘 장면의 제목</div>
          <ComboBox
            items={[...new Set([defaultTitle(s), `${s.place || "그 자리"}에서`, "그때 못 한 말"])].map((t) => ({ label: t }))}
            value={curtainD.title} onPick={(title) => setCurtainD((c) => ({ ...c, title }))} maxLength={24} placeholder="제목 고르기" customPlaceholder="제목 한 줄" label="제목"
          />
          <div className="in-section-h"><span>2</span>내 말 세 줄 <small>남기고 싶은 것만 · 최대 3</small></div>
          {myLines.length === 0 && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>오늘은 말이 적었어. 그것도 괜찮아.</p>}
          {myLines.map((l, i) => {
            const on = curtainD.picked.includes(l);
            return (
              <button key={i} className={`row in-line${on ? " on" : ""}`} aria-pressed={on}
                onClick={() => setCurtainD((c) => ({ ...c, picked: on ? c.picked.filter((x) => x !== l) : c.picked.length >= 3 ? c.picked : [...c.picked, l] }))}>
                <span className="in-tick">{on ? <Ico name="check" size={13} stroke={2.6} /> : null}</span>
                <div style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{l}</b></div>
              </button>
            );
          })}
          <div className="in-section-h"><span>3</span>내일의 한마디 <small>안 골라도 돼</small></div>
          <ComboBox
            items={OPT.tomorrow.map((t) => ({ label: fillJosa(t, vars) }))}
            value={curtainD.tomorrow} onPick={(tomorrow) => setCurtainD((c) => ({ ...c, tomorrow }))} maxLength={30} clearable="안 남길래" customPlaceholder="내일의 나한테 한 마디" label="내일의 한마디"
          />
          <button className="btn btn-tone btn-block" onClick={() => finish({ title: curtainD.title.trim(), lines: curtainD.picked, tomorrow: curtainD.tomorrow.trim() })}>커튼콜 — 내 씬에 넣기</button>
          <p className="note">저장 버튼은 없어. 여기서 끝내면 자동으로 남아.</p>
        </div>
      )}

      {phase === "done" && saved && (
        <DoneStep piece={saved.piece} href={saved.href} sealed={sealed} work={q.work} art={stageArt}
          onToSituation={(bone) => {
            const hit = checkSafety(bone);
            if (hit) { setSafety(hit.level); return; }
            const a = pieceToSituation(saved.piece, bone);
            saveCustom(a);
            router.push(withWork(`/situation/${a.id}`, q.work));
          }} />
      )}

      {editWarm && <WarmSheet s={s} onClose={() => setEditWarm(false)} onSave={applyWarm} />}

      {picker && (
        <Sheet onClose={() => setPicker(false)} label="동작 시나리오">
          <h3><Ico name="flask" size={17} /> 동작 시나리오</h3>
          <p style={{ fontSize: 12.5 }}>{SCENARIO_ABOUT}</p>
          {SCENARIOS.map((sc) => (
            <button key={sc.id} className="row in-sc" onClick={() => startDemo(sc)}>
              <span className="ic">{sc.icon}</span>
              <div style={{ flex: 1 }}>
                <b>{sc.title} <i className="muted" style={{ fontStyle: "normal", fontWeight: 400, fontSize: 11 }}>· {sc.steps.length}걸음</i></b>
                <small>{sc.sub}</small>
                <div className="in-covers">{sc.covers.map((c) => <span key={c}>{c}</span>)}</div>
              </div>
              <span className="chev">›</span>
            </button>
          ))}
          <p className="note" style={{ margin: 0 }}>주소로 바로: /inner?demo=jihu</p>
        </Sheet>
      )}

      {safety && <SafetySheet level={safety} onClose={() => { setSafety(null); if (demo) reset(); else router.push("/"); }} />}
    </div>
  );
}

/* ── 작은 도우미 ─────────────────────────────── */
const defaultTitle = (s: InnerState) => [s.place || "그 자리", s.object || "그날"].join(", ");
const keyLabel = (list: InnerOpt[], key: string) => list.find((o) => o.key === key)?.label ?? "";
/** 카드가 가리킨 것을 앞에 — 「카드」 표시 */
function opts(list: InnerOpt[], cardKey?: string): OptItem[] {
  const sorted = cardKey ? [...list.filter((o) => o.key === cardKey), ...list.filter((o) => o.key !== cardKey)] : list;
  return sorted.map((o) => ({ label: o.label, icon: o.key, mark: o.key === cardKey ? "카드" : undefined }));
}

/* ── ✏️ 웜업 고치기 — 무대에 선 뒤에도 이름 · 거리 · 장면을 바꾼다 (지난 말은 그대로) ── */
type WarmEdit = Pick<InnerState, "alias" | "avatar" | "distance" | "place" | "time" | "object">;
function WarmSheet({ s, onClose, onSave }: { s: InnerState; onClose: () => void; onSave: (w: WarmEdit) => void }) {
  const [w, setW] = useState<WarmEdit>({ alias: s.alias, avatar: s.avatar, distance: s.distance, place: s.place, time: s.time, object: s.object });
  const set = (p: Partial<WarmEdit>) => setW((x) => ({ ...x, ...p }));
  return (
    <Sheet onClose={onClose} label="웜업 고치기">
      <h3><Ico name="pencil" size={16} /> 웜업 고치기</h3>
      <p style={{ fontSize: 12.5 }}>바꿔도 지금까지 한 말은 그대로 남아. 고친 자리만 무대에 한 줄 적어 둘게.</p>
      <div className="grid2">
        {[false, true].map((av) => (
          <button key={String(av)} className={`in-choice sm${w.avatar === av ? " on" : ""}${av ? " av" : ""}`} aria-pressed={w.avatar === av} onClick={() => set({ avatar: av })}>
            <Portrait avatar={av} on={w.avatar === av} /><b>{av ? "아바타로" : "나로"}</b>
          </button>
        ))}
      </div>
      <label className="field-label">이름</label>
      <ComboBox items={INNER.options.alias.map((a) => ({ label: a }))} value={w.alias} onPick={(alias) => set({ alias })} maxLength={10} label="이름" />
      <label className="field-label">거리</label>
      <div className="in-dist" role="radiogroup">
        {[1, 2, 3].map((d) => (
          <button key={d} role="radio" aria-checked={w.distance === d} className={w.distance === d ? "on" : ""} onClick={() => set({ distance: d })}>
            <DistanceArt d={d} /><span>{DIST[d]}</span>
          </button>
        ))}
      </div>
      <label className="field-label">장소</label>
      <ComboBox items={opts(INNER.options.places)} value={w.place} onPick={(place) => set({ place })} label="장소" />
      <label className="field-label">시간</label>
      <ComboBox items={opts(INNER.options.times)} value={w.time} onPick={(time) => set({ time })} clearable="안 고를래" label="시간" />
      <label className="field-label">물건</label>
      <ComboBox items={opts(INNER.options.objects)} value={w.object} onPick={(object) => set({ object })} clearable="없음" label="물건" />
      <div className="grid2" style={{ marginTop: 4 }}>
        <button className="btn" onClick={onClose}>그대로 둘래</button>
        <button className="btn btn-tone" style={{ background: "var(--inner)", color: "#06111c" }} disabled={!w.alias.trim() || !w.place.trim()} onClick={() => onSave({ ...w, alias: w.alias.trim(), place: w.place.trim() })}>고친 걸로 이어 가기</button>
      </div>
    </Sheet>
  );
}

/* ── 🃏 오늘의 카드 ─────────────────────────────────── */
function CardStep({ onPick }: { onPick: (id?: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const cards = INNER.cards;
  const c = cards.find((x) => x.id === open);
  return (
    <div className="scroll">
      <div className="bub-wrap director"><div className="who">🎬 진행자</div><div className="bub">{actMeta("card").line}</div></div>
      <div className="in-cards">
        {cards.map((x) => (
          <button key={x.id} className={open === x.id ? "on" : ""} aria-pressed={open === x.id} aria-label={open === x.id ? x.name : "뒤집힌 카드"} onClick={() => setOpen(x.id)}>
            <CardArt open={open === x.id} icon={x.object} name={x.name} />
          </button>
        ))}
      </div>
      {c && (
        <div className="card card-inner in-clue">
          <h3>{c.icon} {c.name}</h3>
          <p>{c.clue}</p>
          <div className="in-covers" style={{ marginTop: 8 }}>
            <span><Ico name={c.place} size={11} /> {INNER.options.places.find((p) => p.key === c.place)?.label}</span>
            <span><Ico name={c.object} size={11} /> {INNER.options.objects.find((p) => p.key === c.object)?.label}</span>
            <span className="muted">← 장면 세우기에 미리 골라 둘게</span>
          </div>
        </div>
      )}
      <button className="btn btn-tone btn-block" disabled={!open} onClick={() => onPick(open ?? undefined)}>이 카드로</button>
      <button className="btn btn-ghost btn-block" onClick={() => onPick(undefined)}>카드 없이 갈래</button>
    </div>
  );
}

/* ── 커튼콜 뒤 — 다리 둘 ─────────────────────────────── */
function DoneStep({ piece, href, sealed, work, art, onToSituation }: { piece: ScenePiece; href: string; sealed: boolean; work?: string; art: React.ReactNode; onToSituation: (bone: string) => void }) {
  const [boneOpen, setBoneOpen] = useState(false);
  const [bone, setBone] = useState("");
  const texts = piece.takes.flatMap((t) => t.beats).filter((b) => b.who === "me").map((b) => b.text).concat([piece.scene.place, piece.scene.light, piece.title]);
  const sim = similarClassic(texts);
  const bones = [
    // 장소 · 이름은 안 넘어간다 — 뼈대만
    "하고 싶은 말을 끝내 못 함",
    "누군가 한 말이 계속 마음에 걸림",
    "중요한 순간에 실수했는데 괜찮다는 말을 들음",
  ];
  return (
    <div className="scroll">
      {art}
      <div className="card card-inner" style={{ textAlign: "center" }}>
        <h3>「{piece.title}」</h3>
        {piece.curtain?.lines.map((l) => <p key={l} style={{ margin: "4px 0 0" }}>📝 {l}</p>)}
        {piece.curtain?.tomorrow && <p style={{ color: "var(--inner)" }}>내일의 한마디 — {piece.curtain.tomorrow}</p>}
        <p className="muted" style={{ fontSize: 12 }}>🎬 내 씬에 넣었어 · 테이크 {piece.takes.length}{piece.demo ? " · 🧪 시나리오" : ""}</p>
      </div>

      {sealed ? (
        <p className="note">🛟 이 장면은 다리를 놓지 않고 따로 둘게.</p>
      ) : (
        <>
          <button className="row" onClick={() => setBoneOpen(true)}>
            <span className="ic">🎞</span>
            <div style={{ flex: 1 }}><b>이 장면, 상황극으로</b><small>{INNER.bridges.toSituation}</small></div>
            <span className="chev">›</span>
          </button>
          {sim && (
            <Link href={withWork(`/situation/${sim.id}`, work)} className="row">
              <span className="ic">🏛</span>
              <div style={{ flex: 1 }}><b>닮은 고전 — 「{sim.adaptTitle}」</b><small>{classicBridgeLine(sim)}</small></div>
              <span className="chev">›</span>
            </Link>
          )}
        </>
      )}
      <Link href={href} className="btn btn-tone btn-block">{work ? "🔗 이어 붙인 씬으로" : "🎬 내 씬에서 보기"}</Link>
      <Link href="/" className="btn btn-ghost btn-block">홈으로</Link>

      {boneOpen && (
        <Sheet onClose={() => setBoneOpen(false)} label="상황극으로 옮기기">
          <h3>🎞 가져가도 되는 뼈대 한 줄</h3>
          <p>이름 · 장소 · 원래 문장은 안 넘어가. 고른 이 한 줄만 다른 애 이야기로 바뀌어.</p>
          <ComboBox items={bones.map((b) => ({ label: b }))} value={bone} onPick={setBone} maxLength={40} placeholder="뼈대 한 줄 고르기" customPlaceholder="예: 중요한 순간에 실수했는데 친구가 괜찮다고 함" label="뼈대" />
          <button className="btn btn-tone btn-block" disabled={bone.trim().length < 4} onClick={() => onToSituation(bone.trim())}>상황극 카드 만들기</button>
        </Sheet>
      )}
    </div>
  );
}
