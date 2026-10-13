/**
 * ✨ 소개 화면 삽화 — 도형 말고 「장면」으로 보여 준다.
 * 원천: 마음씬 프로덕트 기획서 · frontend(마음무대) /about 의 무대 삽화 톤
 * 색: 🎞 금빛 무대 조명(--sit) · 🪞 푸른 객석 조명(--inner) · 🔗 보라(--work) · 🔍 민트(--note)
 */
import type { ReactNode } from "react";

const C = {
  sit: "#ffcf7a", inner: "#8fbbe0", work: "#c9a6ff", note: "#9fe0c0", marker: "#fff27a",
  ink: "#f3eff8", dim: "#b4abc6", faint: "#7b7290", panel: "#171225", panel2: "#201a33", line: "#2d2542",
  curtain: "#4e2352", curtainD: "#33163a", skin: "#fdf3e6", body: "#e8d9c5", paper: "#fbf3e0",
};
const FONT = '-apple-system, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';
const SERIF = '"Iowan Old Style", "Apple SD Gothic Neo", serif';

/* ══ 공통 소품 ═══════════════════════════════════════ */

/** 무대에 서는 작은 사람 — 마음무대 /about 의 Kid와 같은 꼴 */
function Kid({
  x, y, s = 1, face = "🙂", tint = C.body, dim = 1, flip, arms = "down", children,
}: {
  x: number; y: number; s?: number; face?: string; tint?: string; dim?: number; flip?: boolean;
  /** down: 내린 팔 · front: 앞으로 뭔가 든 팔 · up: 한 손 든 팔(✋) · sit: 앉은 자세 */
  arms?: "down" | "front" | "up" | "sit";
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={dim}>
      <ellipse cx="0" cy="45" rx="19" ry="5" fill="#000" opacity=".3" />
      {arms === "sit" ? (
        <>
          <path d="M-13 30 L-10 8 Q0 1 10 8 L13 30 Z" fill={tint} />
          <path d="M-13 30 H14 L16 44 H8 L7 36 H-12Z" fill={tint} opacity=".85" />
        </>
      ) : (
        <path d="M-15 45 L-11 8 Q0 1 11 8 L15 45 Z" fill={tint} />
      )}
      {arms === "down" && <><path d="M-12 13 L-20 33" stroke={tint} strokeWidth="5" strokeLinecap="round" /><path d="M12 13 L20 33" stroke={tint} strokeWidth="5" strokeLinecap="round" /></>}
      {arms === "front" && <><path d="M-12 13 L-6 26" stroke={tint} strokeWidth="5" strokeLinecap="round" /><path d="M12 13 L8 26" stroke={tint} strokeWidth="5" strokeLinecap="round" /></>}
      {arms === "up" && <><path d="M-12 13 L-20 33" stroke={tint} strokeWidth="5" strokeLinecap="round" /><path d="M12 12 L22 -4" stroke={tint} strokeWidth="5" strokeLinecap="round" /></>}
      {arms === "sit" && <><path d="M-11 13 L-4 25" stroke={tint} strokeWidth="5" strokeLinecap="round" /><path d="M11 13 L5 25" stroke={tint} strokeWidth="5" strokeLinecap="round" /></>}
      <circle cx="0" cy="-9" r="14" fill={C.skin} />
      <g transform={flip ? "scale(-1 1)" : undefined}>
        <text x="0" y="-3" fontSize="17" textAnchor="middle">{face}</text>
      </g>
      {children}
    </g>
  );
}

function Curtains({ h, w = 360, op = 0.75 }: { h: number; w?: number; op?: number }) {
  return (
    <>
      <path d={`M0 0 H54 Q36 ${h / 2} 50 ${h} H0 Z`} fill={C.curtain} opacity={op} />
      <path d={`M${w} 0 H${w - 54} Q${w - 36} ${h / 2} ${w - 50} ${h} H${w} Z`} fill={C.curtain} opacity={op} />
      <path d={`M0 0 H22 Q11 ${h / 2} 18 ${h} H0 Z`} fill={C.curtainD} opacity=".7" />
      <path d={`M${w} 0 H${w - 22} Q${w - 11} ${h / 2} ${w - 18} ${h} H${w} Z`} fill={C.curtainD} opacity=".7" />
      <path d={`M0 0 H${w} V10 Q${w * 0.75} 20 ${w / 2} 10 Q${w * 0.25} 20 0 10Z`} fill={C.curtainD} />
    </>
  );
}

function Sky({ id, h, top = "#241a44", bottom = "#0c0718" }: { id: string; h: number; top?: string; bottom?: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="360" height={h} fill={`url(#${id})`} />
    </>
  );
}

