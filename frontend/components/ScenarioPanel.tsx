"use client";

/**
 * 🧪 동작 시나리오 — ✨ 소개의 「하은이의 2주」를 내 씬에 채워 화면을 따라가며 확인한다.
 *   ScenarioBanner  시나리오 중일 때 내 씬 맨 위 — 지금 단계 · 확인할 것 · 이전/다음 · 끝내기
 *   ScenarioEntry   시나리오 밖일 때 내 씬 맨 아래 — 단계 고르기
 * 데이터는 data/scenario.json, 채우기/되돌리기는 lib/scenario.ts
 */
import Link from "next/link";
import { useState } from "react";
import { endDemo, goStep, SCENARIO, stepBackup, stepIndex, toggleCheck, type DemoState } from "@/lib/scenario";

export function ScenarioBanner({ demo }: { demo: DemoState }) {
  const [open, setOpen] = useState(true);
  const i = stepIndex(demo.step);
  const step = SCENARIO.steps[i];
  if (!step) return null;
  const done = demo.checked[step.id] ?? [];
  const prev = SCENARIO.steps[i - 1], next = SCENARIO.steps[i + 1];

  function download() {
    const blob = new Blob([JSON.stringify(stepBackup(step), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mindscene-scenario-${step.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="demo" aria-label="동작 시나리오">
      <div className="demo-h">
        <span className="demo-tag">🧪 시나리오</span>
        <b>{SCENARIO.title}</b>
        <button className="demo-fold" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "접기" : "펼치기"}</button>
      </div>
      <div className="demo-steps" role="tablist">
        {SCENARIO.steps.map((s, k) => (
          <button key={s.id} role="tab" aria-selected={k === i} className={k === i ? "on" : k < i ? "past" : ""} onClick={() => goStep(s.id)}>
            <i>{s.day}</i>{s.name}
          </button>
        ))}
      </div>
      {open && (
        <>
          <p className="demo-body">{step.body}</p>
          <div className="label" style={{ marginTop: 10 }}>확인할 것 · {done.length}/{step.checks.length}</div>
          <ul className="demo-checks">
            {step.checks.map((c) => {
              const on = done.includes(c.id);
              return (
                <li key={c.id} className={on ? "on" : ""}>
                  <button className="demo-box" role="checkbox" aria-checked={on} onClick={() => toggleCheck(step.id, c.id)}>{on ? "✓" : ""}</button>
                  <span onClick={() => toggleCheck(step.id, c.id)}>{c.text}</span>
                  {c.href && <Link href={c.href} className="demo-go">열기 ›</Link>}
                </li>
              );
            })}
          </ul>
          <div className="grid2" style={{ marginTop: 10 }}>
            <button className="btn btn-sm" disabled={!prev} onClick={() => prev && goStep(prev.id)}>‹ {prev ? prev.day : "처음"}</button>
            <button className="btn btn-sm demo-next" disabled={!next} onClick={() => next && goStep(next.id)}>{next ? `${next.day} ${next.name}` : "끝"} ›</button>
          </div>
          <div className="demo-foot">
            <button className="btn btn-sm btn-ghost" onClick={() => goStep(step.id)}>↺ 이 단계 다시 채우기</button>
            <button className="btn btn-sm btn-ghost" onClick={download}>⬇ 이 단계 JSON</button>
          </div>
        </>
      )}
      <button className="btn btn-sm btn-block demo-end" onClick={endDemo}>시나리오 끝내기 · 내 기록 되돌리기</button>
    </section>
  );
}

export function ScenarioEntry() {
  return (
    <section className="card demo-entry">
      <h3>🧪 동작 시나리오로 따라가 보기</h3>
      <p>{SCENARIO.lead}</p>
      <div className="story" style={{ marginTop: 12 }}>
        {SCENARIO.steps.map((s) => (
          <button key={s.id} className="story-step demo-pick" onClick={() => { goStep(s.id); document.querySelector(".scroll")?.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <span className="story-em" aria-hidden="true" />
            <span className="story-act">{s.day}</span>
            <b>{s.name} <span className="chev">›</span></b>
            <p>{s.body.split("\n")[0]}</p>
          </button>
        ))}
      </div>
      <p className="note" style={{ textAlign: "left" }}>🔒 {SCENARIO.keep}</p>
    </section>
  );
}
