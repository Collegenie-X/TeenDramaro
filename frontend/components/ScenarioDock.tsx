"use client";

/**
 * 🧪 동작 시나리오 패널 — 내 무대 화면 위에 붙어서 한 걸음씩 실행하고 ✓ / ✗ 를 남긴다.
 *   ⏮ 처음부터 · ⏭ 한 걸음 · ▶ 자동(✗가 나오면 멈춤) · ▾ 걸음 목록
 */
import { useState } from "react";
import { Ico } from "./InnerArt";
import { describe, type Scenario } from "@/lib/innerScenario";

export type StepResult = { ok: boolean; fails: string[] };

export default function ScenarioDock({
  sc, i, results, auto, running, storage, onStep, onAuto, onRestart, onClose, onWipe,
}: {
  sc: Scenario;
  i: number;
  results: StepResult[];
  auto: boolean;
  running: boolean;
  storage: string;
  onStep: () => void;
  onAuto: () => void;
  onRestart: () => void;
  onClose: () => void;
  onWipe: () => void;
}) {
  const [open, setOpen] = useState(false);
  const total = sc.steps.length;
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  const done = i >= total;
  const next = sc.steps[i];
  const lastBad = [...results].reverse().find((r) => !r.ok);

  return (
    <div className={`sc-dock${open ? " open" : ""}`} role="region" aria-label="동작 시나리오">
      <div className="sc-head">
        <span className="sc-badge"><Ico name="flask" size={13} /> 시나리오</span>
        <b className="sc-title">{sc.title}</b>
        <span className="sc-count">{Math.min(i, total)}/{total}</span>
        <span className="sc-ok">✓{ok}</span>
        {bad > 0 && <span className="sc-bad">✗{bad}</span>}
        <button className="sc-x" onClick={onClose} aria-label="시나리오 닫기"><Ico name="close" size={14} /></button>
      </div>
      <div className="sc-bar"><i style={{ width: `${(Math.min(i, total) / total) * 100}%` }} className={bad ? "bad" : ""} /></div>

      <div className="sc-now">
        {done
          ? <span>{bad ? `끝 — ✗ ${bad}개. 목록을 열어 확인해.` : "끝 — 전부 통과 ✓ 씬이 localStorage에 저장됐어."}</span>
          : <span><em>다음</em> {next.label}{next.check && <small>기대: {describe(next.check)}</small>}</span>}
        {lastBad && !open && <small className="sc-fail">✗ {lastBad.fails[0]}</small>}
      </div>

      <div className="sc-ctl">
        <button className="sc-btn" onClick={onRestart} aria-label="처음부터"><Ico name="rewind" size={14} />처음</button>
        <button className="sc-btn" onClick={onStep} disabled={done || running || auto}><Ico name="step" size={14} />한 걸음</button>
        <button className={`sc-btn main${auto ? " on" : ""}`} onClick={onAuto} disabled={done}>
          <Ico name={auto ? "freeze" : "play"} size={14} />{auto ? "멈춤" : "자동"}
        </button>
        <button className="sc-btn" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "▴" : "▾"} 목록</button>
      </div>

      {open && (
        <div className="sc-list">
          <ol>
            {sc.steps.map((st, k) => {
              const r = results[k];
              return (
                <li key={k} className={k === i ? "cur" : r ? (r.ok ? "ok" : "bad") : ""}>
                  <span className="sc-mark">{r ? (r.ok ? "✓" : "✗") : k === i ? "›" : k + 1}</span>
                  <div>
                    <b>{st.label}</b>
                    {st.check && <small>{describe(st.check)}</small>}
                    {r && !r.ok && r.fails.map((f) => <small key={f} className="sc-fail">✗ {f}</small>)}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="sc-foot">
            <span><Ico name="save" size={12} /> {storage}</span>
            <button className="sc-btn" onClick={onWipe}><Ico name="broom" size={13} />🧪 씬 지우기</button>
          </div>
        </div>
      )}
    </div>
  );
}