function Twinkle({ pts }: { pts: [number, number][] }) {
  return (
    <>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.3 : 2} fill="#fff" opacity=".6">
          <animate attributeName="opacity" values=".2;.85;.2" dur={`${2.4 + i * 0.45}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

/** 씬 한 장 — 별이 박힌 작은 대본 종이 */
function ScenePage({ x, y, s = 1, tone = C.work, rot = 0, glow }: { x: number; y: number; s?: number; tone?: string; rot?: number; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {glow && <circle cx="0" cy="0" r="30" fill={tone} opacity=".22" />}
      <rect x="-14" y="-18" width="28" height="36" rx="3.5" fill={C.paper} stroke={tone} strokeWidth="1.6" />
      <path d="M-8 -10h16M-8 -5h11" stroke="#9b8a6a" strokeWidth="1.4" strokeLinecap="round" />
      <path d="m0 1 2 4 4.4.6-3.2 3.1.8 4.4L0 11l-4 2.1.8-4.4L-6.4 5.6l4.4-.6z" fill={C.sit} stroke="#c99a3c" strokeWidth=".7" />
    </g>
  );
}

function Phone({ x, y, s = 1, children }: { x: number; y: number; s?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="0" y="0" width="40" height="74" rx="8" fill="#1a1422" stroke="#e7c58a" strokeWidth="1.4" />
      <rect x="3.5" y="6" width="33" height="62" rx="4" fill="#ece6f6" />
      <rect x="15" y="2" width="10" height="2.4" rx="1.2" fill="#3a2c48" />
      {children}
    </g>
  );
}

/* ══ 작은 선화 글리프 — 칩·버튼용 ══════════════════════ */
export type GlyphName = "lock" | "check" | "cross" | "pencil" | "stack" | "lens" | "clapper" | "link" | "pick";
const GLYPHS: Record<GlyphName, ReactNode> = {
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  cross: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  pencil: <><path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" /><path d="m13.5 6.5 4 4" /></>,
  stack: <><rect x="7" y="3" width="13" height="13" rx="2" /><path d="M4.5 6.5v11a2 2 0 0 0 2 2h11" /><path d="M10 7.5h7M10 10.5h4.5" /></>,
  lens: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  clapper: <><path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M4 10 3.2 6.6 18.6 3l.8 3.4z" /><path d="m8 5.6 2 3.2M12.6 4.6l2 3.2" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.2-1.2" /></>,
  pick: <><rect x="3" y="5" width="11" height="6" rx="3" /><rect x="10" y="13" width="11" height="6" rx="3" /><path d="M18 3.5v3M16.5 5h3" /></>,
};
export function Glyph({ name, size = 20, color = "currentColor", x, y, stroke = 1.8 }: { name: GlyphName; size?: number; color?: string; x?: number; y?: number; stroke?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, overflow: "visible" }}>
      {GLYPHS[name]}
    </svg>
  );
}

/* ══ 히어로 — 빨랫줄에 걸린 씬들 아래, 씬 한 장을 든 아이 ══ */
export function HeroArt() {
  const pins: { x: number; y: number; t: string; r: number }[] = [
    { x: 70, y: 46, t: C.sit, r: -8 }, { x: 125, y: 56, t: C.inner, r: 5 }, { x: 235, y: 56, t: C.sit, r: -4 }, { x: 290, y: 46, t: C.inner, r: 9 },
  ];
  return (
    <svg viewBox="0 0 360 210" className="scene-svg" role="img" aria-label="무대 위 줄에 씬 종이들이 걸려 있고, 아이가 빛나는 씬 한 장을 들고 서 있다" style={{ fontFamily: FONT }}>
      <Sky id="hero-bg" h={210} />
      <defs>
        <linearGradient id="hero-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".32" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></linearGradient>
        <linearGradient id="hero-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.inner} stopOpacity=".3" /><stop offset="1" stopColor={C.inner} stopOpacity="0" /></linearGradient>
        <linearGradient id="hero-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9b8" stopOpacity=".34" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></linearGradient>
      </defs>
      <Twinkle pts={[[40, 24], [96, 84], [160, 28], [204, 82], [270, 24], [318, 86]]} />
      <path d="M90 0 L40 200 H150Z" fill="url(#hero-gold)" />
      <path d="M270 0 L210 200 H320Z" fill="url(#hero-blue)" />
      <path d="M180 14 L250 196 H110Z" fill="url(#hero-cone)" />
      <ellipse cx="180" cy="190" rx="120" ry="14" fill="#fff" opacity=".09" />
      {/* 빨랫줄 */}
      <path d="M30 34 Q180 78 330 34" stroke="#8a7a5c" strokeWidth="1.2" fill="none" />
      {pins.map((p, i) => (
        <g key={i} className="ab-bob" style={{ animationDelay: `${-i * 0.9}s` }}>
          <rect x={p.x - 2} y={p.y - 14} width="4" height="8" rx="1" fill="#c9a15c" />
          <ScenePage x={p.x} y={p.y + 8} s={0.78} tone={p.t} rot={p.r} />
        </g>
      ))}
      <Curtains h={210} />
      <Kid x={180} y={144} face="😊" arms="front">
        <g className="ab-bob"><ScenePage x={0} y={24} s={0.8} glow /></g>
      </Kid>
      <text x="74" y="200" fontSize="9.5" fill={C.sit} textAnchor="middle" opacity=".8">🎞 상황극</text>
      <text x="286" y="200" fontSize="9.5" fill={C.inner} textAnchor="middle" opacity=".8">🪞 내 무대</text>
    </svg>
  );
}

/* ══ 01 씬 — 졸업 일주일 전, 해 질 녘 도서관 반납함 ══════════ */
export function SceneOneArt() {
  const spines = [C.sit, C.inner, C.work, C.note, "#b07ac9", C.inner, C.sit, C.work];
  return (
    <svg viewBox="0 0 360 210" className="scene-svg" role="img" aria-label="해 질 녘 도서관, 창으로 노을빛이 들어오고, 반납함 앞에 선 아이 손에서 이름이 적힌 편지 봉투가 떨어진다" style={{ fontFamily: FONT }}>
      <Sky id="s1-bg" h={210} top="#2a1d2e" bottom="#120d1e" />
      <defs>
        <linearGradient id="s1-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} /><stop offset=".6" stopColor="#d98aa8" /><stop offset="1" stopColor="#4e2352" /></linearGradient>
        <linearGradient id="s1-beam" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".32" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></linearGradient>
      </defs>
      {/* 책장 */}
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="10" y={24 + r * 34} width="118" height="4" fill="#5e4c6a" />
          {spines.map((c, k) => (
            <rect key={k} x={16 + k * 13.5} y={24 + r * 34 - 24 + ((k + r) % 3) * 3} width="10" height={24 - ((k + r) % 3) * 3} rx="1" fill={c} opacity={0.35 + ((k + r) % 4) * 0.08} />
          ))}
        </g>
      ))}
      {/* 노을 창 · 빛줄기 */}
      <rect x="250" y="18" width="88" height="96" rx="3" fill="url(#s1-sunset)" opacity=".9" />
      <path d="M294 18v96M250 66h88" stroke="#2a1d2e" strokeWidth="3" />
      <rect x="250" y="18" width="88" height="96" rx="3" fill="none" stroke="#5e4c6a" strokeWidth="3" />
      <path d="M250 40 L338 112 L230 200 L120 200Z" fill="url(#s1-beam)" />
      {[[200, 120], [222, 150], [178, 160], [240, 172], [196, 186]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="1.4" fill={C.sit} opacity=".7"><animate attributeName="cy" values={`${y};${y - 8};${y}`} dur={`${3 + k * 0.6}s`} repeatCount="indefinite" /></circle>
      ))}
      {/* 바닥 */}
      <rect x="0" y="176" width="360" height="34" fill="#1a1428" />
      {/* 반납함 */}
      <g transform="translate(150 118)">
        <rect x="0" y="0" width="64" height="62" rx="3" fill="#5e4c6a" />
        <rect x="10" y="12" width="44" height="6" rx="2" fill="#120d1e" />
        <text x="32" y="44" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.paper}>반 납</text>
        <rect x="6" y="-10" width="40" height="10" rx="1" fill={C.inner} opacity=".7" />
        <rect x="12" y="-18" width="34" height="8" rx="1" fill={C.sit} opacity=".7" />
      </g>
      {/* 아이 — 떨어지는 편지를 본다 */}
      <Kid x={252} y={140} s={0.86} face="😮" arms="front" />
      <g className="ab-bob">
        <g transform="translate(206 104) rotate(-14)">
          <rect x="0" y="0" width="38" height="26" rx="2" fill={C.paper} stroke={C.sit} strokeWidth="1.2" />
          <path d="M0 0 L19 14 L38 0" stroke="#c9b897" fill="none" />
          <text x="19" y="23" textAnchor="middle" fontSize="6.5" fill="#4a3c58">To. 하은</text>
        </g>
      </g>
      {/* 슬레이트 */}
      <g transform="translate(14 150) rotate(-5)">
        <rect x="0" y="10" width="126" height="38" rx="3" fill="#1b1b22" stroke={C.ink} strokeWidth="1.2" />
        <path d="M0 10 L-2 0 L124 -6 L126 4Z" fill={C.ink} />
        <path d="M14 -1l8 10M38 -2l8 10M62 -3l8 10M86 -4l8 10M110 -5l8 10" stroke="#1b1b22" strokeWidth="5" />
        <text x="8" y="26" fontSize="10" fill="#fff" fontFamily={MONO}>S#1  도서관 반납함 앞</text>
        <text x="8" y="41" fontSize="10" fill={C.sit} fontFamily={MONO}>졸업 D-7 · 해 질 녘</text>
      </g>
    </svg>
  );
}

/* ══ 01 씬 한 장 해부도 — 예시가 채워진 대본 카드 ═════════ */
export type PieceExample = {
  slug: string; light: string; origin: string; title: string;
  fixed: string[]; open: string[]; pivot: string; tones: string[];
  line: string; direction: string; by: string;
};

/** 한글 위주 글자 폭 어림 — 칩 너비용 */
const textW = (t: string, fs: number) => [...t].reduce((w, ch) => w + (/[ㄱ-힝「」]/.test(ch) ? fs : fs * 0.55), 0);

export function PieceAnatomy({ ex }: { ex: PieceExample }) {
  // 앱 밤 무대 톤 하나로 — 번호는 보라(--work), 체크는 민트(--note), 출처는 그 무대 색, 결정적 자리만 금빛(--sit)
  const paper = "#1b1530", ink = C.ink, soft = C.dim, rule = "#2f2648";
  const tone = ex.origin === "inner" ? C.inner : C.sit;
  const Num = ({ n, x, y, c = C.work }: { n: number; x: number; y: number; c?: string }) => (
    <g><circle cx={x} cy={y} r="9" fill={c} stroke={paper} strokeWidth="2" /><text x={x} y={y + 3.6} textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#1a1020">{n}</text></g>
  );
  const inner = ex.origin === "inner";
  // 열린 것 칩 — 한 줄에 안 들어가면 다음 줄로
  let cx = 40, cy = 254;
  const chips = ex.open.map((t) => {
    const w = textW(t, 10.5) + 22;
    if (cx + w > 326) { cx = 40; cy += 28; }
    const c = { t, x: cx, y: cy, w };
    cx += w + 6;
    return c;
  });
  let tx = 66;
  const tones = ex.tones.map((t) => { const w = textW(t, 10) + 16; const c = { t, x: tx, w }; tx += w + 5; return c; });
  return (
    <svg viewBox="0 0 360 486" width="100%" role="img"
      aria-label={`씬 한 장 예시 「${ex.title}」: 배경, 출처, 뼈대, 결정적 자리, 마지막 컷`} style={{ display: "block", fontFamily: FONT }}>
      <defs>
        <filter id="pc-shadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#000" floodOpacity=".6" /></filter>
        <filter id="pc-glow" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="7" floodColor={C.sit} floodOpacity=".35" /></filter>
        <pattern id="pc-lines" width="10" height="22" patternUnits="userSpaceOnUse"><path d="M0 21.5H10" stroke="#231c3a" /></pattern>
        <clipPath id="pc-thumb"><rect x="44" y="70" width="72" height="56" rx="6" /></clipPath>
      </defs>

      {/* 종이 */}
      <g filter="url(#pc-shadow)"><rect x="24" y="14" width="312" height="462" rx="14" fill={paper} stroke="#3a2d5a" /></g>
      <rect x="24" y="14" width="312" height="462" rx="14" fill="url(#pc-lines)" opacity=".7" />
      {[90, 240, 400].map((y) => <circle key={y} cx="33" cy={y} r="3.6" fill="#0f0b1a" opacity=".9" stroke="#3a2d5a" />)}
      {/* 클립 */}
      <path d="M300 6 v34 a7 7 0 0 0 14 0 V12 a4 4 0 0 0 -8 0 v26" stroke="#8a80a0" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* 머리 — 제목 · ② 출처 */}
      <text x="44" y="34" fontSize="9" letterSpacing="1.6" fill={soft} fontFamily={MONO}>SCENE CARD</text>
      <text x="44" y="53" fontSize="15" fontWeight="900" fill={ink}>{ex.title}</text>
      <Num n={2} x={180} y={46} />
      <g fontSize="10" fontWeight="800">
        <rect x="194" y="36" width="56" height="20" rx="10" fill={inner ? "transparent" : "#3a2a10"} stroke={inner ? "#3a2d5a" : C.sit} strokeDasharray={inner ? "3 3" : undefined} />
        <text x="222" y="50" textAnchor="middle" fill={inner ? C.faint : C.sit} opacity={inner ? 0.7 : 1}>🎞 상황극</text>
        <rect x="254" y="36" width="60" height="20" rx="10" fill={inner ? "#142334" : "transparent"} stroke={inner ? C.inner : "#3a2d5a"} strokeDasharray={inner ? undefined : "3 3"} />
        <text x="284" y="50" textAnchor="middle" fill={inner ? C.inner : C.faint} opacity={inner ? 1 : 0.7}>🪞 내 무대</text>
      </g>

      {/* ① 배경 — 작은 장면 그림 + 슬러그 */}
      <rect x="36" y="64" width="290" height="68" rx="10" fill={inner ? "#0f1a28" : "#1d1609"} stroke={inner ? "#26405a" : "#4d3a17"} />
      <g clipPath="url(#pc-thumb)">
        <rect x="44" y="70" width="72" height="56" fill="#1a2236" />
        <rect x="62" y="74" width="36" height="3" rx="1.5" fill="#e9f2ff"><animate attributeName="opacity" values="1;1;.3;1;.5;1" dur="3s" repeatCount="indefinite" /></rect>
        <path d="M62 77 L52 126 H108 L98 77Z" fill="#e9f2ff" opacity=".08" />
        <circle cx="54" cy="88" r="5" fill="#f3eee2" /><path d="M54 88v-3M54 88l2.5 1" stroke="#2a2233" strokeWidth="1" />
        <rect x="70" y="112" width="40" height="4" rx="1" fill="#6e5a78" />
        <circle cx="90" cy="100" r="5.5" fill={C.skin} />
        <path d="M84 112 q6 -10 12 0" fill={C.body} />
        <rect x="80" y="106" width="4" height="6" rx="1" fill="#9fd0ff" />
      </g>
      <rect x="44" y="70" width="72" height="56" rx="6" fill="none" stroke={tone} strokeOpacity=".5" />
      <Num n={1} x={134} y={80} />
      <text x="148" y="84" fontSize="12" fontWeight="800" fill={ink}>배경</text>
      <text x="128" y="104" fontSize="10.2" fontFamily={MONO} fill={tone}>{ex.slug}</text>
      <text x="128" y="121" fontSize="10" fill={soft}>💡 {ex.light}</text>

      {/* ③ 뼈대 — 정해진 것 / 열린 것 */}
      <Num n={3} x={46} y={152} />
      <text x="60" y="156" fontSize="12" fontWeight="800" fill={ink}>뼈대</text>
      <text x="324" y="156" fontSize="9.5" fill={soft} textAnchor="end">정해진 것 3 + 열린 것 3</text>
      <line x1="36" y1="164" x2="326" y2="164" stroke={rule} strokeWidth="1.4" />
      {ex.fixed.map((f, k) => (
        <g key={f}>
          <Glyph name="check" x={40} y={172 + k * 21} size={14} color={C.note} stroke={2.8} />
          <text x="60" y={183 + k * 21} fontSize="11.5" fill={ink}>{f}</text>
        </g>
      ))}
      <text x="40" y="246" fontSize="9.5" fill={soft}>아직 열린 것 — 씬 하면서 정해져</text>
      {chips.map((c) => (
        <g key={c.t}>
          <rect x={c.x} y={c.y} width={c.w} height="22" rx="11" fill="#221a38" stroke="#5a4a80" strokeDasharray="3 3" />
          <text x={c.x + c.w / 2} y={c.y + 15} textAnchor="middle" fontSize="10.5" fill={C.dim}>{c.t}</text>
        </g>
      ))}

      {/* ④ 결정적 자리 — 종이 밖으로 튀어나온 금빛 띠 */}
      <g filter="url(#pc-glow)"><rect x="14" y="320" width="332" height="74" rx="12" fill="#241a0a" stroke={C.sit} strokeWidth="1.8" /></g>
      <path d="m42 334 3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.2z" fill={C.sit} stroke="#a8781e" strokeWidth="1.2" />
      <text x="66" y="344" fontSize="12.5" fontWeight="900" fill={C.sit}>결정적 자리</text>
      <text x="66" y="362" fontSize="11.5" fill={ink}>{ex.pivot}</text>
      {tones.map((t) => (
        <g key={t.t}>
          <rect x={t.x} y="370" width={t.w} height="17" rx="8.5" fill="#3a2a10" stroke="#5a4317" />
          <text x={t.x + t.w / 2} y="382" textAnchor="middle" fontSize="10" fill={C.sit}>{t.t}</text>
        </g>
      ))}
      <Num n={4} x={332} y={326} c={C.sit} />

      {/* ⑤ 마지막 컷 — 손글씨 한 줄 */}
      <Num n={5} x={46} y={414} />
      <text x="60" y="418" fontSize="12" fontWeight="800" fill={ink}>마지막 컷</text>
      <line x1="36" y1="426" x2="326" y2="426" stroke={rule} strokeWidth="1.4" />
      <text x="44" y="450" fontSize="17" fontWeight="700" fill={ink} fontFamily={SERIF}>{ex.line}</text>
      <path d="M44 456 q30 4 60 0 t60 0" stroke={C.marker} strokeOpacity=".75" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeDasharray="130" strokeDashoffset="130">
        <animate attributeName="stroke-dashoffset" values="130;0;0" keyTimes="0;.4;1" dur="4s" repeatCount="indefinite" />
      </path>
      <text x="44" y="470" fontSize="10.5" fontStyle="italic" fill={soft}>{ex.direction}</text>
      <text x="322" y="470" fontSize="9.5" fill={soft} textAnchor="end">{ex.by}</text>
      <g transform="translate(282 432) rotate(18)">
        <rect x="0" y="0" width="34" height="7" rx="1.5" fill="#f2c14e" />
        <path d="M34 0 l8 3.5 -8 3.5z" fill="#e8c9a0" /><path d="M40 2.6 l2 .9 -2 .9z" fill="#2a2233" />
        <rect x="-5" y="0" width="5" height="7" rx="1" fill="#e58a8a" />
      </g>
    </svg>
  );
}

/* ══ 02 두 무대 — 불 켜진 무대 | 거울 방 → 씬 한 장 ════════ */
export function TwoStagesArt() {
  return (
    <svg viewBox="0 0 360 220" className="scene-svg" role="img" aria-label="왼쪽은 깃털 모자를 쓴 아이가 편지를 든 밝은 무대, 오른쪽은 거울 앞에 선 아이와 객석이 있는 어두운 방. 둘 다 아래로 씬 한 편을 남긴다" style={{ fontFamily: FONT }}>
      <defs>
        <linearGradient id="ts-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1d2e" /><stop offset="1" stopColor="#120d1e" /></linearGradient>
        <linearGradient id="ts-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f2032" /><stop offset="1" stopColor="#070c14" /></linearGradient>
        <linearGradient id="ts-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".5" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></linearGradient>
        <radialGradient id="ts-halo"><stop offset="0" stopColor={C.inner} stopOpacity=".45" /><stop offset="1" stopColor={C.inner} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="180" height="220" fill="url(#ts-l)" />
      <rect x="180" y="0" width="180" height="220" fill="url(#ts-r)" />
      {/* 왼쪽 — 불 켜진 무대 */}
      <path d="M0 0 H34 Q22 70 32 150 H0Z" fill={C.curtain} opacity=".85" />
      <path d="M180 0 H146 Q158 70 148 150 H180Z" fill={C.curtain} opacity=".85" />
      <path d="M90 0 L44 150 H136Z" fill="url(#ts-cone)" />
      <ellipse cx="90" cy="146" rx="52" ry="8" fill={C.sit} opacity=".25" />
      <Kid x={74} y={100} s={0.82} face="😏" arms="front">
        {/* 깃털 모자 */}
        <path d="M-15 -19 Q0 -32 15 -19Z" fill="#3b2a5a" />
        <path d="M6 -26 Q22 -46 30 -40 Q18 -34 10 -22" fill={C.sit} />
        {/* 편지 */}
        <rect x="-10" y="18" width="20" height="14" rx="1.5" fill={C.paper} stroke="#c99a3c" />
        <path d="M-10 18 L0 26 L10 18" stroke="#c99a3c" fill="none" />
      </Kid>
      <Kid x={116} y={106} s={0.7} face="🙏" tint="#d6c7b0" />
      <text x="90" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.sit}>🎞 상황극 무대</text>
      {/* 오른쪽 — 거울 방 */}
      <circle cx="292" cy="80" r="56" fill="url(#ts-halo)" />
      <ellipse cx="300" cy="80" rx="30" ry="42" fill="#132538" stroke="#c9b27a" strokeWidth="3" />
      <ellipse cx="300" cy="80" rx="25" ry="37" fill="#1a3048" />
      <Kid x={300} y={84} s={0.62} face="🙂" tint="#8fbbe0" dim={0.45} flip />
      <path d="M284 56c3-6 8-9 14-10" stroke="#dbeaf7" strokeOpacity=".6" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M300 122v16M288 138h24" stroke="#c9b27a" strokeWidth="3" strokeLinecap="round" />
      <Kid x={242} y={102} s={0.8} face="🤔" tint="#c9d6e3" />
      {/* 객석 의자 등받이 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${196 + i * 27} 162 v-8 a10 10 0 0 1 20 0 v8`} fill="#0b1522" stroke={C.inner} strokeOpacity=".5" strokeWidth="1.6" />
      ))}
      <text x="270" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.inner}>🪞 내 무대</text>
      {/* 가운데 벽 */}
      <rect x="178" y="0" width="4" height="168" fill="#05030b" />
      {/* 떨어지는 씬 두 장 → 하나로 */}
      <path className="ab-flow" d="M90 156 C 90 186, 160 178, 172 196" stroke={C.sit} strokeWidth="1.8" fill="none" />
      <path className="ab-flow" d="M270 172 C 270 190, 200 180, 188 196" stroke={C.inner} strokeWidth="1.8" fill="none" />
      <rect x="0" y="168" width="360" height="52" fill="#0f0b1a" opacity=".6" />
      <ScenePage x={180} y={196} s={0.9} glow />
      <text x="208" y="200" fontSize="10.5" fill={C.work} fontWeight="700">같은 씬 한 편</text>
    </svg>
  );
}

