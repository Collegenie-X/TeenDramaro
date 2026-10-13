"use client";

/**
 * 입력창 — 모든 입력에 🎙 (§21 글자 대신 말로도).
 * 30초 비면 칩 3개(패스 · 지문만 · 컷) — 「아무것도 안 해도 괜찮아」가 보이게.
 */
import { useEffect, useRef, useState } from "react";
import { IDLE_CHIPS } from "@/lib/meta";

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};

export default function Composer({
  placeholder = "말하거나 써도 돼…",
  onSend,
  onIdle,
  allowDirection,
  disabled,
  extra,
}: {
  placeholder?: string;
  onSend: (text: string, opts: { direction: boolean }) => void;
  /** 30초 칩 — 없으면 칩을 안 띄운다 */
  onIdle?: (chip: "패스" | "지문만" | "컷") => void;
  allowDirection?: boolean;
  disabled?: boolean;
  extra?: React.ReactNode;
}) {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState(false);
  const [idle, setIdle] = useState(false);
  const [listening, setListening] = useState(false);
  const [canVoice, setCanVoice] = useState(false);
  const recRef = useRef<SR | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    setCanVoice(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  // 30초 동안 아무것도 안 하면 칩
  useEffect(() => {
    if (!onIdle || disabled) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setIdle(false);
    idleTimer.current = setTimeout(() => setIdle(true), 30_000);
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [text, onIdle, disabled]);

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t, { direction });
    setText("");
    setDirection(false);
  };

  const toggleVoice = () => {
    if (listening) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C) return;
    const rec = new C();
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = false;
    const base = text ? text + " " : "";
    rec.onresult = (e) => {
      const said = Array.from(e.results).map((r) => r[0].transcript).join("");
      setText(base + said);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="composer">
      {idle && onIdle && (
        <div className="chips" style={{ alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 11.5 }}>아무것도 안 해도 괜찮아 ·</span>
          {IDLE_CHIPS.map((c) => (
            <button key={c} className="chip" onClick={() => { setIdle(false); onIdle(c as "패스" | "지문만" | "컷"); if (c === "지문만") setDirection(true); }}>{c}</button>
          ))}
        </div>
      )}
      {extra}
      <div className="input-row">
        <textarea
          className="ta"
          rows={1}
          value={text}
          disabled={disabled}
          placeholder={direction ? "몸짓만 써 줘 — 예: 가방끈을 꽉 쥔다" : placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        />
        {allowDirection && (
          <button className={`icon-btn ${direction ? "on" : ""}`} style={direction ? { animation: "none", borderColor: "var(--tone)", background: "var(--tone-deep)" } : undefined}
            onClick={() => setDirection(!direction)} aria-label="지문만" title="지문만">🖐</button>
        )}
        {canVoice && (
          <button className={`icon-btn ${listening ? "on" : ""}`} onClick={toggleVoice} aria-label="말로 입력">🎙</button>
        )}
        <button className="icon-btn send" onClick={send} disabled={!text.trim() || disabled} aria-label="보내기">↑</button>
      </div>
    </div>
  );
}
