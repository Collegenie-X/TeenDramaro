"use client";

/**
 * 화면 12 · 📖 조립대 (§13·§14)
 *   📖 조립      놓기 · 테이크 고르기 · 순서(끌어다 놓기 / ↑↓) · 〰 이음새 · 🟡 넘기기 · ＋ 빈 씬 세우기
 *   ▶ 이어서 보기 마지막 컷 · 이음새 · 자막만 모은 판
 *   ✏️ 고친 기록  바뀐 것만 · 나란히 · 타임라인
 * 완성해도 잠기지 않는다 — 다시 열어 고칠 수 있다.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Sheet from "@/components/Sheet";
import PieceCard from "@/components/PieceCard";
import SafetySheet from "@/components/SafetySheet";
import RevisionList from "@/components/RevisionList";
import { FRAMES, ICON_TRACK, REASONS } from "@/lib/meta";
import { checkSafety, type SafetyLevel } from "@/lib/safety";
import {
  deleteWork, getWork, loadPieces, revisionsFor, setRevisionReason, updateWork, useStore,
} from "@/lib/store";
import { useQuery } from "@/lib/useQuery";
import type { Frame, Revision, ScenePiece, Slot, Work } from "@/lib/types";

type Tab = "build" | "read" | "log";

export default function WorkScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [q] = useQuery();
  const [w, ready] = useStore<Work | undefined>(() => getWork(id), undefined);
  const [pieces] = useStore(loadPieces, []);
  const [revs] = useStore(() => revisionsFor({ workId: id }), []);
  const [tab, setTab] = useState<Tab>("build");
  const [picker, setPicker] = useState(false);
  const [blank, setBlank] = useState(false);
  const [finish, setFinish] = useState(false);
  const [del, setDel] = useState(0);
  const [toast, setToast] = useState<Revision | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [logMode, setLogMode] = useState<"changed" | "side" | "timeline">("changed");
  const [safety, setSafety] = useState<SafetyLevel | null>(null);

  useEffect(() => { if (q.tab === "log") setTab("log"); if (q.tab === "read") setTab("read"); }, [q.tab]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);

  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  if (!ready) return null;
  if (!w) return (
    <>
      <TopBar back="/scenes?f=joined" title="이어 붙인 씬을 못 찾았어" />
      <div className="empty"><span className="big">📖</span>지워졌거나 없는 이어 붙인 씬이야.</div>
    </>
  );

  const W = w;
  const frame = FRAMES[W.frame];
  const slotLabel = (s: Slot) => {
    const p = byId.get(s.pieceId);
    return p ? `${p.title} (T${s.takeN})` : "(지운 씬)";
  };
  const orderText = (slots: Slot[]) => slots.map((s, i) => `S#${i + 1} ${slotLabel(s)}`).join(" / ");
  const hasInner = W.slots.some((s) => byId.get(s.pieceId)?.source.track === "inner");

  /** 구조가 바뀌면 — 고친 기록 + 「왜?」 토스트 */
  function structural(slots: Slot[], field: Revision["target"]["field"], label: string, before: string, after: string) {
    const rev = updateWork({ ...W, slots }, field, label, before, after);
    if (rev) setToast(rev);
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= W.slots.length || from === to) return;
    const slots = [...W.slots];
    const [x] = slots.splice(from, 1);
    slots.splice(to, 0, x);
    structural(slots, "order", "순서 바꾸기", orderText(W.slots), orderText(slots));
  }
  function remove(i: number) {
    const slots = W.slots.filter((_, k) => k !== i);
    structural(slots, "slotRemove", `S#${i + 1} 빼기`, slotLabel(W.slots[i]), "");
  }
  function add(p: ScenePiece) {
    const s: Slot = { pieceId: p.id, takeN: p.takes.at(-1)!.n, carryFacts: [] };
    structural([...W.slots, s], "slotAdd", `S#${W.slots.length + 1} 놓기`, "", slotLabel(s));
    setPicker(false);
  }
  function setTake(i: number, n: number) {
    const slots = W.slots.map((s, k) => (k === i ? { ...s, takeN: n } : s));
    updateWork({ ...W, slots }, "slotTake", `S#${i + 1} 테이크 고르기`, `T${W.slots[i].takeN}`, `T${n}`);
  }
  function setSeam(i: number, seam: string) {
    if ((W.slots[i].seam ?? "") === seam) return;
    if (checkSafety(seam)) { setSafety(checkSafety(seam)!.level); return; }
    const slots = W.slots.map((s, k) => (k === i ? { ...s, seam: seam || undefined } : s));
    updateWork({ ...W, slots }, "seam", `S#${i + 1}→S#${i + 2} 이음새`, W.slots[i].seam ?? "", seam);
  }
  function toggleFact(i: number, f: string) {
    const cur = W.slots[i].carryFacts;
    const next = cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f];
    const slots = W.slots.map((s, k) => (k === i ? { ...s, carryFacts: next } : s));
    updateWork({ ...W, slots }, "slotTake", `S#${i + 1} 🟡 넘긴 새 사실`, cur.join(", "), next.join(", "));
  }
  function setTitle(t: string) {
    if (!t.trim() || t === W.title) return;
    if (checkSafety(t)) { setSafety(checkSafety(t)!.level); return; }
    updateWork({ ...W, title: t.trim() }, "title", "제목", W.title, t.trim());
  }

  const emptyGuides = frame.slots.slice(W.slots.length);
  const unused = pieces.filter((p) => !W.slots.some((s) => s.pieceId === p.id));

  return (
    <div className="track">
      <TopBar back="/scenes?f=joined" title={`🔗 「${W.title}」`}
        sub={`${frame.icon} ${frame.label} · 씬 ${W.slots.length}개${W.done ? " · ✅ 완성(열려 있음)" : ""}`}
        right={hasInner ? <span className="pill">🔒 나만 보기</span> : undefined} />

      <div className="scroll">
        <div className="tabs">
          <button className={tab === "build" ? "on" : ""} onClick={() => setTab("build")}>🔗 잇기</button>
          <button className={tab === "read" ? "on" : ""} onClick={() => setTab("read")}>▶ 이어서 보기</button>
          <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>✏️ 고친 기록 {revs.length || ""}</button>
        </div>

        {tab === "build" && (
          <>
            <label className="field-label">제목</label>
            <input className="field" defaultValue={W.title} key={W.title} onBlur={(e) => setTitle(e.target.value)} />
            <div className="label">틀 — 안 골라도 돼</div>
            <div className="chips">
              {(Object.keys(FRAMES) as Frame[]).map((k) => (
                <button key={k} className={`chip ${W.frame === k ? "on" : ""}`}
                  onClick={() => updateWork({ ...W, frame: k }, "title", "틀 바꾸기", FRAMES[W.frame].label, FRAMES[k].label)}>
                  {FRAMES[k].icon} {FRAMES[k].label}
                </button>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 11.5, margin: 0 }}>{frame.shape} · 🎞과 🪞을 섞어도 돼.</p>

            {W.slots.map((s, i) => {
              const p = byId.get(s.pieceId);
              const prev = i > 0 ? byId.get(W.slots[i - 1].pieceId) : undefined;
              return (
                <div key={s.pieceId + i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {i > 0 && (
                    <div className="seam">
                      <span>〰</span>
                      <input defaultValue={W.slots[i - 1].seam ?? ""} key={W.slots[i - 1].seam ?? ""} placeholder="이음새 한 줄 (비워도 돼)"
                        onBlur={(e) => setSeam(i - 1, e.target.value.trim())} />
                    </div>
                  )}
                  <div
                    className={`slot ${dragOver === i ? "drag-over" : ""}`}
                    draggable
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); setDragOver(null); }}
                  >
                    <div className="slot-h">
                      <span className="no">S#{i + 1}</span>
                      {frame.slots[i] && <span className="pill">{frame.slots[i]}</span>}
                      <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="위로">↑</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => move(i, i + 1)} disabled={i === W.slots.length - 1} aria-label="아래로">↓</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => remove(i)} aria-label="빼기">✕</button>
                      </span>
                    </div>
                    {p ? (
                      <>
                        <Link href={`/scenes/${p.id}`} style={{ textDecoration: "none" }}><b>{ICON_TRACK[p.source.track]} {p.title}</b></Link>
                        <div className="chips">
                          {p.takes.map((t) => (
                            <button key={t.n} className={`chip ${t.n === s.takeN ? "on" : ""}`} onClick={() => setTake(i, t.n)}>T{t.n}</button>
                          ))}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                          🎬 「{p.takes.find((t) => t.n === s.takeN)?.lastCut.line || "…"}」
                        </div>
                        {prev && prev.facts.length > 0 && (
                          <div>
                            <div className="label">🟡 앞 씬에서 넘길 새 사실</div>
                            <div className="chips" style={{ marginTop: 4 }}>
                              {prev.facts.map((f) => (
                                <button key={f} className={`chip ${s.carryFacts.includes(f) ? "on" : ""}`} onClick={() => toggleFact(i, f)}>🟡 {f}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : <span className="muted">(지운 씬이야 — 빼도 돼)</span>}
                  </div>
                </div>
              );
            })}

            {emptyGuides.map((g, k) => (
              <div key={g} className="slot-empty">S#{W.slots.length + k + 1} · {g}</div>
            ))}

            <div className="grid2">
              <button className="btn" onClick={() => setPicker(true)} disabled={unused.length === 0}>🎬 내 씬에서 더하기</button>
              <button className="btn" onClick={() => setBlank(true)}>＋ 빈 씬 세우기</button>
            </div>
            <div className="grid2">
              <button className="btn" onClick={() => setTab("read")} disabled={!W.slots.length}>▶ 이어서 보기</button>
              <button className="btn btn-tone" onClick={() => setFinish(true)} disabled={W.slots.length < 1}>{W.done ? "✅ 완성 고치기" : "✅ 완성"}</button>
            </div>
            <button className="btn btn-danger btn-sm btn-block" onClick={() => setDel(1)}>이어 붙인 것만 풀기</button>
            {hasInner && <p className="note">🪞 씬이 들어간 이어 붙인 씬은 기본이 나만 보기야.</p>}
          </>
        )}

        {tab === "read" && <Reading w={W} byId={byId} />}

        {tab === "log" && (
          <>
            <div className="chips">
              <button className={`chip ${logMode === "changed" ? "on" : ""}`} onClick={() => setLogMode("changed")}>🖍 바뀐 것만</button>
              <button className={`chip ${logMode === "side" ? "on" : ""}`} onClick={() => setLogMode("side")}>↔ 나란히</button>
              <button className={`chip ${logMode === "timeline" ? "on" : ""}`} onClick={() => setLogMode("timeline")}>🕰 타임라인</button>
            </div>
            {logMode === "side" ? (
              W.slots.map((s, i) => {
                const p = byId.get(s.pieceId);
                if (!p) return null;
                return (
                  <div key={s.pieceId + i}>
                    <div className="label">S#{i + 1} {ICON_TRACK[p.source.track]} {p.title}</div>
                    <div className="side" style={{ marginTop: 6 }}>
                      {p.takes.map((t) => (
                        <div key={t.n} style={t.n === s.takeN ? { borderColor: "var(--work)" } : undefined}>
                          <h5>T{t.n}{t.n === s.takeN ? " · 여기 씀" : ""}</h5>「{t.lastCut.line || "…"}」
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : <RevisionList revisions={revs} mode={logMode} />}
          </>
        )}
      </div>

      {toast && (
        <div className="toast">
          <p>✏️ 고쳤어 — 전 판본은 그대로 남아. 왜 고쳤어? (안 써도 돼)</p>
          <div className="chips">
            {REASONS.work.map((c) => (
              <button key={c} className="chip" onClick={() => { setRevisionReason(toast.id, { chip: c }); setToast(null); }}>{c}</button>
            ))}
            <button className="chip" onClick={() => setToast(null)}>건너뛰기</button>
          </div>
        </div>
      )}

      {picker && (
        <Sheet onClose={() => setPicker(false)} label="내 씬에서 더하기">
          <h3>🎬 내 씬에서 고르기</h3>
          <p>{frame.slots[W.slots.length] ? `이번 자리: ${frame.slots[W.slots.length]}` : "놓고 싶은 만큼."}</p>
          {unused.map((p) => <PieceCard key={p.id} p={p} onClick={() => add(p)} right={<span className="pill">＋</span>} />)}
        </Sheet>
      )}

      {blank && (
        <Sheet onClose={() => setBlank(false)} label="빈 씬 세우기">
          <h3>＋ 빈 씬 세우기</h3>
          <p>사이에 필요한 장면이 없으면 지금 만들자. 끝나면 이 끝에 바로 이어져.</p>
          <Link href={`/situation?work=${W.id}`} className="row"><span className="ic">🎞</span><div style={{ flex: 1 }}><b>상황극 서랍에서</b><small>고전·영화 상황을 하나 골라 한 판</small></div><span className="chev">›</span></Link>
          <Link href={`/inner?work=${W.id}`} className="row"><span className="ic">🪞</span><div style={{ flex: 1 }}><b>진행자와 내 장면</b><small>🔭 미래 장면도 여기서</small></div><span className="chev">›</span></Link>
        </Sheet>
      )}

      {finish && (
        <FinishSheet w={W} onClose={() => setFinish(false)} onDone={(caption) => {
          if (checkSafety(caption)) { setSafety(checkSafety(caption)!.level); return; }
          updateWork({ ...W, caption, done: true }, "caption", W.done ? "마지막 자막 고치기" : "✅ 완성 · 마지막 자막", W.caption ?? "", caption);
          setFinish(false);
          setTab("read");
        }} />
      )}

      {del > 0 && (
        <Sheet onClose={() => setDel(0)} label="이어 붙인 것 풀기">
          <h3>이어 붙인 걸 풀까?</h3>
          <p>「{W.title}」로 이은 순서 · 이음새 · 자막과 그 고친 기록이 지워져. 씬은 내 씬에 그대로 남아.<br /><b>되살리기는 없어.</b></p>
          <div className="grid2">
            <button className="btn" onClick={() => setDel(0)}>그냥 둘래</button>
            {del === 1
              ? <button className="btn btn-danger" onClick={() => setDel(2)}>지울래</button>
              : <button className="btn btn-danger" onClick={() => { deleteWork(W.id); router.push("/scenes?f=joined"); }}>진짜 지우기</button>}
          </div>
        </Sheet>
      )}
      {safety && <SafetySheet level={safety} onClose={() => setSafety(null)} />}
    </div>
  );
}

/** ▶ 이어서 보기 — 마지막 컷 · 이음새 · 자막만. 완성했으면 ✅ 완성 노트 */
function Reading({ w, byId }: { w: Work; byId: Map<string, ScenePiece> }) {
  if (!w.slots.length) return <div className="empty"><span className="big">▶</span>아직 놓인 씬이 없어.</div>;
  const cuts = w.slots.map((s) => byId.get(s.pieceId)?.takes.find((t) => t.n === s.takeN)?.lastCut).filter(Boolean);
  return (
    <>
      <div className="reading card">
        <div style={{ textAlign: "center", fontSize: 19, fontWeight: 800 }}>🎭 「{w.title}」</div>
        {w.slots.map((s, i) => {
          const p = byId.get(s.pieceId);
          const t = p?.takes.find((x) => x.n === s.takeN);
          return (
            <div key={s.pieceId + i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="r-slug">S#{i + 1}. {p ? `${ICON_TRACK[p.source.track]} ${p.scene.place} / ${p.scene.time}` : "(지운 씬)"}</div>
              {s.carryFacts.length > 0 && <div className="r-dir">🟡 {s.carryFacts.join(" · ")}</div>}
              <div className="r-line">「{t?.lastCut.line || "…"}」</div>
              {t?.lastCut.direction && <div className="r-dir">*{t.lastCut.direction}*</div>}
              {s.seam && i < w.slots.length - 1 && <div className="r-seam">〰 {s.seam}</div>}
            </div>
          );
        })}
        {w.caption && <div className="r-cap">{w.caption}</div>}
      </div>

      {w.done && (
        <div className="card card-tone" style={{ "--tone": "var(--work)" } as React.CSSProperties}>
          <div className="label">✅ 완성 노트 — 이어 놓으니 보이는 것</div>
          <ul className="list" style={{ marginTop: 6 }}>
            <li>씬 {w.slots.length}개 — 🎞 {w.slots.filter((s) => byId.get(s.pieceId)?.source.track === "situation").length} · 🪞 {w.slots.filter((s) => byId.get(s.pieceId)?.source.track === "inner").length}</li>
            <li>고른 테이크 — {w.slots.map((s, i) => `S#${i + 1} T${s.takeN}`).join(" · ")}</li>
            <li>마지막 컷 {cuts.length}개 중 질문으로 끝난 것 {cuts.filter((c) => /[?？]$/.test(c!.line.trim())).length}개</li>
            {w.slots.some((s) => (byId.get(s.pieceId)?.takes.length ?? 0) > 1) && <li>다시 찍은 씬이 있어 — 고친 기록 탭에서 나란히 볼 수 있어</li>}
          </ul>
          <Link href="/scenes" className="btn btn-sm" style={{ marginTop: 10 }}>🎬 내 씬에서 보이는 것</Link>
        </div>
      )}
    </>
  );
}

function FinishSheet({ w, onClose, onDone }: { w: Work; onClose: () => void; onDone: (caption: string) => void }) {
  const [cap, setCap] = useState(w.caption ?? "");
  return (
    <Sheet onClose={onClose} label="완성">
      <h3>✅ {w.done ? "마지막 자막 고치기" : "완성"}</h3>
      <p>마지막 자막 한 줄. 완성해도 잠기지 않아 — 언제든 다시 열어 고칠 수 있어.</p>
      <input className="field" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="예: 다음 계주에선 내가 먼저 볼게." />
      <button className="btn btn-tone btn-block" disabled={!cap.trim()} onClick={() => onDone(cap.trim())}>{w.done ? "고치기" : "완성하기"}</button>
    </Sheet>
  );
}
