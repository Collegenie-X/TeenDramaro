"use client";

/**
 * 🛟 화면 13 — 안전.
 * 씬 멈춤 · 지금 기분 한 칸 · 같이 말할 수 있는 어른 카드 · 지금 연락하기.
 * 끌 수 없다(닫기 = 홈으로). 문구는 data/safety.json
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SAFETY, type SafetyLevel } from "@/lib/safety";
import Sheet from "./Sheet";

export default function SafetySheet({ level, onClose }: { level: SafetyLevel; onClose?: () => void }) {
  const m = SAFETY.messages[level];
  const router = useRouter();
  const [feel, setFeel] = useState<string | null>(null);
  const [adult, setAdult] = useState("");

  return (
    <Sheet label="안전 화면">
      <span className="pill pill-tone" style={{ alignSelf: "flex-start" }}>✋ 씬 멈춤</span>
      <h3>🛟 {m.title}</h3>
      <p>{m.body}</p>

      <div className="label" style={{ marginTop: 4 }}>지금 기분 한 칸</div>
      <div className="chips">
        {SAFETY.feelings.map((f) => (
          <button key={f} className={`chip ${feel === f ? "on" : ""}`} onClick={() => setFeel(f)}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 4 }}>
        <h3 style={{ fontSize: 14 }}>🧑‍🏫 {SAFETY.adultCard.title}</h3>
        <p>{SAFETY.adultCard.hint}</p>
        <input className="field" style={{ marginTop: 8 }} value={adult} onChange={(e) => setAdult(e.target.value)} placeholder={SAFETY.adultCard.placeholder} />
        {adult && <p style={{ color: "var(--note)" }}>「{adult}」 — 오늘 안에 한 마디만 걸어 봐. 「얘기할 거 있어요」면 충분해.</p>}
      </div>

      <div className="label">지금 연락하기</div>
      {m.lines.map((l) => (
        <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}>
          <span>{l.label}</span><b>{l.value}</b>
        </a>
      ))}

      <button className="btn btn-block" style={{ marginTop: 6 }} onClick={() => (onClose ? onClose() : router.push("/"))}>
        알겠어, 홈으로 갈게
      </button>
      <p className="note" style={{ margin: 0 }}>이 장면은 다리 없이 따로 둘게. 네가 안전한 게 이야기보다 먼저야.</p>
    </Sheet>
  );
}