/* ══ 맛 — 🥛 매점 → 🌶 단톡방 → 🌶🌶 졸업식 운동장 ══════════════
   오른쪽으로 갈수록 조명이 세지고 장면이 깊어진다 */
export function SpiceArt() {
  const col = (x: number, top: string, cone: number, label: string, tone: string, art: ReactNode) => (
    <g transform={`translate(${x} 0)`}>
      <defs>
        <linearGradient id={`sp-${x}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor="#120d1e" /></linearGradient>
        <linearGradient id={`spc-${x}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tone} stopOpacity={cone} /><stop offset="1" stopColor={tone} stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="120" height="196" fill={`url(#sp-${x})`} />
      <path d="M60 22 L18 178 H102Z" fill={`url(#spc-${x})`} />
      {art}
      <rect x="22" y="6" width="76" height="18" rx="9" fill="#120d1e" stroke={tone} strokeOpacity=".7" />
      <text x="60" y="19" textAnchor="middle" fontSize="10" fontWeight="800" fill={tone}>{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 222" className="scene-svg" role="img"
      aria-label="세 칸: 순한 맛은 매점에서 웃는 두 아이, 보통 맛은 단톡방을 보며 굳은 아이, 매운 맛은 졸업식 운동장 끝에서 마주 선 두 아이와 쏟아지는 조명" style={{ fontFamily: FONT }}>
      {col(0, "#2a2446", 0.14, "🥛 순한 맛", "#f3eff8", (
        <>
          <rect x="10" y="132" width="100" height="10" rx="2" fill="#6e5a78" />
          <rect x="14" y="142" width="92" height="36" fill="#43365a" />
          <rect x="48" y="112" width="11" height="20" rx="1.5" fill="#f3eff8" /><rect x="61" y="112" width="11" height="20" rx="1.5" fill="#f3eff8" />
          <text x="60" y="108" textAnchor="middle" fontSize="8" fill={C.sit}>1+1</text>
          <Kid x={30} y={96} s={0.55} face="😄" />
          <Kid x={90} y={96} s={0.55} face="😊" tint="#cbbfe0" />
        </>
      ))}
      {col(120, "#2a1d2e", 0.24, "🌶 보통 맛", C.sit, (
        <>
          <rect x="74" y="34" width="36" height="34" rx="2" fill="#d98aa8" opacity=".35" stroke="#5e4c6a" strokeWidth="2" />
          <Kid x={92} y={112} s={0.5} face="😆" tint="#9aa7c9" dim={0.45} flip />
          <Kid x={40} y={110} s={0.66} face="😶" arms="front" />
          <g transform="translate(46 74)">
            <rect x="0" y="0" width="58" height="26" rx="6" fill="#221a38" stroke={C.inner} />
            <text x="29" y="11" textAnchor="middle" fontSize="7" fill={C.inner}>💬 우리끼리 (5)</text>
            <text x="29" y="21" textAnchor="middle" fontSize="7" fill={C.dim}>나만 없음</text>
          </g>
          <rect x="10" y="168" width="100" height="6" rx="2" fill="#6e5a78" />
        </>
      ))}
      {col(240, "#3a2440", 0.5, "🌶🌶 매운 맛", "#ffb3a0", (
        <>
          <ellipse cx="60" cy="176" rx="58" ry="10" fill={C.sit} opacity=".18" />
          {[[16, 44], [34, 70], [92, 52], [104, 90], [70, 36], [22, 120]].map(([px, py], n) => (
            <ellipse key={n} cx={px} cy={py} rx="2.6" ry="1.6" fill="#ffc7d6" opacity=".85">
              <animate attributeName="cy" values={`${py};${py + 26};${py}`} dur={`${3.2 + n * 0.4}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          <Kid x={92} y={118} s={0.42} face="🙂" tint="#9aa7c9" dim={0.85} flip />
          <Kid x={36} y={124} s={0.7} face="😳" arms="front">
            <rect x="-9" y="18" width="18" height="12" rx="1.5" fill={C.paper} stroke={C.sit} />
          </Kid>
          <g>
            <rect x="46" y="64" width="70" height="22" rx="8" fill="#fff" />
            <path d="M92 86 l2 8 6-8z" fill="#fff" />
            <text x="81" y="79" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#2a2233">그 편지, 읽었어?</text>
          </g>
        </>
      ))}
      <path d="M120 0v196M240 0v196" stroke="#05030b" strokeWidth="2" />
      {/* 맛 막대 */}
      <defs><linearGradient id="sp-bar" x1="0" x2="1"><stop offset="0" stopColor="#f3eff8" /><stop offset=".5" stopColor={C.sit} /><stop offset="1" stopColor="#ff8a8a" /></linearGradient></defs>
      <rect x="0" y="196" width="360" height="26" fill="#0f0b1a" />
      <rect x="20" y="206" width="320" height="6" rx="3" fill="url(#sp-bar)" opacity=".85" />
      <circle cx="60" cy="209" r="7" fill="#f3eff8" stroke="#0f0b1a" strokeWidth="2" />
      <text x="74" y="203" fontSize="8" fill={C.dim}>기본</text>
      <text x="300" y="203" fontSize="8" fill="#ff8a8a" textAnchor="middle">네가 고를 때만</text>
    </svg>
  );
}

/* ══ 진심 — 꾸민 대사엔 객석이 딴청, 진짜 한 마디엔 숨을 죽인다 ══ */
export function TruthArt({ fake, real }: { fake: { name: string; line: string; note: string }; real: { name: string; line: string; note: string } }) {
  const seats = (x0: number, lean: boolean) => Array.from({ length: 4 }, (_, k) => {
    const x = x0 + k * 38;
    return (
      <g key={k}>
        <path d={`M${x - 14} 208 v-16 a14 12 0 0 1 28 0 v16`} fill="#121b2a" stroke="#22324a" />
        <circle cx={x + (lean ? 0 : (k % 2 ? 4 : -4))} cy={lean ? 178 : 184} r="8" fill="#3a2a3e" />
        {lean && k % 2 === 0 && <text x={x + 9} y={168} fontSize="8">💗</text>}
        {!lean && k === 1 && <rect x={x - 4} y={186} width="8" height="11" rx="1.5" fill="#9fd0ff" opacity=".8" />}
      </g>
    );
  });
  const bw = (t: string) => textW(t, 10) + 20;
  return (
    <svg viewBox="0 0 360 214" className="scene-svg" role="img"
      aria-label={`왼쪽 꾸민 얘기 무대에서는 종이 인형이 ${fake.line}라고 말하고 객석은 딴청을 피운다. 오른쪽 진짜 얘기 무대에서는 편지를 쥔 아이가 ${real.line}라고 말하고 객석이 몸을 기울인다`} style={{ fontFamily: FONT }}>
      <defs>
        <linearGradient id="tr-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c1830" /><stop offset="1" stopColor="#0c0918" /></linearGradient>
        <linearGradient id="tr-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2440" /><stop offset="1" stopColor="#120d1e" /></linearGradient>
        <linearGradient id="tr-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".5" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="180" height="214" fill="url(#tr-l)" />
      <rect x="180" width="180" height="214" fill="url(#tr-r)" />
      {/* 왼쪽 — 꾸민 얘기: 종이 인형 · 종이 달 */}
      <path d="M40 0v20" stroke="#5a5075" /><circle cx="40" cy="30" r="10" fill="#d6d0e0" opacity=".5" /><circle cx="44" cy="27" r="9" fill="#1c1830" />
      <path d="M90 168 v-30" stroke="#6e5a78" strokeWidth="3" />
      <g opacity=".55">
        <path d="M66 140 l4 -60 l14 -4 l6 -14 l8 2 l2 14 l14 6 l2 58z" fill="#cbbfe0" stroke="#7b7290" strokeDasharray="3 2" />
        <circle cx="90" cy="70" r="12" fill="#e9e3f2" /><text x="90" y="75" fontSize="13" textAnchor="middle">😎</text>
      </g>
      <g>
        <rect x={90 - bw(fake.line) / 2} y="34" width={bw(fake.line)} height="24" rx="10" fill="#2b2440" stroke="#5a5075" strokeDasharray="3 3" />
        <text x="90" y="50" textAnchor="middle" fontSize="10" fill={C.dim}>✨ {fake.line}</text>
      </g>
      {seats(33, false)}
      <rect x="44" y="4" width="92" height="18" rx="9" fill="#120d1e" stroke="#5a5075" />
      <text x="90" y="17" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.faint}>🎭 {fake.name}</text>
      <text x="90" y="160" textAnchor="middle" fontSize="9" fill={C.faint}>{fake.note}</text>
      {/* 오른쪽 — 진짜 얘기: 편지를 쥔 아이, 숨죽인 객석 */}
      <path d="M270 0 L222 168 H318Z" fill="url(#tr-cone)" />
      <ellipse cx="270" cy="164" rx="46" ry="7" fill={C.sit} opacity=".2" />
      <Kid x={270} y={112} s={0.78} face="🥲" arms="front">
        <rect x="-11" y="18" width="22" height="15" rx="1.5" fill={C.paper} stroke={C.sit} />
        <path d="M-11 18 L0 26 L11 18" stroke="#c9b897" fill="none" />
      </Kid>
      <g>
        <rect x={270 - bw(real.line) / 2} y="34" width={bw(real.line)} height="24" rx="10" fill="#fff" />
        <path d="M262 58 l6 8 4-8z" fill="#fff" />
        <text x="270" y="50" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#2a2233">{real.line}</text>
      </g>
      {seats(213, true)}
      <rect x="224" y="4" width="92" height="18" rx="9" fill="#2a1f0c" stroke={C.sit} />
      <text x="270" y="17" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.sit}>💗 {real.name}</text>
      <text x="270" y="160" textAnchor="middle" fontSize="9" fill={C.sit}>{real.note}</text>
      <path d="M180 0v214" stroke="#05030b" strokeWidth="3" />
    </svg>
  );
}

/* ══ 03 상황극 — 촛불 아래 편지가 교실 DM이 된다 ═══════════ */
export function AdaptArt() {
  return (
    <svg viewBox="0 0 360 200" className="scene-svg" role="img" aria-label="왼쪽은 촛불 아래 깃펜과 옛 편지, 오른쪽은 교실 책상에서 친구가 어깨 너머로 보는 가운데 아이가 DM을 쓰고 있다" style={{ fontFamily: FONT }}>
      <defs>
        <linearGradient id="ad-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1d2e" /><stop offset="1" stopColor="#120d1e" /></linearGradient>
        <linearGradient id="ad-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b2238" /><stop offset="1" stopColor="#120d1e" /></linearGradient>
        <radialGradient id="ad-candle"><stop offset="0" stopColor="#ffcf7a" stopOpacity=".55" /><stop offset="1" stopColor="#ffcf7a" stopOpacity="0" /></radialGradient>
        <linearGradient id="ad-arrow" x1="0" x2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".2" /><stop offset="1" stopColor="#ffcf7a" /></linearGradient>
      </defs>
      <rect width="160" height="200" fill="url(#ad-l)" />
      <rect x="160" width="200" height="200" fill="url(#ad-r)" />
      {/* 옛날 — 책상 · 촛불 · 편지 · 깃펜 */}
      <circle cx="44" cy="74" r="60" fill="url(#ad-candle)" />
      <rect x="0" y="140" width="160" height="60" fill="#3a2a3e" />
      <rect x="36" y="94" width="16" height="46" rx="2" fill="#f1e6cf" />
      <path d="M44 94v-6" stroke="#2a1d2e" strokeWidth="1.5" />
      <path d="M44 70 q-7 10 0 18 q7 -8 0 -18z" fill="#ffb347"><animate attributeName="d" values="M44 70 q-7 10 0 18 q7 -8 0 -18z;M44 72 q-6 9 0 16 q6 -7 0 -16z;M44 70 q-7 10 0 18 q7 -8 0 -18z" dur="1.4s" repeatCount="indefinite" /></path>
      <g transform="translate(70 104) rotate(-8)">
        <rect x="0" y="0" width="70" height="46" rx="2" fill="#f4e4c1" />
        <path d="M8 10h50M8 17h44M8 24h52M8 31h30" stroke="#9b7d4f" strokeWidth="1.2" />
        <circle cx="56" cy="36" r="5" fill="#b07ac9" />
      </g>
      <path d="M128 70 Q110 100 104 124" stroke="#f3eff8" strokeWidth="1.5" fill="none" />
      <path d="M128 70 Q146 74 140 92 Q132 84 120 88 Q122 76 128 70Z" fill="#f3eff8" opacity=".9" />
      <text x="80" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={C.sit}>〈시라노〉 대신 쓰는 편지</text>
      {/* 화살 */}
      <path d="M118 46 C 150 20, 190 20, 214 40" stroke="url(#ad-arrow)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M206 30 L222 46 L200 48Z" fill="#ffcf7a" />
      {/* 교실 — 창문 · 책상 · 두 아이 */}
      <rect x="296" y="30" width="52" height="44" rx="2" fill="#3a5a7a" opacity=".5" stroke="#4a3e60" strokeWidth="2" />
      <path d="M322 30v44" stroke="#4a3e60" strokeWidth="2" />
      <rect x="182" y="146" width="170" height="10" rx="2" fill="#6e5a78" />
      <path d="M192 156v40M342 156v40" stroke="#43365a" strokeWidth="4" />
      <Kid x={312} y={110} s={0.78} face="👀" tint="#cbbfe0" flip />
      <Kid x={248} y={108} s={0.86} face="😳" arms="front" />
      <Phone x={238} y={116} s={0.46}>
        <rect x="6" y="14" width="22" height="7" rx="3.5" fill="#fff" />
        <rect x="12" y="25" width="22" height="7" rx="3.5" fill="#ffcf7a" />
        <text x="20" y="52" fontSize="12" textAnchor="middle">💌</text>
      </Phone>
      <g className="ab-bob">
        <rect x="188" y="66" width="48" height="22" rx="11" fill="#fff" />
        <path d="M222 86 l6 8 2-9z" fill="#fff" />
        <text x="212" y="81" textAnchor="middle" fontSize="10" fill="#2a2233" fontWeight="700">써 줘!</text>
      </g>
      <text x="262" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#ffcf7a">친구 대신 DM 써 주기</text>
      <text x="262" y="188" textAnchor="middle" fontSize="9.5" fill={C.dim}>(근데 나도 그 애가 좋아)</text>
    </svg>
  );
}

/* ══ 03 상황극 — 커튼콜: 내 선택 vs 원작 ═════════════════ */
export function CurtainCallArt() {
  return (
    <svg viewBox="0 0 360 170" className="scene-svg" role="img" aria-label="커튼이 열린 무대 위에 아이와 깃털 모자를 쓴 원작 주인공이 나란히 서서 각자의 선택을 들고 있다" style={{ fontFamily: FONT }}>
      <Sky id="cc-bg" h={170} top="#2a1830" bottom="#0c0718" />
      <defs><linearGradient id="cc-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9b8" stopOpacity=".32" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></linearGradient></defs>
      <path d="M120 0 L80 150 H160Z" fill="url(#cc-cone)" />
      <path d="M240 0 L200 150 H280Z" fill="url(#cc-cone)" />
      <ellipse cx="180" cy="150" rx="130" ry="12" fill="#fff" opacity=".08" />
      <Curtains h={170} />
      <Kid x={120} y={98} s={0.86} face="🙂" arms="up" />
      <Kid x={240} y={98} s={0.86} face="🧐" tint="#b9a6d9">
        <path d="M-15 -19 Q0 -32 15 -19Z" fill="#3b2a5a" />
        <path d="M6 -26 Q22 -46 30 -40 Q18 -34 10 -22" fill={C.sit} />
      </Kid>
      <g>
        <rect x="76" y="20" width="88" height="24" rx="8" fill={C.sit} />
        <text x="120" y="36" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#2a1a06">네 선택</text>
        <rect x="196" y="20" width="88" height="24" rx="8" fill="#e7dcf7" />
        <text x="240" y="36" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#2a2233">원작 주인공</text>
      </g>
      <text x="180" y="98" textAnchor="middle" fontSize="13" fontWeight="900" fill={C.ink} opacity=".7">↔</text>
      <text x="180" y="164" textAnchor="middle" fontSize="9.5" fill={C.dim}>👏 커튼콜 — 정답 맞히기 아니고, 나란히 보기</text>
    </svg>
  );
}

/* ══ 04 내 무대 — 웜업 · 행위 · 나눔 세 칸 ════════════════ */
export function InnerStepsArt() {
  const panel = (x: number, title: string, n: number, art: ReactNode) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="0" width="112" height="170" rx="10" fill="#0d1520" stroke="#223a52" />
      <circle cx="16" cy="16" r="9" fill={C.inner} />
      <text x="16" y="20" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#06111c">{n}</text>
      {art}
      <text x="56" y="160" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.inner}>{title}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 172" className="scene-svg" style={{ border: "none", boxShadow: "none", fontFamily: FONT }} role="img" aria-label="세 칸: 계단을 올라 무대에 서는 웜업, 손을 들어 멈추고 빈 의자와 마주하는 행위, 무대 끝에 앉아 공책에 세 줄을 쓰는 나눔">
      {panel(0, "웜업 · 무대 오르기", 1, (
        <>
          <path d="M12 140 h22 v-14 h22 v-14 h22 v-14 h24 v42z" fill="#1d3247" />
          <Kid x={62} y={78} s={0.62} face="🙂" />
          {/* 나 / 아바타 가면 */}
          <g className="ab-bob"><circle cx="30" cy="48" r="11" fill={C.skin} /><text x="30" y="53" fontSize="12" textAnchor="middle">🙂</text></g>
          <g className="ab-bob" style={{ animationDelay: "-1.5s" }}><path d="M84 38 q10 -4 20 0 q0 16 -10 18 q-10 -2 -10 -18z" fill="#c9a6ff" /><circle cx="90" cy="45" r="2" fill="#1a1428" /><circle cx="98" cy="45" r="2" fill="#1a1428" /></g>
          <text x="30" y="72" fontSize="8.5" textAnchor="middle" fill={C.dim}>나로</text>
          <text x="94" y="72" fontSize="8.5" textAnchor="middle" fill={C.dim}>아바타로</text>
        </>
      ))}
      {panel(124, "행위 · 장면 안으로", 2, (
        <>
          <ellipse cx="56" cy="134" rx="46" ry="7" fill={C.inner} opacity=".18" />
          <Kid x={36} y={92} s={0.66} face="😶" arms="up" />
          {/* 빈 의자 */}
          <path d="M78 104 h22 v-26 M78 104 v22 M100 104 v22 M78 104 v-6" stroke="#c9b27a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="76" y="98" width="26" height="6" rx="2" fill="#c9b27a" />
          <text x="56" y="44" fontSize="18" textAnchor="middle">✋</text>
          <path d="M44 56 q12 -8 24 0" stroke={C.inner} strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <path d="M64 52 l5 4 -6 2" stroke={C.inner} strokeWidth="1.5" fill="none" />
        </>
      ))}
      {panel(248, "나눔 · 내려오기", 3, (
        <>
          <rect x="6" y="112" width="100" height="10" fill="#1d3247" />
          <path d="M6 30 Q14 70 8 112" stroke={C.curtain} strokeWidth="10" fill="none" opacity=".7" />
          <path d="M106 30 Q98 70 104 112" stroke={C.curtain} strokeWidth="10" fill="none" opacity=".7" />
          <Kid x={56} y={78} s={0.66} face="😌" arms="sit" />
          <rect x="46" y="88" width="22" height="15" rx="1.5" fill={C.paper} transform="rotate(-8 57 95)" />
          <path d="M50 93h12M50 97h10M50 101h8" stroke="#9b8a6a" strokeWidth="1" transform="rotate(-8 57 95)" />
          <text x="56" y="140" fontSize="9" textAnchor="middle" fill={C.dim}>내 말 세 줄</text>
        </>
      ))}
    </svg>
  );
}

/* ══ 05 다리 — 두 섬 사이 흔들다리와 돌다리 ═══════════════ */
export function BridgeArt() {
  const planks = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg viewBox="0 0 360 220" className="scene-svg" role="img" aria-label="왼쪽 금빛 무대 섬에서 오른쪽 거울 섬으로 가면을 쓴 아이가 흔들다리를 건너고, 아래 돌다리로는 다른 아이가 책을 들고 돌아온다" style={{ fontFamily: FONT }}>
      <Sky id="br-bg" h={220} top="#1c1638" bottom="#08060f" />
      <Twinkle pts={[[30, 20], [120, 14], [200, 30], [300, 18], [340, 44], [70, 52]]} />
      <path d="M0 220 V196 Q180 176 360 196 V220Z" fill="#0a1424" />
      {/* 왼쪽 섬 — 무대 */}
      <path d="M0 96 H92 L84 130 L60 168 L24 186 L0 190Z" fill="#5a4430" />
      <path d="M0 96 H92 L88 108 H0Z" fill="#f0b95a" />
      <rect x="14" y="58" width="56" height="38" fill="#2a1a0c" />
      <path d="M14 58 h56 v6 q-28 10 -56 0z" fill={C.curtain} />
      <path d="M14 58 q8 18 4 38 h-4z M70 58 q-8 18 -4 38 h4z" fill={C.curtain} />
      <circle cx="42" cy="80" r="7" fill={C.sit} opacity=".7" />
      <text x="42" y="118" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#2a1a06">상황극</text>
      {/* 오른쪽 섬 — 거울 */}
      <path d="M360 96 H268 L276 130 L300 168 L336 186 L360 190Z" fill="#22364f" />
      <path d="M360 96 H268 L272 108 H360Z" fill="#4b6d92" />
      <ellipse cx="318" cy="70" rx="15" ry="21" fill="#132538" stroke="#c9b27a" strokeWidth="2.4" />
      <path d="M312 60c2-4 5-6 9-7" stroke="#dbeaf7" strokeOpacity=".7" strokeWidth="1.5" fill="none" />
      <path d="M318 91v5" stroke="#c9b27a" strokeWidth="3" />
      <text x="318" y="118" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#eef6ff">내 무대</text>
      {/* ① 흔들다리 */}
      <path d="M90 98 Q180 134 270 98" stroke="#a8875a" strokeWidth="2" fill="none" />
      <path d="M90 78 Q180 112 270 78" stroke="#a8875a" strokeWidth="1.5" fill="none" />
      {planks.map((i) => {
        const t = (i + 0.5) / planks.length;
        const x = 90 + 180 * t;
        const y = 98 + 4 * 36 * t * (1 - t) * 1;
        return <rect key={i} x={x - 5} y={y - 1} width="10" height="4" rx="1" fill="#c79d62" />;
      })}
      <Kid x={168} y={86} s={0.58} face="🎭" arms="front" />
      <circle cx="150" cy="54" r="11" fill="#0f0b1a" stroke={C.inner} strokeWidth="2" />
      <text x="150" y="58" textAnchor="middle" fontSize="11.5" fontWeight="900" fill={C.inner}>1</text>
      <path d="M196 70 l12 0 m-4 -4 l4 4 -4 4" stroke={C.inner} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* ②③ 돌다리 — 돌아오는 길 */}
      <path d="M80 158 Q180 128 280 158 L280 166 Q180 140 80 166Z" fill="#5a5370" />
      <path d="M120 166 q60 -28 120 0" stroke="#3a3450" strokeWidth="3" fill="none" />
      <Kid x={206} y={124} s={0.48} face="🙂" tint="#d6c7b0" flip>
        <rect x="-26" y="10" width="14" height="10" rx="1" fill="#e7c58a" />
      </Kid>
      <path d="M170 140 l-12 0 m4 -4 l-4 4 4 4" stroke={C.sit} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="244" cy="128" r="11" fill="#0f0b1a" stroke={C.sit} strokeWidth="2" />
      <text x="244" y="132" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.sit}>2·3</text>
      {/* 이름표 두고 가는 자리 */}
      <g transform="translate(254 96)">
        <path d="M0 0 v-22" stroke="#8a7a5c" strokeWidth="2" />
        <rect x="-26" y="-36" width="44" height="16" rx="3" fill="#2a1f0c" stroke={C.sit} />
        <text x="-4" y="-25" textAnchor="middle" fontSize="8.5" fill={C.sit}>🔒 실명 ✕</text>
      </g>
    </svg>
  );
}

/* ══ 06 모으기 — 여섯 걸음 원형 단계도 ══════════════════ */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const round = (v: number) => Math.round(v * 10) / 10; // 서버·브라우저 소수점 차이로 hydration이 어긋나지 않게
  return { x: round(cx + r * Math.cos(a)), y: round(cy + r * Math.sin(a)) };
}
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  return `M${p0.x} ${p0.y} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
}
/** 걸음마다 작은 그림 — 선화 대신 사물 */
const STEP_ICON: Record<string, string> = { pick: "🎟", play: "🎬", keep: "🗃", join: "🎞", fix: "✏️", look: "🔍" };

export function JourneyRing({ steps }: { steps: { key: string; name: string; time: string }[] }) {
  const cx = 180, cy = 172, R = 116;
  return (
    <svg viewBox="0 0 360 350" className="scene-svg" role="img" aria-label="고르기, 씬 하기, 모이기, 잇기, 고치기, 돌아보기 여섯 걸음이 둥근 무대 위에 이어진 그림" style={{ fontFamily: FONT }}>
      <Sky id="ring-bg" h={350} top="#1a1430" bottom="#0c0718" />
      <defs><radialGradient id="ring-floor"><stop offset="0" stopColor="#2a2142" /><stop offset="1" stopColor="#120d1e" /></radialGradient></defs>
      <circle cx={cx} cy={cy} r={R + 18} fill="url(#ring-floor)" stroke={C.line} />
      <circle cx={cx} cy={cy} r={R - 18} fill="#0f0b1a" stroke={C.line} />
      <path d={arcPath(cx, cy, R, -122, 0)} stroke={C.sit} strokeOpacity=".55" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d={arcPath(cx, cy, R, 4, 236)} stroke={C.work} strokeOpacity=".5" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[-60, 0, 60, 120, 180, 240].map((deg) => {
        const p = polar(cx, cy, R, deg);
        return <path key={deg} d="M-4 -4.5 3 0 -4 4.5" transform={`translate(${p.x} ${p.y}) rotate(${deg + 90})`} stroke={C.ink} strokeOpacity=".7" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      })}
      <Kid x={cx} y={cy - 10} s={0.62} face="🙂" />
      <g fontSize="10.5" fontWeight="700">
        <rect x={cx - 64} y={cy + 34} width="58" height="20" rx="10" fill="#2a1f0c" stroke="#4d3a17" />
        <text x={cx - 35} y={cy + 48} textAnchor="middle" fill={C.sit}>🏠 홈</text>
        <rect x={cx + 4} y={cy + 34} width="62" height="20" rx="10" fill="#261c3d" stroke="#3a2d5a" />
        <text x={cx + 35} y={cy + 48} textAnchor="middle" fill={C.work}>🎬 내 씬</text>
      </g>
      {steps.map((s, i) => {
        const p = polar(cx, cy, R, -90 + i * 60);
        const tone = i < 2 ? C.sit : C.work;
        return (
          <g key={s.key}>
            <circle cx={p.x} cy={p.y} r="27" fill={C.panel2} stroke={tone} strokeWidth="1.8" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="20">{STEP_ICON[s.key] ?? "🎬"}</text>
            <circle cx={p.x - 20} cy={p.y - 20} r="9" fill={tone} />
            <text x={p.x - 20} y={p.y - 16.5} textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#120d06">{i + 1}</text>
            <text x={p.x} y={p.y + 44} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={C.ink} stroke="#0f0b1a" strokeWidth="4" paintOrder="stroke">{s.name}</text>
            <text x={p.x} y={p.y + 58} textAnchor="middle" fontSize="9.5" fill={C.dim} stroke="#0f0b1a" strokeWidth="3" paintOrder="stroke">{s.time}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ══ 06 나만의 이야기 — 씬 다섯 장이 이야기 언덕을 오른다 ══════
   인트로 → 본론 ①② → 갈등 하이라이트(꼭대기) → 결론 · 맺음말 */
export function StoryArcArt() {
  const cards = [
    { x: 46, y: 168, em: "📚", t: C.inner, part: "인트로" },
    { x: 108, y: 142, em: "📇", t: C.sit, part: "본론 ①" },
    { x: 170, y: 112, em: "🚚", t: C.inner, part: "본론 ②" },
    { x: 250, y: 60, em: "🎓", t: C.sit, part: "갈등 하이라이트", peak: true },
    { x: 318, y: 126, em: "✉️", t: C.inner, part: "결론 · 맺음말" },
  ];
  const line = "M10 206 C 34 198, 40 192, 46 190 S 90 168, 108 164 S 152 140, 170 134 S 226 82, 250 86 S 300 136, 318 148 S 342 168, 352 176";
  return (
    <svg viewBox="0 0 360 230" className="scene-svg" role="img"
      aria-label="씬 다섯 장이 언덕 모양 이야기 곡선 위에 놓여 있다: 인트로, 본론 두 장, 꼭대기의 갈등 하이라이트, 결론과 맺음말" style={{ fontFamily: FONT }}>
      <Sky id="arc-bg" h={230} />
      <defs>
        <linearGradient id="arc-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.work} stopOpacity=".28" /><stop offset="1" stopColor={C.work} stopOpacity="0" /></linearGradient>
        <linearGradient id="arc-line" x1="0" x2="1"><stop offset="0" stopColor={C.inner} /><stop offset=".68" stopColor={C.sit} /><stop offset="1" stopColor={C.note} /></linearGradient>
        <radialGradient id="arc-peak"><stop offset="0" stopColor={C.sit} stopOpacity=".5" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></radialGradient>
      </defs>
      <Twinkle pts={[[30, 40], [90, 70], [150, 30], [320, 40], [210, 22], [340, 84]]} />
      <text x="14" y="24" fontSize="11.5" fontWeight="800" fill={C.work}>📖 나만의 이야기 — 「반납함 속 편지」</text>
      {/* 언덕 */}
      <path d={`${line} V230 H10Z`} fill="url(#arc-hill)" />
      <path d={line} stroke="url(#arc-line)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="250" cy="60" r="52" fill="url(#arc-peak)" />
      {/* 이음새 테이프 */}
      {[[77, 176], [139, 150], [210, 104], [284, 112]].map(([x, y], k) => (
        <rect key={k} x={x - 9} y={y - 4} width="18" height="8" rx="1.5" fill={C.marker} opacity=".7" transform={`rotate(${k === 3 ? 30 : -24} ${x} ${y})`} />
      ))}
      {cards.map((c, k) => {
        const w = c.peak ? 56 : 44, h = c.peak ? 44 : 36;
        return (
          <g key={k}>
            <g className={c.peak ? "ab-bob" : undefined}>
              <rect x={c.x - w / 2} y={c.y - h / 2} width={w} height={h} rx="5" fill="#221a38" stroke={c.t} strokeWidth={c.peak ? 2.2 : 1.6} />
              {[0.2, 0.5, 0.8].map((f) => <rect key={f} x={c.x - w / 2 + w * f - 2.5} y={c.y - h / 2 + 2} width="5" height="3.5" rx="1" fill="#0c0915" />)}
              <text x={c.x} y={c.y + (c.peak ? 9 : 7)} textAnchor="middle" fontSize={c.peak ? 20 : 16}>{c.em}</text>
              <text x={c.x + w / 2 - 4} y={c.y + h / 2 - 4} textAnchor="end" fontSize="7.5" fill={C.faint} fontFamily={MONO}>S#{k + 1}</text>
            </g>
            <text x={c.x} y={c.y - h / 2 - 8} textAnchor="middle" fontSize={c.peak ? 11.5 : 10.5} fontWeight="800"
              fill={c.peak ? C.sit : C.ink} stroke="#120d1e" strokeWidth="3" paintOrder="stroke">{c.part}</text>
          </g>
        );
      })}
      {/* 맺음 — 제목 한 줄 */}
      <g transform="translate(300 196)">
        <rect x="-14" y="-14" width="78" height="20" rx="4" fill={C.paper} />
        <text x="25" y="0" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#4a3c58">반납함 속 편지</text>
      </g>
      <text x="14" y="222" fontSize="9.5" fill={C.dim}>🎞 금빛 테두리 = 상황극 씬 · 🪞 푸른 테두리 = 내 장면</text>
    </svg>
  );
}

/* ══ 06 다시 찍기 — 필름 두 줄, 갈라지는 테이크 2 ═══════════ */
export function TakeArt({ reason }: { reason: string }) {
  return (
    <svg viewBox="0 0 360 170" className="scene-svg" role="img" aria-label="테이크 1 필름 줄은 그대로 남고, 위로 테이크 2 필름 줄이 갈라져 나간다. 고친 이유 메모가 붙어 있다" style={{ fontFamily: FONT }}>
      <Sky id="tk-bg" h={170} top="#1e1830" bottom="#0c0718" />
      <defs>
        <pattern id="tk-holes" width="14" height="30" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="7" height="5" rx="1" fill="#0c0915" /><rect x="3" y="22" width="7" height="5" rx="1" fill="#0c0915" /></pattern>
      </defs>
      {/* 테이크 1 — 곧게 */}
      <rect x="0" y="116" width="360" height="30" fill="#3a3350" />
      <rect x="0" y="116" width="360" height="30" fill="url(#tk-holes)" />
      <rect x="30" y="120" width="72" height="22" rx="3" fill="#2b2440" stroke="#5a5075" />
      <text x="66" y="135" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.dim}>Take 1</text>
      <text x="230" y="135" textAnchor="middle" fontSize="10" fill={C.faint}>지우지 않고 그대로 남아</text>
      {/* 테이크 2 — 갈라져 위로 */}
      <path d="M130 116 C 170 116, 170 64, 214 64 H360 V94 H214 C 190 94, 186 128, 150 128Z" fill="#4a3478" opacity=".9" />
      <rect x="226" y="68" width="72" height="22" rx="3" fill="#3b2a62" stroke={C.work} />
      <text x="262" y="83" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.ink}>Take 2</text>
      {/* 고친 이유 메모 */}
      <g transform="translate(170 12) rotate(-3)"><g className="ab-bob">
        <rect x="0" y="0" width="150" height="34" rx="3" fill={C.marker} />
        <rect x="64" y="-6" width="22" height="10" fill="#e8e0a0" opacity=".8" />
        <text x="12" y="22" fontSize="11.5" fontWeight="800" fill="#2a2400">✏️ 왜? {reason}</text>
      </g></g>
      {/* 감독 의자 */}
      <g transform="translate(40 50)">
        <path d="M0 0 h40 M4 0 v-22 M36 0 v-22 M4 -22 h32 M0 0 l40 40 M40 0 l-40 40" stroke="#c9a15c" strokeWidth="3" strokeLinecap="round" />
        <rect x="4" y="-30" width="32" height="12" rx="2" fill="#4e2352" />
      </g>
    </svg>
  );
}

/* ══ 07 돌아보기 — 객석에 앉아 내 씬들을 다시 보는 아이 ═════ */
export function SeenArt() {
  const cards = [
    { q: true }, { q: true }, { q: false }, { q: true }, { q: true },
  ];
  return (
    <svg viewBox="0 0 360 210" className="scene-svg" role="img" aria-label="객석 맨 앞에 앉은 아이가 무대 위에 걸린 자기 씬 다섯 장을 본다. 그중 네 장 끝에 손 모양이 빛난다 — 말보다 몸짓이 먼저였던 마지막 컷" style={{ fontFamily: FONT }}>
      <Sky id="seen-bg" h={210} top="#14202e" bottom="#070a12" />
      <defs><linearGradient id="seen-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.note} stopOpacity=".2" /><stop offset="1" stopColor={C.note} stopOpacity="0" /></linearGradient></defs>
      {/* 무대 */}
      <rect x="20" y="20" width="320" height="104" fill="#101826" />
      <path d="M180 0 L60 124 H300Z" fill="url(#seen-cone)" />
      <Curtains h={128} op={0.6} />
      <rect x="0" y="122" width="360" height="8" fill="#2a2036" />
      {cards.map((c, i) => {
        const x = 72 + i * 54;
        return (
          <g key={i}>
            <path d={`M${x} 28 v10`} stroke="#8a7a5c" />
            <rect x={x - 18} y="38" width="36" height="46" rx="3" fill={C.paper} />
            <path d={`M${x - 12} 48h24M${x - 12} 54h18M${x - 12} 60h22`} stroke="#9b8a6a" strokeWidth="1.2" />
            <text x={x} y="80" textAnchor="middle" fontSize={c.q ? 12 : 10} fill={c.q ? "#2e9b72" : "#b0a48a"}>{c.q ? "✋" : "「」"}</text>
            {c.q && <circle cx={x} cy="74" r="10" fill={C.note} opacity=".25"><animate attributeName="opacity" values=".1;.4;.1" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" /></circle>}
          </g>
        );
      })}
      <text x="180" y="106" textAnchor="middle" fontSize="10.5" fill={C.note} fontWeight="700">마지막 컷 다섯 장</text>
      {/* 객석 — 뒷모습 */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${14 + i * 50} 210 v-26 a20 18 0 0 1 40 0 v26`} fill="#121b2a" stroke="#22324a" />
      ))}
      <circle cx="188" cy="160" r="15" fill="#3a2a22" />
      <path d="M168 196 q20 -24 40 0" fill={C.body} />
      <g transform="translate(212 150) rotate(20)">
        <circle cx="0" cy="0" r="8" fill="none" stroke={C.note} strokeWidth="2.4" />
        <path d="M6 6 l8 8" stroke={C.note} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ══ 08 하은이의 2주 — 굽은 길 위 네 정거장 ═══════════════ */
export function StoryRoadArt() {
  const stops = [
    { x: 54, y: 176, c: C.sit, day: "1–3", art: <Phone x={-10} y={-48} s={0.28}><text x="20" y="44" fontSize="22" textAnchor="middle">💌</text></Phone> },
    { x: 140, y: 120, c: C.work, day: "4–6", art: <><path d="M-10 -24 h18 v-20 M-10 -24 v10 M8 -24 v10" stroke="#c9b27a" strokeWidth="3" fill="none" strokeLinecap="round" /><rect x="-12" y="-28" width="22" height="5" fill="#c9b27a" /></> },
    { x: 226, y: 150, c: "#a99be8", day: "7–12", art: <><rect x="-22" y="-44" width="20" height="24" rx="2" fill={C.paper} /><rect x="2" y="-44" width="20" height="24" rx="2" fill={C.paper} /><rect x="-6" y="-36" width="12" height="8" fill={C.marker} opacity=".8" /></> },
    { x: 310, y: 80, c: C.note, day: "14", art: <><circle cx="0" cy="-34" r="9" fill="none" stroke={C.note} strokeWidth="2.6" /><path d="M6 -28 l7 7" stroke={C.note} strokeWidth="3" strokeLinecap="round" /></> },
  ];
  return (
    <svg viewBox="0 0 360 220" className="scene-svg" role="img" aria-label="왼쪽 아래에서 오른쪽 위로 굽은 길에 정거장 네 개: DM 폰, 빈 의자, 이어 붙인 종이, 돋보기" style={{ fontFamily: FONT }}>
      <Sky id="road-bg" h={220} top="#1c1638" bottom="#0a0712" />
      <Twinkle pts={[[30, 30], [110, 22], [190, 40], [250, 20], [340, 30]]} />
      <defs><linearGradient id="road-g" x1="0" x2="1"><stop offset="0" stopColor={C.sit} /><stop offset=".45" stopColor={C.work} /><stop offset="1" stopColor={C.note} /></linearGradient></defs>
      <path d="M10 210 C 60 180, 90 110, 140 120 S 200 170, 226 150 S 290 70, 350 64" stroke="url(#road-g)" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".35" />
      <path d="M10 210 C 60 180, 90 110, 140 120 S 200 170, 226 150 S 290 70, 350 64" stroke="#f3eff8" strokeWidth="1.4" strokeDasharray="5 7" fill="none" opacity=".5" />
      {stops.map((s) => (
        <g key={s.day} transform={`translate(${s.x} ${s.y})`}>
          <g className="ab-bob">{s.art}</g>
          <circle cx="0" cy="0" r="7" fill="#0f0b1a" stroke={s.c} strokeWidth="3" />
          <text x="0" y="22" textAnchor="middle" fontSize="10" fontWeight="800" fill={s.c} fontFamily={MONO}>Day {s.day}</text>
        </g>
      ))}
      <Kid x={84} y={150} s={0.5} face="😀" />
    </svg>
  );
}

/* ══ 09 약속 — 감독 의자의 진행자, 말풍선 둘 ══════════════ */
export function PromiseArt() {
  return (
    <svg viewBox="0 0 360 180" className="scene-svg" role="img" aria-label="감독 의자에 앉은 진행자가 무대 위 아이에게 카드 두 장을 내밀며 '골라도 되고 안 골라도 돼'라고 하고, '왜 그랬어?'라는 말풍선에는 엑스 표시가 있다" style={{ fontFamily: FONT }}>
      <Sky id="pr-bg" h={180} />
      <defs><linearGradient id="pr-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9b8" stopOpacity=".3" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></linearGradient></defs>
      <path d="M250 0 L200 170 H300Z" fill="url(#pr-cone)" />
      <ellipse cx="250" cy="166" rx="60" ry="8" fill="#fff" opacity=".08" />
      {/* 감독 의자 + 진행자 */}
      <g transform="translate(72 112)">
        <path d="M-22 0 h44 M-18 0 v-26 M18 0 v-26 M-18 -26 h36 M-22 0 l44 50 M22 0 l-44 50" stroke="#c9a15c" strokeWidth="3.4" strokeLinecap="round" />
        <rect x="-18" y="-36" width="36" height="12" rx="2" fill="#4e2352" />
        <text x="0" y="-27" textAnchor="middle" fontSize="7.5" fill={C.sit}>DIRECTOR</text>
      </g>
      <Kid x={72} y={86} s={0.66} face="🧑‍🎨" tint="#9aa7c9" arms="front" />
      <Kid x={250} y={112} s={0.8} face="🙂" />
      {/* 카드 두 장 */}
      <g className="ab-bob"><rect x="200" y="58" width="24" height="32" rx="3" fill={C.paper} stroke={C.sit} /><text x="212" y="79" textAnchor="middle" fontSize="12">✋</text></g>
      <g className="ab-bob" style={{ animationDelay: "-1.6s" }}><rect x="278" y="58" width="24" height="32" rx="3" fill={C.paper} stroke={C.inner} /><text x="290" y="79" textAnchor="middle" fontSize="12">🔄</text></g>
      {/* 말풍선 */}
      <rect x="96" y="12" width="128" height="26" rx="13" fill="#0e1c18" stroke="#2f7a5c" />
      <text x="160" y="29" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={C.note}>✓ 이런 방법도 있어</text>
      <rect x="12" y="12" width="76" height="26" rx="13" fill="#1f0f12" stroke="#4a2020" />
      <text x="50" y="29" textAnchor="middle" fontSize="10" fill="#ff9a9a" textDecoration="line-through">왜 그랬어?</text>
      <path d="M22 18 l56 14" stroke="#ff8a8a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ══ 09 기록 — 이 폰 안의 자물쇠 서랍 ═══════════════════ */
export function PrivacyArt() {
  return (
    <svg viewBox="0 0 360 150" className="scene-svg" role="img" aria-label="폰 안에 자물쇠 달린 서랍이 있고, 바깥 구름 서버로 가는 길은 막혀 있다. 옆에는 JSON 파일 한 장" style={{ fontFamily: FONT }}>
      <Sky id="pv-bg" h={150} top="#16122a" bottom="#0a0712" />
      <Phone x={130} y={18} s={1.5}>
        <rect x="8" y="22" width="24" height="18" rx="2" fill="#6e5a78" />
        <rect x="8" y="42" width="24" height="18" rx="2" fill="#6e5a78" />
        <rect x="17" y="29" width="6" height="2.4" rx="1" fill="#e7c58a" />
        <rect x="17" y="49" width="6" height="2.4" rx="1" fill="#e7c58a" />
        <rect x="14" y="10" width="12" height="9" rx="1.5" fill={C.sit} />
        <path d="M16 10 v-3 a4 4 0 0 1 8 0 v3" stroke={C.sit} strokeWidth="1.6" fill="none" />
      </Phone>
      {/* 막힌 구름 */}
      <g transform="translate(290 44)" opacity=".6">
        <path d="M-24 10 a12 12 0 0 1 4 -22 a16 16 0 0 1 30 -2 a11 11 0 0 1 10 22z" fill="#2b2440" stroke="#5a5075" />
        <text x="0" y="4" textAnchor="middle" fontSize="9" fill={C.faint}>서버</text>
      </g>
      <path d="M200 70 H262" stroke={C.faint} strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="232" cy="70" r="10" fill="#1f0f12" stroke="#ff8a8a" strokeWidth="2" />
      <path d="M227 65 l10 10 M237 65 l-10 10" stroke="#ff8a8a" strokeWidth="2" strokeLinecap="round" />
      {/* JSON 파일 */}
      <g transform="translate(40 40)"><g className="ab-bob">
        <path d="M0 0 h34 l12 12 v46 h-46z" fill={C.paper} />
        <path d="M34 0 v12 h12" fill="#e2d5b8" />
        <text x="22" y="40" textAnchor="middle" fontSize="10" fontWeight="800" fill="#4a3c2c" fontFamily={MONO}>{"{ }"}</text>
        <text x="22" y="74" textAnchor="middle" fontSize="9" fill={C.dim}>내보내기</text>
      </g></g>
      <path d="M90 70 H124" stroke={C.note} strokeWidth="1.6" markerEnd="none" strokeDasharray="3 3" />
    </svg>
  );
}

/* ══ 09 안전 — 무대가 멈추고 구명튜브가 내려온다 ════════════ */
export function SafetyArt() {
  return (
    <svg viewBox="0 0 360 160" className="scene-svg" role="img" aria-label="무대 조명이 꺼지고 일시정지 표시가 뜬 무대 위로 구명튜브가 내려오고, 옆에서 전화기가 울린다" style={{ fontFamily: FONT }}>
      <Sky id="sf-bg" h={160} top="#1a1424" bottom="#0a0712" />
      <Curtains h={160} op={0.9} />
      <rect x="150" y="40" width="10" height="34" rx="2" fill={C.ink} opacity=".75" />
      <rect x="168" y="40" width="10" height="34" rx="2" fill={C.ink} opacity=".75" />
      <Kid x={120} y={104} s={0.7} face="😢" dim={0.85} />
      <g className="ab-bob">
        <path d="M232 0 v40" stroke="#c9b27a" strokeWidth="1.5" />
        <circle cx="232" cy="66" r="24" fill="none" stroke="#ff8a8a" strokeWidth="11" />
        <circle cx="232" cy="66" r="24" fill="none" stroke="#fff" strokeWidth="11" strokeDasharray="12 25.7" />
      </g>
      <g transform="translate(272 106)">
        <rect x="0" y="0" width="34" height="28" rx="6" fill={C.note} />
        <text x="17" y="20" textAnchor="middle" fontSize="15">📞</text>
        <path d="M40 4 q6 10 0 20 M46 0 q9 14 0 28" stroke={C.note} strokeWidth="1.6" fill="none" />
      </g>
      <text x="164" y="150" textAnchor="middle" fontSize="10" fill={C.dim}>씬은 잠깐 멈추고, 사람한테 가는 길부터</text>
    </svg>
  );
}
