"use client";

import { DIALS } from "@/lib/meta";
import type { Dials } from "@/lib/types";

/** 🎚 다이얼 4개 — 처음 값(was)에 테두리를 남겨서 바뀐 게 보이게 */
export default function DialPanel({
  value, was, onChange,
}: { value: Dials; was?: Dials; onChange: (key: keyof Dials, v: number) => void }) {
  return (
    <div>
      {DIALS.map((d) => (
        <div key={d.key} className="dial">
          <div className="dial-name">{d.icon} {d.label}<small>{d.low} ↔ {d.high}</small></div>
          <div className="dial-steps">
            {[0, 1, 2, 3, 4].map((v) => (
              <button
                key={v}
                className={`${value[d.key] === v ? "on" : ""} ${was && was[d.key] === v && value[d.key] !== v ? "was" : ""}`}
                onClick={() => onChange(d.key, v)}
                aria-label={`${d.label} ${v}`}
              >{v}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
