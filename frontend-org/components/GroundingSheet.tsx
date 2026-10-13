"use client";

import { useState } from "react";

/**
 * "잠깐 멈출래" — 무대 아무 때나 누를 수 있다.
 * 트라우마에 가까이 갈수록 내려올 계단이 있어야 한다.
 */
const STEPS = [
  { n: 5, sense: "눈으로", ask: "지금 보이는 것 다섯 가지" },
  { n: 4, sense: "손으로", ask: "닿아 있는 것 네 가지" },
  { n: 3, sense: "귀로", ask: "들리는 소리 세 가지" },
  { n: 2, sense: "코로", ask: "맡아지는 냄새 두 가지" },
  { n: 1, sense: "입으로", ask: "느껴지는 맛 하나" },
];

export default function GroundingSheet({
  onResume, onExit,
}: { onResume: () => void; onExit: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const done = i >= STEPS.length;

  return (
    <div className="sheet-bg" role="dialog" aria-modal>
      <div className="sheet" style={{ borderTopColor: "#4f7f8a" }}>
        <h3>🫧 잠깐 멈췄어</h3>
        <p>
          무대는 그대로 있어. 아무 데도 안 가.{"\n"}
          먼저 여기로 돌아오자. 지금 있는 방으로.
        </p>

        {!done ? (
          <>
            <div className="ground-card">
              <div className="ground-n">{step.n}</div>
              <div>
                <b>{step.sense}</b>
                <small>{step.ask}</small>
              </div>
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              소리 내서 말해도 되고 속으로 세도 돼. 다 못 채워도 괜찮아.
            </p>
            <button className="cta cta-primary" style={{ marginTop: 12 }} onClick={() => setI(i + 1)}>
              {i === STEPS.length - 1 ? "다 셌어" : "세어봤어 · 다음"}
            </button>
          </>
        ) : (
          <>
            <div className="ground-card">
              <div className="ground-n">🌬️</div>
              <div>
                <b>숨 한 번</b>
                <small>넷 세며 들이쉬고, 여섯 세며 내쉬기</small>
              </div>
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              여기까지 온 것만으로 충분해. 이어서 해도 되고, 오늘은 여기까지여도 돼.
            </p>
          </>
        )}

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <button className="cta" onClick={onResume}>무대로 돌아갈게</button>
          <button className="cta" onClick={onExit}>오늘은 여기까지 할래</button>
        </div>
      </div>
    </div>
  );
}
