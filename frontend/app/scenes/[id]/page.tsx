"use client";

/**
 * 🧩 씬 조각 하나 — 테이크 · 나란히 · 고친 기록 (§15·§16)
 * 대사 고치기 · 마지막 컷 바꾸기 → 새 판본 + 고친 기록. 지우기는 정말 지울 때만.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Feed from "@/components/Feed";
import { castLooks } from "@/components/CastArt";
import SceneHeader from "@/components/SceneHeader";
import Sheet from "@/components/Sheet";
import SafetySheet from "@/components/SafetySheet";
import RevisionList from "@/components/RevisionList";
import InsightCard from "@/components/InsightCard";
import PieceAnatomyCard from "@/components/PieceAnatomyCard";
import { buildInsights, NOTE_MIN_PIECES } from "@/lib/insight";
import { ICON_TRACK, REASONS, SPICE, TASKS } from "@/lib/meta";
import { checkSafety, type SafetyLevel } from "@/lib/safety";
import {
  deletePiece, editLastCut, editLine, getArchetype, getPiece, loadWorks, logRevision, now, revisionsFor,
  saveWork, uid, useStore, loadMarks, loadPieces, loadRevisions,
} from "@/lib/store";
import { useQuery } from "@/lib/useQuery";
import type { Beat, Insight, InsightMark, ScenePiece } from "@/lib/types";

type Tab = "take" | "side" | "log";

export default function PieceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [q] = useQuery();
  const [p, ready] = useStore<ScenePiece | undefined>(() => getPiece(id), undefined);
  const [revs] = useStore(() => revisionsFor({ pieceId: id }), []);
  // 🔍 이 씬이 근거인 줄만 — 「보이는 것」은 따로 가는 곳이 아니라 씬 안에도 있다
  const [mine] = useStore<Insight[]>(() => {
    const all = loadPieces();
    if (all.length < NOTE_MIN_PIECES) return [];
    const revIds = new Set(revisionsFor({ pieceId: id }).map((r) => r.id));
    return buildInsights(all, loadRevisions(), loadWorks()).filter((i) =>
      i.evidence.some((e) => e.refs.includes(id) || e.refs.some((r) => revIds.has(r))));
  }, []);
  const [marks] = useStore(loadMarks, {} as Record<string, InsightMark>);
  const [tab, setTab] = useState<Tab>("take");
  const [takeN, setTakeN] = useState<number | null>(null);
  const [edit, setEdit] = useState<null | { kind: "line"; beat: Beat } | { kind: "lastCut" }>(null);
  const [toWork, setToWork] = useState(false);
  const [del, setDel] = useState(0);
  const [logMode, setLogMode] = useState<"changed" | "timeline">("changed");
  const [safety, setSafety] = useState<SafetyLevel | null>(null);

  useEffect(() => { if (q.view === "side") setTab("side"); }, [q.view]);

  if (!ready) return null;
  if (!p) return (
    <>
      <TopBar back="/scenes" title="씬을 못 찾았어" />
      <div className="empty"><span className="big">🗄</span>지워졌거나 없는 씬이야.</div>
    </>
  );

  const take = p.takes.find((t) => t.n === (takeN ?? p.takes.at(-1)!.n)) ?? p.takes.at(-1)!;
  const arch = p.source.track === "situation" ? getArchetype(p.source.archetypeId) : undefined;
  const trackCls = p.source.track === "situation" ? "track-sit" : "track-inner";

  return (
    <div className={`track ${trackCls}`}>
      <TopBar back="/scenes" title={`${ICON_TRACK[p.source.track]} ${p.title}`}
        sub={`테이크 ${p.takes.length} · ${SPICE[p.spice].icon}${p.task ? ` · ${TASKS[p.task.kind].icon} ${TASKS[p.task.kind].label}` : ""}${p.source.track === "inner" && p.source.avatar ? " · 🎭 아바타" : ""}`} />
      <div className="scroll">
        {q.new && <div className="card card-tone" style={{ fontSize: 13 }}>🎬 내 씬에 넣었어. 저장 버튼은 없어 — 끝나면 저절로 남아.</div>}

        <div className="tabs">
          <button className={tab === "take" ? "on" : ""} onClick={() => setTab("take")}>🎞 테이크</button>
          <button className={tab === "side" ? "on" : ""} onClick={() => setTab("side")}>↔ 나란히</button>
          <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>✏️ 고친 기록 {revs.length || ""}</button>
        </div>

        {tab === "take" && (
          <>
            <div className="chips">
              {p.takes.map((t) => (
                <button key={t.n} className={`chip ${t.n === take.n ? "on" : ""}`} onClick={() => setTakeN(t.n)}>
                  T{t.n}{t.reason ? ` · ${t.reason}` : ""}
                </button>
              ))}
            </div>
            <SceneHeader scene={p.scene} compact />
            <PieceAnatomyCard p={p} take={take} />
            <p className="muted" style={{ fontSize: 11.5, margin: 0 }}>내 대사를 누르면 고칠 수 있어. 고쳐도 전 판본은 남아.</p>
            <Feed beats={take.beats} meName={p.scene.me.name} otherName={p.scene.other.name || "상대"} meLook={p.scene.me.look} otherLook={p.scene.other.look} looks={castLooks(p.scene)}
              onBeatTap={(b) => b.who === "me" && setEdit({ kind: "line", beat: b })} />

            {take.branches.length > 0 && (
              <div className="card"><div className="label">🌟 나였다면? 가지</div>
                <ul className="list" style={{ marginTop: 6 }}>{take.branches.map((b, i) => <li key={i}>「{b}」</li>)}</ul>
              </div>
            )}

            <div className="card card-tone">
              <div className="label">🎬 마지막 컷 · T{take.n}</div>
              <p style={{ color: "var(--ink)", fontSize: 15 }}>「{take.lastCut.line || "…"}」</p>
              {take.lastCut.direction && <p><i>*{take.lastCut.direction}*</i></p>}
              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setEdit({ kind: "lastCut" })}>✏️ 마지막 컷 바꾸기</button>
            </div>

            {p.curtain && (
              <div className="card card-inner">
                <div className="label">🎭 커튼콜</div>
                {p.curtain.lines.map((l) => <p key={l}>📝 {l}</p>)}
                {p.curtain.tomorrow && <p style={{ color: "var(--inner)" }}>내일의 한마디 — {p.curtain.tomorrow}</p>}
              </div>
            )}
            {p.facts.length > 0 && (
              <div className="card"><div className="label">🟡 이 씬에서 생긴 새 사실</div>
                <ul className="list" style={{ marginTop: 6 }}>{p.facts.map((f) => <li key={f}>{f}</li>)}</ul></div>
            )}
          </>
        )}

        {tab === "side" && (
          <>
            <p className="lead">같은 자리의 내 한 줄을 옆으로. 맞고 틀린 건 없어.</p>
            <div className="side">
              {p.takes.map((t) => {
                const mine = t.beats.filter((b) => b.who === "me");
                return (
                  <div key={t.n}>
                    <h5>테이크 {t.n}{t.reason ? ` · ${t.reason}` : ""}</h5>
                    <div>🎬 「{t.lastCut.line || "…"}」</div>
                    {t.lastCut.direction && <div className="muted"><i>*{t.lastCut.direction}*</i></div>}
                    <div className="sep" style={{ margin: "8px 0" }} />
                    <div className="muted" style={{ fontSize: 11.5 }}>내 말 {mine.length}줄 · 다이얼 🔥{t.dials.honesty} 👀{t.dials.eyes} 🪨{t.dials.stubborn} 🎭{t.dials.play}</div>
                    {mine.slice(-2).map((b) => <div key={b.id} style={{ marginTop: 4 }}>· {b.text}</div>)}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "log" && (
          <>
            <div className="chips">
              <button className={`chip ${logMode === "changed" ? "on" : ""}`} onClick={() => setLogMode("changed")}>🖍 바뀐 것만</button>
              <button className={`chip ${logMode === "timeline" ? "on" : ""}`} onClick={() => setLogMode("timeline")}>🕰 타임라인</button>
            </div>
            <RevisionList revisions={revs} mode={logMode} />
          </>
        )}

        {mine.filter((i) => marks[i.key]?.mark !== "no").length > 0 && (
          <section className="track-note" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="label" style={{ color: "var(--note)" }}>🔍 이 씬에서 보이는 것</div>
            {mine.filter((i) => marks[i.key]?.mark !== "no").map((i) => (
              <InsightCard key={i.key} i={i} m={marks[i.key]} onUnsafe={setSafety} hideGoto={i.goto?.href.startsWith(`/scenes/${id}`)} />
            ))}
          </section>
        )}

        <div className="sep" />
        <div className="grid2">
          {arch ? <Link href={`/situation/${arch.id}?piece=${p.id}`} className="btn">⏪ 한 테이크 더</Link>
            : <Link href="/inner" className="btn">🪞 새 장면 세우기</Link>}
          <button className="btn btn-tone" onClick={() => setToWork(true)}>🔗 다른 씬과 잇기</button>
        </div>
        <button className="btn btn-danger btn-block btn-sm" onClick={() => setDel(1)}>지우기</button>
      </div>

      {edit && (
        <EditSheet
          title={edit.kind === "line" ? "✏️ 대사 고치기" : "🎬 마지막 컷 바꾸기"}
          initial={edit.kind === "line" ? edit.beat.text : take.lastCut.line}
          initial2={edit.kind === "lastCut" ? take.lastCut.direction : undefined}
          chips={edit.kind === "line" ? REASONS.line : REASONS.lastCut}
          onClose={() => setEdit(null)}
          onSave={(text, text2, chip) => {
            const hit = checkSafety(text + " " + (text2 ?? ""));
            if (hit) { setSafety(hit.level); setEdit(null); return; }
            if (edit.kind === "line") editLine(p.id, take.n, edit.beat.id, text, chip);
            else {
              editLastCut(p.id, take.n, "line", text, chip);
              if (text2 !== undefined) editLastCut(p.id, take.n, "direction", text2, chip);
            }
            setEdit(null);
          }}
        />
      )}

      {toWork && <ToWorkSheet piece={p} takeN={take.n} onClose={() => setToWork(false)} onDone={(wid) => router.push(`/scenes/join/${wid}`)} />}

      {del > 0 && (
        <Sheet onClose={() => setDel(0)} label="지우기">
          <h3>정말 지울까?</h3>
          <p>「{p.title}」 테이크 {p.takes.length}개와 고친 기록 {revs.length}줄이 같이 지워져. 이어 붙인 씬에서도 빠져.<br /><b>되살리기는 없어.</b></p>
          {del === 1 ? (
            <div className="grid2">
              <button className="btn" onClick={() => setDel(0)}>그냥 둘래</button>
              <button className="btn btn-danger" onClick={() => setDel(2)}>지울래</button>
            </div>
          ) : (
            <div className="grid2">
              <button className="btn" onClick={() => setDel(0)}>아니, 둘래</button>
              <button className="btn btn-danger" onClick={() => { deletePiece(p.id); router.push("/scenes"); }}>진짜 지우기</button>
            </div>
          )}
        </Sheet>
      )}
      {safety && <SafetySheet level={safety} onClose={() => setSafety(null)} />}
    </div>
  );
}

function EditSheet({
  title, initial, initial2, chips, onClose, onSave,
}: {
  title: string; initial: string; initial2?: string; chips: readonly string[];
  onClose: () => void; onSave: (text: string, text2: string | undefined, chip?: string) => void;
}) {
  const [t, setT] = useState(initial);
  const [t2, setT2] = useState(initial2);
  const [chip, setChip] = useState<string>();
  return (
    <Sheet onClose={onClose} label={title}>
      <h3>{title}</h3>
      <p className="muted" style={{ fontSize: 12 }}>전: 「{initial}」</p>
      <textarea className="ta" rows={2} value={t} onChange={(e) => setT(e.target.value)} />
      {initial2 !== undefined && <input className="field" value={t2} onChange={(e) => setT2(e.target.value)} placeholder="지문 한 줄" />}
      <div className="label">왜 고쳤어? (안 써도 돼)</div>
      <div className="chips">{chips.map((c) => <button key={c} className={`chip ${chip === c ? "on" : ""}`} onClick={() => setChip(chip === c ? undefined : c)}>{c}</button>)}</div>
      <button className="btn btn-tone btn-block" disabled={!t.trim() || (t === initial && t2 === initial2)} onClick={() => onSave(t.trim(), t2?.trim(), chip)}>새 판본으로 남기기</button>
    </Sheet>
  );
}

function ToWorkSheet({ piece, takeN, onClose, onDone }: { piece: ScenePiece; takeN: number; onClose: () => void; onDone: (workId: string) => void }) {
  const works = loadWorks();
  const place = (wid?: string) => {
    let w = works.find((x) => x.id === wid);
    if (!w) {
      w = { id: uid("w"), title: piece.title, frame: "free", slots: [], done: false, createdAt: now(), updatedAt: now() };
    }
    const nw = { ...w, slots: [...w.slots, { pieceId: piece.id, takeN, carryFacts: [] }] };
    saveWork(nw);
    logRevision({ target: { workId: nw.id, field: "slotAdd", label: `S#${nw.slots.length} 놓기` }, before: "", after: `${piece.title} (T${takeN})` });
    onDone(nw.id);
  };
  return (
    <Sheet onClose={onClose} label="다른 씬과 잇기">
      <h3>🔗 어디에 이을까?</h3>
      <p>테이크 {takeN}을 이을게. 이은 뒤에 순서·테이크를 바꿀 수 있어.</p>
      {works.map((w) => (
        <button key={w.id} className="row" onClick={() => place(w.id)}>
          <span className="ic">📖</span><div style={{ flex: 1 }}><b>「{w.title}」</b><small>씬 {w.slots.length}개{w.done ? " · 완성" : ""}</small></div><span className="chev">＋</span>
        </button>
      ))}
      <button className="btn btn-tone btn-block" onClick={() => place()}>＋ 새로 잇기 시작</button>
    </Sheet>
  );
}
