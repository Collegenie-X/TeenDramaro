"use client";

import { useEffect, useRef, useState } from "react";
import EmotionPalette from "./EmotionPalette";

export type Choice = { label: string; text: string };

export default function Composer({
  placeholder, hints, onSubmit, disabled, feelings = true, choices = [], choiceReact = "",
  autofill,
}: {
  placeholder: string;
  hints: string[];
  onSubmit: (text: string, feelings: string[]) => void;
  disabled?: boolean;
  /** 감정 팔레트를 띄울지 (이름 짓기 같은 턴에서는 끈다) */
  feelings?: boolean;
  /** 🎬 AI가 만든 방향 선택지 — 누르면 입력창에 채워지고, 고쳐서 보낼 수 있다 */
  choices?: Choice[];
  /** 선택지 위에 띄울 디렉터의 짧은 반응 */
  choiceReact?: string;
  /** 데모 모드에서 밖에서 입력창을 채운다 — {text, chip}이 바뀔 때마다 반영 */
  autofill?: { text: string; chip?: string; feels?: string[]; nonce: number };
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  /** 기획서 §8.2 — 힌트는 한 번에 다 보여주지 않고 1~2개씩 점진 공개 */
  const [shown, setShown] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedChip, setPickedChip] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const pickChip = (c: Choice) => {
    setPickedChip(c.label);
    setText(c.text);
    requestAnimationFrame(() => {
      grow();
      ref.current?.focus();
    });
  };

  useEffect(() => {
    if (!autofill) return;
    setText(autofill.text);
    if (autofill.chip) setPickedChip(autofill.chip);
    if (autofill.feels) setPicked(autofill.feels);
    requestAnimationFrame(grow);
    // nonce만 보면 된다 — 같은 문장을 다시 채우는 경우도 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill?.nonce]);

  const toggle = (f: string) =>
    setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSubmit(t, picked);
    setText("");
    setPicked([]);
    setPickedChip(null);
    if (ref.current) ref.current.style.height = "auto";
  };

  return (
    <div className="composer">
      {open && (
        <div className="hints">
          <div className="hints-h">💡 대신 물어볼게 — 답은 네가 골라</div>
          <ul style={{ margin: 0, padding: 0 }}>
            {hints.slice(0, shown).map((h, i) => <li key={i}>{h}</li>)}
          </ul>
          {shown < hints.length ? (
            <button className="more" onClick={() => setShown((n) => n + 1)}>힌트 하나 더 보기 ›</button>
          ) : (
            <div className="note" style={{ marginTop: 4 }}>이것도 아니면 네 말로 해봐. 문장 안 되어도 알아들어.</div>
          )}
        </div>
      )}

      {choices.length > 0 && (
        <div className="choice-box">
          {choiceReact && <div className="choice-react">{choiceReact}</div>}
          <div className="choice-h">🎬 이런 방향도 있어 — 눌러서 고쳐 써도 되고, 네 말로 써도 돼</div>
          <div className="choice-row">
            {choices.map((c) => (
              <button
                key={c.label}
                className={`choice-chip${pickedChip === c.label ? " choice-chip-on" : ""}`}
                onClick={() => pickChip(c)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {feelings && <EmotionPalette picked={picked} onToggle={toggle} />}

      {!open && hints.length > 0 && (
        <button className="hint-btn" onClick={() => setOpen(true)} style={{ marginBottom: 9 }}>
          💡 막히면 눌러
        </button>
      )}

      <div className="input-row">
        <textarea
          ref={ref} className="ta" rows={1} value={text} placeholder={placeholder}
          onChange={(e) => { setText(e.target.value); grow(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
          }}
        />
        <button className="send" onClick={send} disabled={!text.trim() || disabled} aria-label="보내기">↑</button>
      </div>
    </div>
  );
}
