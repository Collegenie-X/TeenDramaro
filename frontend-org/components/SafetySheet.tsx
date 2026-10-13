"use client";

import { SAFETY_MESSAGE } from "@/lib/safety";

export default function SafetySheet({
  level, onClose,
}: { level: "crisis" | "abuse"; onClose: () => void }) {
  const m = SAFETY_MESSAGE[level];
  return (
    <div className="sheet-bg" role="dialog" aria-modal>
      <div className="sheet">
        <h3>🛟 {m.title}</h3>
        <p>{m.body}</p>
        {m.lines.map((l) => (
          <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}>
            <span>{l.label}</span>
            <b>{l.value}</b>
          </a>
        ))}
        <button className="cta" style={{ marginTop: 12 }} onClick={onClose}>
          알겠어, 무대로 돌아갈게
        </button>
        <p className="note" style={{ marginTop: 10, marginBottom: 0 }}>
          이 안내는 끌 수 없어. 네가 안전한 게 이야기보다 먼저야.
        </p>
      </div>
    </div>
  );
}
