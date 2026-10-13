/**
 * 🪞 내 무대 삽화 — 지금 무대 상태를 그대로 그린다.
 * 소개(/about) 삽화와 같은 톤: 푸른 객석 조명(--inner) · 자주 커튼 · 종이색 소품.
 *
 *   Ico          칩 · 버튼용 선화 아이콘 (장소 · 시간 · 물건 · 기법 · 단계)
 *   StageView    무대 한 장 — 장소 배경 · 시간 조명 · 나/아바타 · 상대(거리) · 기법 연출
 *   Portrait     🙋 나로 / 🎭 아바타로 고르는 얼굴
 *   DistanceArt  상대를 얼마나 떨어뜨려 둘지 — 두 사람 사이 자
 *   CardArt      오늘의 카드 — 뒷면 / 앞면
 *   StepRail     ① 웜업 → ② 행위 → ③ 나눔
 */
import type { ReactNode } from "react";

const C = {
  inner: "#8fbbe0", innerD: "#142334", sit: "#ffcf7a", work: "#c9a6ff", note: "#9fe0c0",
  ink: "#f3eff8", dim: "#b4abc6", faint: "#7b7290", line: "#2d2542",
  curtain: "#4e2352", curtainD: "#33163a", skin: "#fdf3e6", paper: "#fbf3e0", gold: "#c9b27a",
};
const FONT = '-apple-system, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

