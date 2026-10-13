"use client";

/**
 * 🎬 내 씬 — 씬이 다 모이는 한 곳.
 *   · 씬 하나 (🎞 상황극 · 🪞 내 무대) 와 🔗 이어 붙인 씬 이 같은 목록에
 *   · 🔗 이어 붙이기 = 이 목록에서 씬을 차례로 골라 잇는 것 (따로 가는 곳 없음)
 *   · 🔍 보이는 것 = 내가 쓴 말 · 고친 자리에서 보이는 줄. 맨 위에, 그리고 각 씬 안에
 *   · 👣 여섯 걸음 = ✨ 소개 「모으기」의 걸음 — 걸은 데는 켜지고, 다음 한 가지만 알려 준다
 *   · 🧪 동작 시나리오 = 소개의 「하은이의 2주」를 단계별로 채워 화면을 확인 (/scenes?scenario=d2)
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";
import PieceCard from "@/components/PieceCard";
import InsightCard from "@/components/InsightCard";
import BackupCard from "@/components/BackupCard";
import JourneyStrip from "@/components/JourneyStrip";
import { ScenarioBanner, ScenarioEntry } from "@/components/ScenarioPanel";
import Sheet from "@/components/Sheet";
import SafetySheet from "@/components/SafetySheet";
import { buildInsights, NOTE_MIN_PIECES } from "@/lib/insight";
import { FRAMES, ICON_TRACK } from "@/lib/meta";
import { goStep, loadDemo, stepIndex } from "@/lib/scenario";
import copy from "@/data/scenes.json";
import type { SafetyLevel } from "@/lib/safety";
import {
  loadMarks, loadPieces, loadRevisions, loadWorks, logRevision, now, saveWork, uid, useStore,
} from "@/lib/store";
import { useQuery } from "@/lib/useQuery";
import type { Frame, InsightMark, ScenePiece, Work } from "@/lib/types";

type Filter = "all" | "situation" | "inner" | "joined";
/** 이 개수부터 이어 붙이면 「📖 나만의 이야기」 틀로 시작 */
const STORY_MIN = 5;

