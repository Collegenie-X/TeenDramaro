"use client";

/**
 * 뽕 독(dock) — 맥 Dock처럼.
 *   · 나타날 때: 하나씩 「뽕」 하고 튀어 오른다 (popKey가 바뀔 때마다 다시)
 *   · 손가락/커서가 지나가면: 가까운 것일수록 크게 부풀고 살짝 떠오른다
 *   · 누르면: 한 번 통 튀고 고른다
 * 직접 쓰기가 막막할 때 「이 중에 하나 골라도 돼」 하고 길을 보여 주는 자리.
 *
 *   variant "say"   말풍선 타일 — 할 말 · 몸짓
 *   variant "icon"  아이콘 타일 + 이름 — 기법 · 다음 장면
 *
 * rec(⭐ 추천)이 있으면 그 타일만 무대 조명처럼 밝고, 나머지는 한 톤 내려간다.
 */
import { useRef, useState } from "react";
import { Ico } from "./InnerArt";

export type DockItem = {
  key: string;
  label: string;
  icon?: string;
  /** 몸짓(지문) — 기울임 · 점선 */
  dir?: boolean;
  /** 켜진 상태 · 추천 */
  on?: boolean;
  /** ⭐ 추천 — 하나만. 배지 + 반짝 */
  rec?: boolean;
  /** 말이 아니라 버튼처럼 동작하는 칩 (과제 보기 · 결정적 자리로 · 컷) */
  action?: boolean;
  disabled?: boolean;
  hint?: string;
};

const MAX = { say: 1.2, icon: 1.45 };
const RANGE = { say: 120, icon: 90 };

export default function PopDock({
  items, onPick, variant = "say", popKey, disabled, compact,
}: {
  items: DockItem[];
  onPick: (it: DockItem) => void;
  variant?: "say" | "icon";
  /** 바뀌면 다시 뽕 — 진행자가 새로 말할 때마다 */
  popKey?: string | number;
  disabled?: boolean;
  /** 직접 쓰기 위에 얹을 때 — 조금 작게 */
  compact?: boolean;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [boing, setBoing] = useState<string | null>(null);

  /** 맥 Dock 확대 — 다시 그리지 않고 CSS 변수만 바꾼다 */
  const magnify = (x: number | null) => {
    row.current?.querySelectorAll<HTMLElement>(".pd-item").forEach((el) => {
      if (x === null) { el.style.setProperty("--m", "1"); return; }
      const r = el.getBoundingClientRect();
      const d = Math.abs(x - (r.left + r.width / 2));
      const t = Math.max(0, 1 - d / RANGE[variant]);
      // 가운데가 더 부풀게 — 코사인 곡선
      const m = 1 + (MAX[variant] - 1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      el.style.setProperty("--m", m.toFixed(3));
    });
  };

  const pick = (it: DockItem) => {
    if (disabled || it.disabled) return;
    setBoing(it.key);
    setTimeout(() => { setBoing(null); onPick(it); }, 170);
  };

  return (
    <div className={`pd pd-${variant}${compact ? " compact" : ""}${disabled ? " off" : ""}${items.some((it) => it.rec) ? " has-rec" : ""}`}>
      <div
        className="pd-row" ref={row} key={popKey}
        onPointerMove={(e) => magnify(e.clientX)}
        onPointerLeave={() => magnify(null)}
        onPointerCancel={() => magnify(null)}
        onScroll={() => magnify(null)}
      >
        {items.map((it, i) => (
          <button
            key={it.key} type="button"
            className={`pd-item${it.on ? " on" : ""}${it.dir ? " dir" : ""}${it.rec ? " rec" : ""}${it.action ? " act" : ""}`}
            disabled={disabled || it.disabled} title={it.hint}
            aria-label={`${it.rec ? "추천 · " : ""}${it.dir ? `몸짓: ${it.label}` : it.label}`}
            onClick={() => pick(it)}
          >
            <span className={`pd-face${boing === it.key ? " boing" : ""}`} style={{ animationDelay: `${i * 55}ms` }}>
              {variant === "icon" ? (
                <>
                  <span className="pd-tile">{it.icon && <Ico name={it.icon} size={20} stroke={1.9} />}</span>
                  <span className="pd-cap">{it.label}</span>
                </>
              ) : (
                <>
                  {it.dir && <Ico name="hand" size={13} />}
                  <span>{it.dir ? `*${it.label}*` : it.label}</span>
                </>
              )}
            </span>
            {it.on && variant === "icon" && <i className="pd-dot" aria-hidden="true" />}
            {it.rec && <i className="pd-rec" aria-hidden="true">⭐ 추천</i>}
          </button>
        ))}
      </div>
    </div>
  );
}