/* ══ 선화 아이콘 ═══════════════════════════════════════ */
const PATHS: Record<string, ReactNode> = {
  // 장소
  field: <><ellipse cx="12" cy="13" rx="9" ry="6" /><ellipse cx="12" cy="13" rx="5" ry="2.8" /><path d="M18 5v6M18 5l3 1.2L18 7.4" /></>,
  class: <><rect x="3" y="4" width="18" height="11" rx="1.5" /><path d="M6 8h6M6 11h4M8 19h8M12 15v4" /></>,
  hall: <><path d="M3 20 9 9h6l6 11" /><path d="M9 9V4h6v5M12 14v6" /></>,
  lunch: <><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 12h4M14 12h4M7 17v3M17 17v3" /></>,
  table: <><path d="M3 11h18M5 11v8M19 11v8" /><path d="M12 3v3M9 6h6l-1 3h-4z" /></>,
  room: <><path d="M3 18v-6h18v6M3 15h18M5 12V9a2 2 0 0 1 2-2h4v5" /><path d="M16 4.5a2 2 0 1 0 2 2" /></>,
  bus: <><path d="M6 21V5M3 5h6" /><rect x="11" y="8" width="10" height="9" rx="2" /><path d="M11 12h10M13 19v-2M19 19v-2" /></>,
  academy: <><path d="M4 20V8l8-4 8 4v12" /><path d="M9 20v-5h6v5M8 10h2M14 10h2" /></>,
  // 시간
  morning: <><path d="M3 17h18" /><path d="M7 17a5 5 0 0 1 10 0" /><path d="M12 6v3M5.5 9.5l2 2M18.5 9.5l-2 2" /></>,
  noon: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  hot: <><circle cx="10" cy="10" r="4" /><path d="M15 15c1.5-1 3-1 4.5 0M15 18.5c1.5-1 3-1 4.5 0" /></>,
  dusk: <><path d="M3 16h18M6 20h12" /><path d="M7 16a5 5 0 0 1 10 0" /></>,
  night: <path d="M16 15.5A7 7 0 0 1 8.5 4a7 7 0 1 0 7.5 11.5z" />,
  rain: <><path d="M7 13a4 4 0 0 1 .5-8 5 5 0 0 1 9.4 1.5A3.3 3.3 0 0 1 17 13z" /><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" /></>,
  // 물건
  baton: <><rect x="4" y="10" width="16" height="4.5" rx="2.2" transform="rotate(-30 12 12)" /><path d="M8 15l2-1.2" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  bag: <><rect x="5" y="8" width="14" height="12" rx="3" /><path d="M9 8V6a3 3 0 0 1 6 0v2M9 13h6" /></>,
  paper: <><path d="M6 3h9l3 3v15H6z" /><path d="M9 9h6M9 12h6M9 15h3" /></>,
  earphone: <><path d="M5 14v-2a7 7 0 0 1 14 0v2" /><rect x="3.5" y="14" width="4" height="6" rx="1.5" /><rect x="16.5" y="14" width="4" height="6" rx="1.5" /></>,
  letter: <><rect x="3" y="6" width="18" height="12" rx="1.5" /><path d="m3 7 9 6 9-6" /></>,
  spoon: <><ellipse cx="12" cy="6.5" rx="3.2" ry="4" /><path d="M12 10.5V21" /></>,
  umbrella: <><path d="M3 12a9 9 0 0 1 18 0z" /><path d="M12 12v6a2 2 0 0 1-4 0" /></>,
  // 기법
  freeze: <><path d="M8 13V6a1.5 1.5 0 0 1 3 0v6M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4.2-2.3L4 14a1.5 1.5 0 0 1 2.4-1.8L8 14" /></>,
  double: <><path d="M5 15a5 5 0 0 1 2-9.5 6 6 0 0 1 11 2A4 4 0 0 1 17 15z" /><circle cx="7" cy="19" r="1.4" /><circle cx="4" cy="21.5" r=".8" /></>,
  soliloquy: <><path d="M4 5h16v10H10l-4 4v-4H4z" /><path d="M8 9h8M8 12h5" /></>,
  reversal: <><path d="M4 9h13l-3-3M20 15H7l3 3" /></>,
  chair: <><path d="M7 3v18M7 12h10v9M7 12V3h8v9" /></>,
  distance: <><path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" /><path d="M9 12v-2M12 12v-3M15 12v-2" /></>,
  mirror: <><ellipse cx="12" cy="10" rx="6" ry="7.5" /><path d="M12 17.5V21M8.5 21h7M9.5 7.5c.8-1.5 2-2.3 3.5-2.5" /></>,
  retake: <><path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M4 10 3.2 6.6 18.6 3l.8 3.4z" /><path d="m8 5.6 2 3.2M12.6 4.6l2 3.2" /></>,
  future: <><path d="m4 15 11-6 2 3.5-11 6z" /><path d="m17 12.5 3-1.6M9 17l-2 4M11 16l2 5" /></>,
  scene: <><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
  // 단계 · 기타
  stairs: <path d="M3 20h5v-5h5v-5h5V5h3" />,
  spot: <><path d="M9 3h6l-1 4h-4z" /><path d="M10 7 4 20h16L14 7" /></>,
  note: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  pencil: <><path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" /><path d="m13.5 6.5 4 4" /></>,
  hand: <><path d="M8 13V6a1.5 1.5 0 0 1 3 0v6M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5a6 6 0 0 1-6 6h-.5a5 5 0 0 1-4.2-2.3L4 14a1.5 1.5 0 0 1 2.4-1.8L8 14" /></>,
  next: <path d="M9 5l7 7-7 7" />,
  curtain: <><path d="M3 3h18M4 3c0 7 2 12 5 18M20 3c0 7-2 12-5 18" /><path d="M12 9v3M10.5 14h3" /></>,
  person: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  mask: <><path d="M3 8c3-2 6-2 9 0 3-2 6-2 9 0 0 6-3 9-6 9-1.5 0-2.4-1.4-3-3-.6 1.6-1.5 3-3 3-3 0-6-3-6-9z" /><path d="M6.5 11h3M14.5 11h3" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7 15h10" /></>,
  play: <path d="M7 4.5v15l12-7.5z" />,
  step: <><path d="M5 4.5v15l9-7.5z" /><path d="M18 5v14" /></>,
  rewind: <><path d="M4 5v14" /><path d="M19 4.5v15l-11-7.5z" /></>,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  broom: <><path d="M14 3 9.5 11" /><path d="M6 11h7l2 10H4z" /><path d="M8 15v6M11 15v6" /></>,
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-6h8v6" /></>,
};
export type IcoName = keyof typeof PATHS;

export function Ico({ name, size = 16, color = "currentColor", stroke = 1.8, x, y }: { name: string; size?: number; color?: string; stroke?: number; x?: number; y?: number }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, overflow: "visible" }}>
      {d}
    </svg>
  );
}

/* ══ 사람 — 얼굴을 그리는 배우 ══════════════════════════ */
type Mood = "calm" | "tense" | "talk" | "soft";
function Face({ mood }: { mood: Mood }) {
  const eye = mood === "tense" ? <><path d="M-6 -11h3.5M2.5 -11H6" stroke="#2a2233" strokeWidth="1.6" strokeLinecap="round" /></>
    : <><circle cx="-4.5" cy="-11" r="1.6" fill="#2a2233" /><circle cx="4.5" cy="-11" r="1.6" fill="#2a2233" /></>;
  const mouth = mood === "talk" ? <ellipse cx="0" cy="-4" rx="2.6" ry="2" fill="#7a3b46" />
    : mood === "tense" ? <path d="M-3.5 -4h7" stroke="#7a3b46" strokeWidth="1.5" strokeLinecap="round" />
    : mood === "soft" ? <path d="M-3.5 -5 q3.5 3 7 0" stroke="#7a3b46" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    : <path d="M-3 -4.5 q3 2 6 0" stroke="#7a3b46" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
  return <>{eye}{mouth}<circle cx="-8" cy="-6.5" r="2" fill="#f2a7a7" opacity=".45" /><circle cx="8" cy="-6.5" r="2" fill="#f2a7a7" opacity=".45" /></>;
}