export default function Scenes() {
  const router = useRouter();
  const [q] = useQuery();
  const [pieces, ready] = useStore(loadPieces, []);
  const [works] = useStore(loadWorks, []);
  const [revisions] = useStore(loadRevisions, []);
  const [marks] = useStore(loadMarks, {} as Record<string, InsightMark>);
  const [f, setF] = useState<Filter>("all");
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [allSeen, setAllSeen] = useState(false);
  const [month, setMonth] = useState(false);
  const [safety, setSafety] = useState<SafetyLevel | null>(null);
  const [frame, setFrame] = useState<Frame | "auto">("auto");
  const [demo] = useStore(loadDemo, null);

  useEffect(() => { if (q.f === "joined") setF("joined"); }, [q.f]);
  // /scenes?scenario=d2 — 그 단계로 바로 채우고 주소는 깨끗하게
  useEffect(() => {
    if (!q.scenario || stepIndex(q.scenario) < 0) return;
    goStep(q.scenario);
    router.replace("/scenes");
  }, [q.scenario, router]);

  const insights = buildInsights(pieces, revisions, works).filter((i) => marks[i.key]?.mark !== "no");
  const fresh = insights.filter((i) => !marks[i.key]);
  const shown = allSeen ? insights : (fresh.length ? fresh : insights).slice(0, 2);

  const count = (t: Filter) =>
    t === "joined" ? works.length : pieces.filter((p) => t === "all" || p.source.track === t).length + (t === "all" ? works.length : 0);

  // 씬과 이어 붙인 씬을 한 줄로 — 최근에 만진 것부터
  type Row = { kind: "piece"; p: ScenePiece; at: string } | { kind: "work"; w: Work; at: string };
  const rows: Row[] = [
    ...(f === "joined" ? [] : pieces.filter((p) => f === "all" || p.source.track === f).map((p) => ({ kind: "piece" as const, p, at: p.updatedAt }))),
    ...(f === "all" || f === "joined" ? works.map((w) => ({ kind: "work" as const, w, at: w.updatedAt })) : []),
  ].sort((a, b) => b.at.localeCompare(a.at));

  /** 고른 틀 — 「알아서」면 5개부터 📖 나만의 이야기 */
  const joinFrame: Frame = frame !== "auto" ? frame : picked.length >= STORY_MIN ? "story" : "free";
  const slotName = (n: number) => FRAMES[joinFrame].slots[n] ?? `S#${n + 1}`;

  function togglePick(id: string) {
    setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  }

  function join() {
    const ps = picked.map((id) => pieces.find((p) => p.id === id)!).filter(Boolean);
    const w: Work = {
      // 5개 이상이면 📖 나만의 이야기 — 인트로 → 본론 → 갈등 하이라이트 → 결론
      id: uid("w"), title: ps[0]?.title ?? "이어 붙인 씬", frame: joinFrame,
      slots: ps.map((p) => ({ pieceId: p.id, takeN: p.takes.at(-1)!.n, carryFacts: [] })),
      done: false, createdAt: now(), updatedAt: now(),
    };
    saveWork(w);
    logRevision({ target: { workId: w.id, field: "slotAdd", label: `씬 ${ps.length}개 이어 붙이기` }, before: "", after: ps.map((p) => p.title).join(" → ") });
    router.push(`/scenes/join/${w.id}`);
  }

  return (
    <>
      <TopBar
        title="🎬 내 씬"
        sub={`씬 ${pieces.length}개${works.length ? ` · 이어 붙인 씬 ${works.length}개` : ""}`}
        right={pieces.length >= 2 && (
          <button className={`btn btn-sm ${picking ? "btn-tone" : ""}`} style={picking ? { background: "var(--work)" } : undefined}
            onClick={() => { setPicking(!picking); setPicked([]); setFrame("auto"); }}>
            {picking ? "그만" : "🔗 이어 붙이기"}
          </button>
        )}
      />

      <div className="scroll">
        {demo && !picking && <ScenarioBanner demo={demo} />}
        {!picking && ready && <JourneyStrip pieces={pieces} works={works} revisions={revisions} marks={marks} />}

        {/* 🔍 보이는 것 — 따로 가는 노트가 아니라, 내 씬 맨 위 */}
        {!picking && ready && pieces.length > 0 && (
          pieces.length < NOTE_MIN_PIECES ? (
            <div className="card" style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>
              🔍 씬이 {NOTE_MIN_PIECES}개 모이면 여기 「네 씬에서 보이는 것」이 생겨. (지금 {pieces.length}개)
            </div>
          ) : insights.length > 0 && (
            <section className="track-note" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="h2" style={{ color: "var(--note)", margin: 0 }}>
                🔍 네 씬에서 보이는 것 {fresh.length > 0 && <span className="pill" style={{ color: "var(--note)" }}>새 줄 {fresh.length}</span>}
              </div>
              <p className="muted" style={{ fontSize: 11.5, margin: 0 }}>네가 쓴 말과 고친 자리만 모았어. 맞는지는 네가 정해.</p>
              {shown.map((i) => <InsightCard key={i.key} i={i} m={marks[i.key]} onUnsafe={setSafety} />)}
              {insights.length > shown.length && (
                <button className="btn btn-sm btn-ghost" onClick={() => setAllSeen(true)}>더 보기 ({insights.length - shown.length})</button>
              )}
            </section>
          )
        )}

        {picking ? (
          <div className="card" style={{ borderColor: "#3a2d5a", fontSize: 13 }}>
            {copy.picking.lead}
            <div className="label" style={{ marginTop: 10 }}>{copy.picking.frameLabel}</div>
            <div className="chips" style={{ marginTop: 6 }}>
              <button className={`chip ${frame === "auto" ? "on" : ""}`} onClick={() => setFrame("auto")}>{copy.picking.auto}</button>
              {(Object.keys(FRAMES) as Frame[]).map((k) => (
                <button key={k} className={`chip ${frame === k ? "on" : ""}`} onClick={() => setFrame(k)}>{FRAMES[k].icon} {FRAMES[k].label}</button>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              {frame === "auto"
                ? (picked.length >= STORY_MIN ? `📖 ${FRAMES.story.shape}` : copy.picking.autoHint)
                : FRAMES[frame].shape}
            </div>
            {FRAMES[joinFrame].slots.length > 0 && (
              <div className="frame-slots" aria-label="칸">
                {FRAMES[joinFrame].slots.map((sl, k) => (
                  <span key={sl} className={k < picked.length ? "on" : ""}>{sl}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="tabs">
            {(["all", "situation", "inner", "joined"] as Filter[]).map((t) => (
              <button key={t} className={f === t ? "on" : ""} onClick={() => setF(t)}>
                {t === "all" ? "전체" : t === "situation" ? "🎞" : t === "inner" ? "🪞" : "🔗 이은 씬"} {count(t)}
              </button>
            ))}
          </div>
        )}

        {ready && pieces.length === 0 && (
          <div className="empty">
            <span className="big">🎬</span>
            아직 비어 있어. 씬 하나가 끝나면 저절로 여기 쌓여.<br />저장 버튼은 없어.
            <div className="grid2" style={{ marginTop: 14 }}>
              <Link href="/situation" className="btn btn-sm">🎞 상황극 하나</Link>
              <Link href="/inner" className="btn btn-sm">🪞 장면 하나</Link>
            </div>
          </div>
        )}

        {picking
          ? pieces.map((p) => {
              const n = picked.indexOf(p.id);
              return <PieceCard key={p.id} p={p} picked={n >= 0} onClick={() => togglePick(p.id)}
                right={<span className="pill" style={n >= 0 ? { background: "var(--work)", color: "#160d26" } : undefined}>{n >= 0 ? `S#${n + 1}${FRAMES[joinFrame].slots[n] ? ` · ${slotName(n)}` : ""}` : "＋"}</span>} />;
            })
          : rows.map((r) => r.kind === "piece"
              ? <PieceCard key={r.p.id} p={r.p} href={`/scenes/${r.p.id}`} />
              : <WorkRow key={r.w.id} w={r.w} pieces={pieces} />)}

        {!picking && pieces.length > 0 && (
          <>
            <button className="row" onClick={() => setMonth(true)}>
              <span className="ic">🗓</span>
              <div style={{ flex: 1 }}><b>한 달 돌아보기</b><small>「이번 달 네 마지막 컷들, 나란히 놓아 볼까?」</small></div>
              <span className="chev">›</span>
            </button>
            <p className="note">성격 · 유형 · 진단 이름은 없어. 점수도 그래프도 없어 — 내 문장 나란히 보기가 다야.</p>
          </>
        )}
        {!picking && !demo && <ScenarioEntry />}
        {!picking && <BackupCard />}
      </div>

      {picking ? (
        <div className="composer">
          <button className="btn btn-block" style={{ background: "var(--work)", color: "#160d26", borderColor: "transparent" }}
            disabled={picked.length < 2} onClick={join}>
            🔗 {picked.length < 2 ? copy.picking.min : `${FRAMES[joinFrame].icon} 씬 ${picked.length}개 이어 붙이기`}
          </button>
        </div>
      ) : <TabBar />}

      {month && (
        <Sheet onClose={() => setMonth(false)} label="한 달 돌아보기">
          <h3>🗓 이번 달 마지막 컷들</h3>
          {pieces
            .filter((p) => Date.now() - new Date(p.updatedAt).getTime() < 31 * 86_400_000)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((p) => (
              <Link key={p.id} href={`/scenes/${p.id}`} className="row">
                <span className="ic">{ICON_TRACK[p.source.track]}</span>
                <div style={{ flex: 1 }}>
                  <small style={{ marginTop: 0 }}>{new Date(p.createdAt).getMonth() + 1}/{new Date(p.createdAt).getDate()} · {p.title}</small>
                  <b style={{ fontWeight: 500 }}>「{p.takes.at(-1)?.lastCut.line || "…"}」</b>
                </div>
              </Link>
            ))}
        </Sheet>
      )}
      {safety && <SafetySheet level={safety} onClose={() => setSafety(null)} />}
    </>
  );
}

/** 🔗 이어 붙인 씬 — 목록 안에서 씬과 나란히 */
function WorkRow({ w, pieces }: { w: Work; pieces: ScenePiece[] }) {
  const icons = w.slots.map((s) => {
    const p = pieces.find((x) => x.id === s.pieceId);
    return p ? ICON_TRACK[p.source.track] : "·";
  });
  const hasInner = w.slots.some((s) => pieces.find((p) => p.id === s.pieceId)?.source.track === "inner");
  return (
    <Link href={`/scenes/join/${w.id}`} className="piece" style={{ borderColor: "#3a2d5a", background: "#161027" }}>
      <div className="p-h"><span>🔗</span><span style={{ flex: 1 }}>{w.title}</span>{w.done && <span className="pill">✅</span>}</div>
      <div className="p-meta">
        <span>씬 {w.slots.length}개 · {icons.join(" → ")}</span>
        {hasInner && <span>🔒 나만 보기</span>}
      </div>
      {w.caption && <div className="p-cut">「{w.caption}」</div>}
    </Link>
  );
}
