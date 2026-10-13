"use client";

/**
 * 콤보 드롭 박스 — 눌러서 펼치고, 하나 고르면 닫힌다.
 * 목록 맨 끝 「✏️ 직접 쓰기」를 고를 때만 입력칸으로 바뀐다(▾로 다시 목록).
 * 키보드: ↑ ↓ 로 옮기고 Enter 로 고르기 · Esc 로 닫기.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Ico } from "./InnerArt";

export type OptItem = { label: string; icon?: string; mark?: string };

const CUSTOM = "__custom__";
const NONE = "__none__";

export default function ComboBox({
  items, value, onPick, custom = true, clearable, placeholder = "골라 줘", customPlaceholder = "직접 써도 돼", maxLength = 20, label,
}: {
  items: OptItem[];
  value: string;
  onPick: (label: string) => void;
  custom?: boolean;
  /** 「안 고를래」 줄을 맨 위에 — 골라도 되고 안 골라도 되는 칸 */
  clearable?: string;
  placeholder?: string;
  customPlaceholder?: string;
  maxLength?: number;
  label?: string;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const isCustomValue = !!value && !items.some((i) => i.label === value);
  const [typing, setTyping] = useState(isCustomValue);
  const [open, setOpen] = useState(false);
  const rows = [
    ...(clearable ? [{ key: NONE, label: clearable }] : []),
    ...items.map((i) => ({ key: i.label, ...i })),
    ...(custom ? [{ key: CUSTOM, label: "직접 쓰기", icon: "pencil" }] : []),
  ] as { key: string; label: string; icon?: string; mark?: string }[];
  const curIdx = rows.findIndex((r) => (typing ? r.key === CUSTOM : r.key === (value || (clearable ? NONE : ""))));
  const [hi, setHi] = useState(Math.max(0, curIdx));

  // 밖을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);

  // 바깥(🧪 시나리오)에서 목록에 있는 값으로 바꾸면 입력칸을 닫는다
  useEffect(() => { if (value && items.some((i) => i.label === value)) setTyping(false); }, [value, items]);

  const choose = (k: number) => {
    const r = rows[k];
    if (!r) return;
    setOpen(false);
    if (r.key === CUSTOM) { setTyping(true); if (!isCustomValue) onPick(""); return; }
    setTyping(false);
    onPick(r.key === NONE ? "" : r.label);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setHi(Math.max(0, curIdx)); return; }
      setHi((h) => (h + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
    } else if (e.key === "Enter" && open) { e.preventDefault(); choose(hi); }
    else if (e.key === "Escape") setOpen(false);
  };

  const sel = items.find((i) => i.label === value);

  return (
    <div className={`combo${open ? " open" : ""}`} ref={box} onKeyDown={onKey}>
      {typing ? (
        <div className="combo-field typing">
          <Ico name="pencil" size={15} />
          <input autoFocus value={isCustomValue ? value : ""} maxLength={maxLength} placeholder={customPlaceholder} aria-label={label}
            onChange={(e) => onPick(e.target.value)} />
          <button type="button" className="combo-caret-btn" aria-label="목록 열기" aria-expanded={open} aria-controls={id}
            onClick={() => { setOpen(!open); setHi(Math.max(0, curIdx)); }}>
            <span className="combo-caret" />
          </button>
        </div>
      ) : (
        <button type="button" className={`combo-field${value ? " has" : ""}`} role="combobox" aria-label={label}
          aria-expanded={open} aria-controls={id} aria-haspopup="listbox"
          onClick={() => { setOpen(!open); setHi(Math.max(0, curIdx)); }}>
          {sel?.icon && <Ico name={sel.icon} size={16} />}
          <span className={value ? "combo-val" : "combo-ph"}>{value || clearable || placeholder}</span>
          {sel?.mark && <i className="opt-mark">{sel.mark}</i>}
          <span className="combo-caret" />
        </button>
      )}

      {open && (
        <ul className="combo-list" role="listbox" id={id} aria-label={label}>
          {rows.map((r, k) => {
            const on = k === curIdx;
            return (
              <li key={r.key} role="option" aria-selected={on}
                className={`${on ? "on" : ""}${k === hi ? " hi" : ""}${r.key === CUSTOM ? " custom" : ""}${r.key === NONE ? " none" : ""}`}
                onPointerEnter={() => setHi(k)} onClick={() => choose(k)}>
                <span className="combo-ic">{r.icon ? <Ico name={r.icon} size={15} /> : null}</span>
                <span className="combo-t">{r.label}</span>
                {r.mark && <i className="opt-mark">{r.mark}</i>}
                {on && <Ico name="check" size={14} stroke={2.6} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