function Actor({
  x, y, s = 1, tint = "#e8d9c5", hair = "#3a2c48", mood = "calm", mask, ghost, flip, arms = "down", dim = 1, children,
}: {
  x: number; y: number; s?: number; tint?: string; hair?: string; mood?: Mood; mask?: boolean; ghost?: boolean; flip?: boolean;
  arms?: "down" | "front" | "up" | "reach"; dim?: number; children?: ReactNode;
}) {
  const st = ghost ? { fill: "none", stroke: C.inner, strokeDasharray: "3 3", strokeWidth: 1.4 } : { fill: tint };
  const arm = (d: string) => <path d={d} stroke={ghost ? C.inner : tint} strokeWidth={ghost ? 1.4 : 5} strokeDasharray={ghost ? "3 3" : undefined} strokeLinecap="round" fill="none" />;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={dim}>
      {!ghost && <ellipse cx="0" cy="45" rx="19" ry="5" fill="#000" opacity=".35" />}
      <path d="M-15 45 L-11 8 Q0 1 11 8 L15 45 Z" {...st} />
      {arms === "down" && <>{arm("M-12 13 L-20 33")}{arm("M12 13 L20 33")}</>}
      {arms === "front" && <>{arm("M-12 13 L-6 26")}{arm("M12 13 L8 26")}</>}
      {arms === "up" && <>{arm("M-12 13 L-20 33")}{arm("M12 12 L22 -4")}</>}
      {arms === "reach" && <>{arm("M-12 13 L-20 33")}{arm("M12 13 L30 16")}</>}
      {ghost ? (
        <circle cx="0" cy="-9" r="14" fill="none" stroke={C.inner} strokeDasharray="3 3" strokeWidth="1.4" />
      ) : (
        <>
          <circle cx="0" cy="-9" r="14" fill={C.skin} />
          <path d="M-14 -11 Q-13 -25 0 -24 Q13 -25 14 -11 Q8 -18 0 -17 Q-8 -18 -14 -11Z" fill={hair} />
          <g transform={flip ? "scale(-1 1)" : undefined}><Face mood={mood} /></g>
          {mask && (
            <g>
              <path d="M-15 -15 Q-8 -19 0 -14 Q8 -19 15 -15 Q15 -6 8 -5 Q3 -5 0 -9 Q-3 -5 -8 -5 Q-15 -6 -15 -15Z" fill={C.work} />
              <ellipse cx="-6.5" cy="-11" rx="3" ry="2.2" fill="#1a1428" /><ellipse cx="6.5" cy="-11" rx="3" ry="2.2" fill="#1a1428" />
              <path d="M15 -14 q6 -2 9 3" stroke={C.work} strokeWidth="1.5" fill="none" />
            </g>
          )}
        </>
      )}
      {children}
    </g>
  );
}

/* ══ 무대 배경 — 장소 ══════════════════════════════════ */
function Backdrop({ place }: { place?: string }) {
  switch (place) {
    case "field": return (<g opacity=".9">
      <path d="M0 112 Q180 92 360 112 V130 H0Z" fill="#1f3b2e" />
      <path d="M20 122 Q180 100 340 122" stroke="#e8d9c5" strokeOpacity=".35" strokeWidth="1.4" fill="none" />
      <path d="M40 128 Q180 108 320 128" stroke="#e8d9c5" strokeOpacity=".25" strokeWidth="1.4" fill="none" />
      <path d="M300 112 V70" stroke="#c9b27a" strokeWidth="2" /><path d="M300 70 l18 6 -18 6z" fill="#ff8a8a" opacity=".8" />
    </g>);
    case "class": return (<g>
      <rect x="92" y="34" width="150" height="62" rx="3" fill="#1d3a2c" stroke="#5a4a30" strokeWidth="3" />
      <path d="M108 52h52M108 64h34M108 76h60" stroke="#e8f0e8" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="262" y="36" width="54" height="56" rx="2" fill="#20344a" stroke="#3a5470" strokeWidth="2" />
      <path d="M289 36v56M262 64h54" stroke="#3a5470" strokeWidth="2" />
    </g>);
    case "hall": return (<g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}><rect x={58 + i * 36} y="40" width="32" height="70" rx="2" fill="#203247" stroke="#2f4a66" />
          <path d={`M${64 + i * 36} 50h20M${64 + i * 36} 54h20`} stroke="#2f4a66" /><circle cx={84 + i * 36} cy="78" r="1.6" fill={C.gold} /></g>
      ))}
    </g>);
    case "lunch": return (<g>
      <rect x="70" y="90" width="220" height="10" rx="3" fill="#3a3550" />
      {[0, 1, 2].map((i) => <rect key={i} x={98 + i * 64} y="82" width="34" height="9" rx="2" fill="#9aa7b4" />)}
      <rect x="250" y="34" width="70" height="40" rx="3" fill="#2a2440" /><text x="285" y="58" textAnchor="middle" fontSize="9" fill={C.dim}>오늘의 메뉴</text>
    </g>);
    case "table": return (<g>
      <path d="M180 0 V28" stroke="#5a4a30" strokeWidth="1.5" />
      <path d="M164 28 h32 l-6 12 h-20z" fill="#e7c58a" /><ellipse cx="180" cy="44" rx="40" ry="8" fill="#ffe9b8" opacity=".15" />
      <rect x="100" y="96" width="160" height="10" rx="3" fill="#6a4a30" />
      <path d="M112 106v20M248 106v20" stroke="#6a4a30" strokeWidth="5" />
      <ellipse cx="150" cy="94" rx="12" ry="3" fill="#f3eff8" opacity=".8" /><ellipse cx="210" cy="94" rx="12" ry="3" fill="#f3eff8" opacity=".8" />
    </g>);
    case "room": return (<g>
      <rect x="250" y="34" width="56" height="46" rx="3" fill="#0f1a2c" stroke="#3a5470" strokeWidth="2" />
      <path d="M278 34v46" stroke="#3a5470" strokeWidth="2" />
      <path d="M296 46a6 6 0 1 1-6-6 4.5 4.5 0 0 0 6 6z" fill="#ffe9b8" />
      <path d="M60 110 v-26 h110 v26" fill="#2a2440" /><rect x="60" y="84" width="34" height="14" rx="5" fill="#e7dcf7" opacity=".8" />
    </g>);
    case "bus": return (<g>
      <path d="M70 40 h140 l-6 8 h-128z" fill="#2f4a66" /><path d="M80 48 v62M200 48 v62" stroke="#2f4a66" strokeWidth="3" />
      <path d="M290 112 V40" stroke="#9aa7b4" strokeWidth="3" /><rect x="276" y="30" width="28" height="22" rx="4" fill="#3a7bd5" />
      <text x="290" y="45" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">BUS</text>
    </g>);
    case "academy": return (<g>
      <rect x="220" y="24" width="100" height="90" fill="#1a2233" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={232 + c * 30} y={36 + r * 22} width="18" height="12" fill={(r + c) % 2 ? "#ffe9b8" : "#2a3448"} opacity=".8" />))}
      <rect x="236" y="10" width="68" height="16" rx="3" fill={C.sit} /><text x="270" y="22" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#2a1a06">○○ 학원</text>
    </g>);
    default: return null;
  }
}

/** 시간 — 하늘 색과 해/달/비 */
const SKY: Record<string, [string, string]> = {
  morning: ["#2b4566", "#0d1520"], noon: ["#355777", "#0f1a28"], hot: ["#5a3c26", "#160e10"],
  dusk: ["#5a2c40", "#120a18"], night: ["#0a1020", "#05070d"], rain: ["#1c2634", "#080b12"],
};
function SkyMark({ time }: { time?: string }) {
  if (time === "hot" || time === "noon") return <circle cx="54" cy="34" r="12" fill="#ffd27a" opacity=".85" />;
  if (time === "morning") return <path d="M30 60a20 20 0 0 1 40 0z" fill="#ffd9a0" opacity=".5" />;
  if (time === "dusk") return <circle cx="56" cy="64" r="16" fill="#ff9a6a" opacity=".55" />;
  if (time === "night") return <path d="M62 34a11 11 0 1 1-11-11 8 8 0 0 0 11 11z" fill="#ffe9b8" opacity=".85" />;
  if (time === "rain") return (
    <g stroke="#9fc3e0" strokeOpacity=".5" strokeWidth="1.2">
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={14 + i * 22} y1={(i * 13) % 50} x2={8 + i * 22} y2={(i * 13) % 50 + 12}>
          <animateTransform attributeName="transform" type="translate" values="0 0;-6 60" dur={`${0.9 + (i % 4) * 0.15}s`} repeatCount="indefinite" />
        </line>
      ))}
    </g>
  );
  return null;
}

/* ══ 무대 한 장 ══════════════════════════════════════ */
export type StageViewProps = {
  phase: "enter" | "card" | "build" | "stage" | "curtain" | "done";
  act?: string;
  mode?: string | null;
  avatar: boolean;
  alias?: string;
  distance: number;
  place?: string;   // 장소 key
  time?: string;    // 시간 key
  object?: string;  // 물건 key
  placeLabel?: string;
  timeLabel?: string;
  otherName?: string;
  hasOther?: boolean;
  frozen?: boolean;
  heavy?: boolean;
};

/** 상대가 서는 자리 — 가까이 · 보통 · 멀리 */
const OTHER_X = [0, 196, 246, 300];

export function StageView(p: StageViewProps) {
  const [top, bottom] = SKY[p.time ?? ""] ?? ["#14243a", "#070c14"];
  const meX = p.mode === "reversal" ? OTHER_X[p.distance] : 120;
  const otherX = p.mode === "reversal" ? 120 : OTHER_X[p.distance];
  const showOther = p.hasOther || p.phase === "enter" || (p.act === "meet" && p.phase === "stage");
  const ghostOther = !p.hasOther;
  const isMirror = p.act === "mirror" && p.phase === "stage";
  const closed = p.phase === "curtain" || p.phase === "done";
  const meMood: Mood = p.frozen ? "tense" : p.heavy ? "tense" : p.act === "replay" ? "talk" : closed ? "soft" : "calm";
  const slug = p.phase === "enter" ? "무대 입장 — 누가 설까"
    : p.phase === "card" ? "오늘의 카드 — 실마리 한 장"
    : p.phase === "build" ? (p.placeLabel ? `S#  ${[p.placeLabel, p.timeLabel].filter(Boolean).join(" · ")}` : "장면 세우기 — 장소 하나부터")
    : `S#  ${[p.placeLabel || "그 자리", p.timeLabel].filter(Boolean).join(" · ")}`;
  const label = p.alias || (p.avatar ? "아바타" : "나");

  return (
    <svg viewBox="0 0 360 170" className="scene-svg in-stage" role="img" style={{ fontFamily: FONT }}
      aria-label={`${slug}. 무대 위에 ${label}${p.avatar ? "(아바타)" : ""}${p.hasOther ? `, ${p.otherName}` : ""}`}>
      <defs>
        <linearGradient id="isv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
        <linearGradient id="isv-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.inner} stopOpacity=".42" /><stop offset="1" stopColor={C.inner} stopOpacity="0" /></linearGradient>
        <linearGradient id="isv-cone2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7dcf7" stopOpacity=".26" /><stop offset="1" stopColor="#e7dcf7" stopOpacity="0" /></linearGradient>
        <radialGradient id="isv-frost"><stop offset=".55" stopColor="#bfe3ff" stopOpacity="0" /><stop offset="1" stopColor="#bfe3ff" stopOpacity=".28" /></radialGradient>
      </defs>
      <rect width="360" height="170" fill="url(#isv-sky)" />
      <SkyMark time={p.time} />
      <Backdrop place={p.place} />

      {/* 무대 바닥 */}
      <path d="M0 132 H360 V170 H0Z" fill="#0b1422" />
      <path d="M0 132 H360" stroke="#2a4462" strokeWidth="1.5" />
      <ellipse cx="180" cy="140" rx="150" ry="9" fill={C.inner} opacity=".08" />

      {/* 조명 */}
      {!closed && <path className="in-cone" d={`M${meX} 0 L${meX - 46} 140 H${meX + 46}Z`} fill="url(#isv-cone)" />}
      {showOther && p.hasOther && !closed && <path d={`M${otherX} 0 L${otherX - 36} 140 H${otherX + 36}Z`} fill="url(#isv-cone2)" />}

      {/* 거리 자 */}
      {showOther && !closed && !isMirror && (
        <g opacity=".75">
          <path d={`M${Math.min(meX, otherX) + 22} 154 H${Math.max(meX, otherX) - 22}`} stroke={C.inner} strokeWidth="1.2" strokeDasharray="2 3" />
          <path d={`M${Math.min(meX, otherX) + 22} 150 v8 M${Math.max(meX, otherX) - 22} 150 v8`} stroke={C.inner} strokeWidth="1.2" />
          <text x={(meX + otherX) / 2} y="166" textAnchor="middle" fontSize="8.5" fill={C.inner}>{["", "가까이", "보통", "멀리"][p.distance]}</text>
        </g>
      )}

      {/* 상대 · 빈 의자 */}
      {p.mode === "chair" ? (
        <g transform={`translate(${OTHER_X[p.distance]} 0)`}>
          <ellipse cx="0" cy="140" rx="20" ry="4" fill="#000" opacity=".35" />
          <path d="M-12 112 h24 v-34 M-12 112 v26 M12 112 v26" stroke={C.gold} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <rect x="-14" y="106" width="28" height="6" rx="2" fill={C.gold} />
          <text x="0" y="70" textAnchor="middle" fontSize="9" fill={C.gold}>빈 의자</text>
        </g>
      ) : showOther && (
        <Actor x={otherX} y={94} s={0.82} tint={p.mode === "reversal" ? "#8fbbe0" : "#cbbfdd"} hair="#5a4a30" ghost={ghostOther}
          mood={p.hasOther ? "calm" : "calm"} flip dim={p.distance === 3 && !ghostOther ? 0.75 : 1}>
          {p.hasOther && p.otherName && (
            <g transform={`scale(-1 1)`}><rect x="-22" y="-44" width="44" height="14" rx="7" fill="#201a33" stroke="#4a3f66" />
              <text x="0" y="-34" textAnchor="middle" fontSize="8.5" fill={C.ink}>{p.otherName}</text></g>
          )}
          {ghostOther && <g transform="scale(-1 1)"><text x="0" y="-5" textAnchor="middle" fontSize="12" fill={C.inner}>?</text></g>}
        </Actor>
      )}

      {/* 나 / 아바타 */}
      {p.phase !== "done" && (
        <Actor x={meX} y={94} s={0.9} tint={p.mode === "reversal" ? "#cbbfdd" : "#9fc3e0"} mask={p.avatar} mood={meMood}
          arms={p.frozen ? "up" : p.act === "replay" ? "reach" : p.phase === "card" ? "front" : "down"} flip={p.mode === "reversal"}>
          {p.object && !p.frozen && p.phase !== "card" && (
            <g transform={p.mode === "reversal" ? "scale(-1 1)" : undefined}>
              <Ico name={p.object} size={15} color={C.paper} x={p.act === "replay" ? 22 : 12} y={p.act === "replay" ? 6 : 24} stroke={2.2} />
            </g>
          )}
          {p.phase === "card" && <rect x="-9" y="16" width="18" height="24" rx="3" fill="#25335a" stroke={C.gold} strokeWidth="1.2" />}
          <g transform={p.mode === "reversal" ? "scale(-1 1)" : undefined}>
            <rect x="-24" y="56" width="48" height="14" rx="7" fill={C.innerD} stroke="#2f5070" />
            <text x="0" y="66" textAnchor="middle" fontSize="8.5" fill={C.inner} fontWeight="700">{label.slice(0, 6)}{p.avatar ? " 🎭" : ""}</text>
          </g>
        </Actor>
      )}

      {/* 기법 연출 */}
      {p.frozen && (
        <g>
          <rect width="360" height="170" fill="url(#isv-frost)" />
          <g transform="translate(332 22)"><circle r="13" fill="#0d1520" stroke="#bfe3ff" /><Ico name="freeze" size={16} color="#bfe3ff" x={-8} y={-8} /></g>
          <text x="332" y="48" textAnchor="middle" fontSize="8.5" fill="#bfe3ff">정지</text>
        </g>
      )}
      {p.mode === "soliloquy" && (
        <g className="ab-bob">
          <path d={`M${meX + 18} 30 q-4 -18 16 -18 q8 -10 22 -2 q16 -2 14 12 q8 10 -6 14 h-38 q-12 2 -8 -6z`} fill="#e7dcf7" opacity=".92" />
          <circle cx={meX + 14} cy="48" r="3" fill="#e7dcf7" opacity=".9" /><circle cx={meX + 9} cy="56" r="2" fill="#e7dcf7" opacity=".8" />
          <text x={meX + 46} y="30" textAnchor="middle" fontSize="9" fill="#2a2233">아무도 못 들어</text>
        </g>
      )}
      {p.mode === "reversal" && (
        <g>
          <path className="ab-flow" d={`M140 26 Q${(meX + otherX) / 2} 4 ${Math.max(meX, otherX) - 18} 26`} stroke={C.work} strokeWidth="1.8" fill="none" />
          <path className="ab-flow" d={`M${Math.max(meX, otherX) - 18} 36 Q${(meX + otherX) / 2} 56 140 36`} stroke={C.work} strokeWidth="1.8" fill="none" />
          <text x={(meX + otherX) / 2} y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill={C.work}>자리 바꾸기</text>
        </g>
      )}
      {p.mode === "future" && (
        <g>
          <rect x="268" y="10" width="78" height="22" rx="11" fill="#1d2a1c" stroke={C.note} />
          <Ico name="future" size={14} color={C.note} x={274} y={14} />
          <text x="314" y="25" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={C.note}>일주일 뒤</text>
        </g>
      )}
      {p.act === "replay" && p.phase === "stage" && !p.mode && (
        <g transform="translate(300 12)">
          <rect x="0" y="6" width="48" height="26" rx="3" fill="#1a1422" stroke={C.ink} />
          <path d="M0 6 l46 -6 2 6z" fill={C.ink} />
          <text x="24" y="24" textAnchor="middle" fontSize="10" fontWeight="900" fontFamily={MONO} fill={C.sit}>TAKE 2</text>
        </g>
      )}

      {/* 객석에서 보기 — 앞줄 의자 등받이와 내 뒷모습 */}
      {isMirror && (
        <g>
          <rect width="360" height="170" fill="#04070c" opacity=".35" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${18 + i * 44} 170 v-16 a18 18 0 0 1 36 0 v16`} fill="#0a121e" stroke={C.inner} strokeOpacity=".45" strokeWidth="1.6" />
          ))}
          <g transform="translate(180 150)">
            <circle cx="0" cy="-12" r="11" fill="#3a2c48" />
            <path d="M-16 20 Q-16 0 0 0 Q16 0 16 20Z" fill="#26364a" />
          </g>
          <text x="180" y="124" textAnchor="middle" fontSize="9" fill={C.inner}>객석의 나 — 밖에서 보기</text>
        </g>
      )}

      {/* 커튼 — 열린 무대는 양옆에, 커튼콜엔 가운데로 닫힌다 */}
      {closed ? (
        <g>
          <g className="in-close l">
            <rect x="0" y="0" width="181" height="170" fill={C.curtain} />
            {[22, 52, 84, 116, 150].map((x) => <path key={x} d={`M${x} 0 Q${x - 8} 85 ${x + 4} 170`} stroke={C.curtainD} strokeWidth="7" fill="none" opacity=".7" />)}
          </g>
          <g className="in-close r">
            <rect x="179" y="0" width="181" height="170" fill={C.curtain} />
            {[210, 244, 276, 308, 338].map((x) => <path key={x} d={`M${x} 0 Q${x + 8} 85 ${x - 4} 170`} stroke={C.curtainD} strokeWidth="7" fill="none" opacity=".7" />)}
          </g>
          <path d="M180 0 V170" stroke="#2a0f2e" strokeWidth="2" />
          <ellipse cx="180" cy="170" rx="160" ry="14" fill={C.sit} opacity=".12" />
        </g>
      ) : (
        <>
          <path d="M0 0 H50 Q34 85 46 170 H0Z" fill={C.curtain} opacity=".88" />
          <path d="M360 0 H310 Q326 85 314 170 H360Z" fill={C.curtain} opacity=".88" />
        </>
      )}
      <path d="M0 0 H360 V10 Q270 20 180 10 Q90 20 0 10Z" fill={C.curtainD} />
      {closed && (
        <g>
          <rect x="112" y="60" width="136" height="46" rx="10" fill="#1a0c1e" opacity=".75" />
          <text x="180" y="80" textAnchor="middle" fontSize="15" fontWeight="900" fill={C.ink}>커튼콜</text>
          <text x="180" y="97" textAnchor="middle" fontSize="9.5" fill={C.dim}>무대에서 내려와 · 남기고 싶은 말만</text>
        </g>
      )}

      {/* 장면 이름표 */}
      {!closed && <g>
        <rect x="56" y="14" width={Math.min(240, slug.length * 7.4 + 16)} height="17" rx="5" fill="#05070d" opacity=".7" />
        <text x="64" y="26" fontSize="9.5" fontFamily={p.phase === "stage" || p.phase === "build" ? MONO : FONT} fill={C.inner}>{slug}</text>
      </g>}
    </svg>
  );
}

/* ══ 나로 / 아바타로 ═══════════════════════════════════ */
export function Portrait({ avatar, on }: { avatar: boolean; on?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={on ? (avatar ? "#2a1f44" : C.innerD) : "#171225"} stroke={on ? (avatar ? C.work : C.inner) : C.line} strokeWidth="1.5" />
      <g transform="translate(32 40)">
        <path d="M-16 24 Q-16 6 0 6 Q16 6 16 24Z" fill={avatar ? "#b9a6d9" : "#9fc3e0"} />
        <circle cx="0" cy="-9" r="13" fill={C.skin} />
        <path d="M-13 -11 Q-12 -24 0 -23 Q12 -24 13 -11 Q8 -17 0 -16 Q-8 -17 -13 -11Z" fill="#3a2c48" />
        <Face mood={on ? "soft" : "calm"} />
        {avatar && (
          <g className={on ? "ab-bob" : undefined}>
            <path d="M-15 -15 Q-8 -19 0 -14 Q8 -19 15 -15 Q15 -6 8 -5 Q3 -5 0 -9 Q-3 -5 -8 -5 Q-15 -6 -15 -15Z" fill={C.work} />
            <ellipse cx="-6.5" cy="-11" rx="3" ry="2.2" fill="#1a1428" /><ellipse cx="6.5" cy="-11" rx="3" ry="2.2" fill="#1a1428" />
          </g>
        )}
      </g>
    </svg>
  );
}

/* ══ 거리 ═════════════════════════════════════════════ */
export function DistanceArt({ d }: { d: number }) {
  const gap = [0, 26, 46, 66][d];
  return (
    <svg viewBox="0 0 96 36" width="84" height="32" aria-hidden="true">
      <g transform="translate(14 0)">
        <circle cx="0" cy="11" r="6" fill={C.inner} /><path d="M-7 30 Q-7 18 0 18 Q7 18 7 30Z" fill={C.inner} />
      </g>
      <g transform={`translate(${14 + gap} 0)`} opacity={d === 3 ? 0.55 : 0.9}>
        <circle cx="0" cy="11" r="6" fill="#cbbfdd" /><path d="M-7 30 Q-7 18 0 18 Q7 18 7 30Z" fill="#cbbfdd" />
      </g>
      <path d={`M24 33 H${4 + gap}`} stroke={C.inner} strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
  );
}

/* ══ 오늘의 카드 ═════════════════════════════════════ */
export function CardArt({ open, icon, name }: { open: boolean; icon?: string; name?: string }) {
  return (
    <svg viewBox="0 0 60 84" className={`in-card${open ? " open" : ""}`} aria-hidden="true">
      {open ? (
        <>
          <rect x="1" y="1" width="58" height="82" rx="7" fill={C.paper} stroke={C.gold} strokeWidth="1.5" />
          <rect x="5" y="5" width="50" height="74" rx="5" fill="none" stroke={C.gold} strokeOpacity=".5" />
          {icon && <Ico name={icon} size={26} color="#4a3a20" x={17} y={20} stroke={1.8} />}
          <text x="30" y="66" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#4a3a20">{name}</text>
        </>
      ) : (
        <>
          <rect x="1" y="1" width="58" height="82" rx="7" fill="#1b2744" stroke="#3a5470" strokeWidth="1.5" />
          <rect x="6" y="6" width="48" height="72" rx="5" fill="none" stroke={C.gold} strokeOpacity=".45" />
          <path d="M30 22 l9 20 -9 20 -9 -20z" fill="none" stroke={C.gold} strokeOpacity=".7" strokeWidth="1.3" />
          <circle cx="30" cy="42" r="4" fill={C.gold} opacity=".7" />
          {[[14, 14], [46, 14], [14, 70], [46, 70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill={C.gold} opacity=".6" />)}
        </>
      )}
    </svg>
  );
}

/* ══ 세 단계 레일 ═════════════════════════════════════ */
export function StepRail({ idx, labels, can, onGo }: {
  idx: number;
  labels: { name: string; sub: string }[];
  /** 눌러서 갈 수 있는 단계 */
  can?: boolean[];
  onGo?: (i: number) => void;
}) {
  const icons = ["stairs", "spot", "note"];
  return (
    <nav className="in-rail" aria-label="세 단계">
      {labels.map((l, i) => {
        const go = !!can?.[i] && !!onGo;
        return (
          <button key={l.name} type="button" disabled={!go}
            className={`${i < idx ? "done" : i === idx ? "on" : ""}${go ? " go" : ""}`}
            aria-current={i === idx ? "step" : undefined}
            title={go ? (i === idx ? `${l.name} 고치기` : `${l.name}(으)로 가기`) : undefined}
            onClick={() => go && onGo!(i)}>
            <span className="in-rail-dot">{i < idx ? <Ico name="check" size={11} stroke={2.6} /> : <Ico name={icons[i]} size={11} stroke={2.2} />}</span>
            <span className="in-rail-t"><b>{l.name}</b><small>{l.sub}</small></span>
            {go && <span className="in-rail-go"><Ico name={i < idx ? "pencil" : "next"} size={10} stroke={2.4} /></span>}
          </button>
        );
      })}
    </nav>
  );
}
