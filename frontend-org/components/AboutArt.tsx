"use client";

/**
 * /about 전용 삽화.
 * 무대 커튼 · 스포트라이트 · 골드 — StageScene, Logo와 같은 톤으로 맞췄다.
 */

const CURTAIN = "#6d1a35";
const CURTAIN_D = "#4a1026";
const SKIN = "#fdf3e6";
const BODY = "#e8d9c5";
const GOLD = "#e3c07a";
const ACCENT = "#a77de0";
const DIM = "#b6a9c9";
const BLUE = "#7fc0d0";

/** 무대에 서는 작은 사람 — StageScene의 Figure를 /about 크기로 줄인 것 */
function Kid({
  x, y, s = 1, face, tint = BODY, label, dim = 1,
}: {
  x: number; y: number; s?: number; face: string;
  tint?: string; label?: string; dim?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={dim}>
      <ellipse cx="0" cy="45" rx="19" ry="5" fill="#000" opacity="0.3" />
      <path d="M-15 45 L-11 8 Q0 1 11 8 L15 45 Z" fill={tint} />
      <path d="M-12 13 L-21 33" stroke={tint} strokeWidth="5" strokeLinecap="round" />
      <path d="M12 13 L21 33" stroke={tint} strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="-9" r="14" fill={SKIN} />
      <text x="0" y="-3" fontSize="17" textAnchor="middle">{face}</text>
      {label && (
        <text x="0" y="62" fontSize="9.5" textAnchor="middle" fill={DIM} letterSpacing="0.6">
          {label}
        </text>
      )}
    </g>
  );
}

function Curtains({ h, w = 360 }: { h: number; w?: number }) {
  return (
    <>
      <path d={`M0 0 H58 Q38 ${h / 2} 54 ${h} H0 Z`} fill={CURTAIN} opacity="0.75" />
      <path d={`M${w} 0 H${w - 58} Q${w - 38} ${h / 2} ${w - 54} ${h} H${w} Z`} fill={CURTAIN} opacity="0.75" />
      <path d={`M0 0 H24 Q12 ${h / 2} 20 ${h} H0 Z`} fill={CURTAIN_D} opacity="0.7" />
      <path d={`M${w} 0 H${w - 24} Q${w - 12} ${h / 2} ${w - 20} ${h} H${w} Z`} fill={CURTAIN_D} opacity="0.7" />
    </>
  );
}

const STARS: [number, number][] = [
  [42, 30], [96, 52], [150, 24], [214, 44], [278, 28], [318, 60],
];

/* ══ 히어로 — 커튼 열린 무대 ══════════════════════════ */
export function HeroArt() {
  return (
    <svg viewBox="0 0 360 190" className="scene-svg" role="img" aria-label="커튼이 열린 무대에 캐릭터가 서 있고 카드 한 장이 떠 있다">
      <defs>
        <linearGradient id="abHeroBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241a44" />
          <stop offset="100%" stopColor="#0c0718" />
        </linearGradient>
        <linearGradient id="abHeroCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="abHeroSpot" cx="50%" cy="82%" r="55%">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="190" fill="url(#abHeroBg)" />
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.5 : 2.2} fill="#fff" opacity="0.6">
          <animate attributeName="opacity" values="0.2;0.85;0.2" dur={`${2.6 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      <path d="M180 8 L264 172 H96 Z" fill="url(#abHeroCone)" />
      <rect width="360" height="190" fill="url(#abHeroSpot)" />
      <ellipse cx="180" cy="166" rx="104" ry="15" fill="#fff" opacity="0.1" />
      <Curtains h={190} />

      <Kid x={180} y={118} face="🙂" />

      {/* 떠 있는 카드 */}
      <g transform="translate(286 70)">
        <g className="ab-bob">
          <rect x="-19" y="-26" width="38" height="52" rx="6" fill="#fdf6ea" stroke={GOLD} strokeWidth="1.6" />
          <text x="0" y="2" fontSize="18" textAnchor="middle">🌙</text>
          <text x="0" y="18" fontSize="7" textAnchor="middle" fill="#6b5636">달</text>
        </g>
      </g>
      <g transform="translate(74 82)">
        <g className="ab-bob" style={{ animationDelay: "-1.4s" }}>
          <rect x="-16" y="-22" width="32" height="44" rx="6" fill="#241b38" stroke={GOLD} strokeWidth="1.4" opacity="0.85" />
          <text x="0" y="6" fontSize="15" textAnchor="middle" fill={GOLD}>✦</text>
        </g>
      </g>
    </svg>
  );
}

/* ══ 01 질문 — 말이 엉켜 있는 상태 ════════════════════ */
export function StuckArt() {
  return (
    <svg viewBox="0 0 360 180" className="scene-svg" role="img" aria-label="말이 엉켜서 나오지 않고, 톡에 썼다가 지우는 장면">
      <defs>
        <linearGradient id="abStuckBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1536" />
          <stop offset="100%" stopColor="#0b0718" />
        </linearGradient>
      </defs>
      <rect width="360" height="180" fill="url(#abStuckBg)" />

      {/* 엉킨 실뭉치 — 하고 싶은 말 */}
      <g transform="translate(96 54)">
        <path
          className="ab-flow"
          d="M-30 6 c10 -22 34 -22 40 -4 c6 18 -26 20 -30 4 c-5 -20 30 -28 44 -10 c12 16 -12 30 -26 22 c-16 -9 4 -32 22 -22"
          fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" opacity="0.9"
        />
        <text x="46" y="4" fontSize="10" fill={DIM}>하고 싶은 말</text>
      </g>

      {/* 입이 안 떨어지는 사람 */}
      <Kid x={86} y={116} s={0.86} face="😶" />

      {/* 톡 — 썼다 지웠다 */}
      <g transform="translate(224 34)">
        <rect x="0" y="0" width="112" height="118" rx="14" fill="#17102a" stroke="#3a2c58" strokeWidth="1.6" />
        <rect x="42" y="7" width="28" height="3" rx="1.5" fill="#3a2c58" />
        <rect x="10" y="24" width="62" height="17" rx="8" fill="#241a3e" />
        <rect x="10" y="46" width="44" height="17" rx="8" fill="#241a3e" />
        {/* 썼다가 지우는 중인 말풍선 */}
        <g opacity="0.85">
          <rect x="30" y="70" width="72" height="19" rx="9" fill="none" stroke={ACCENT} strokeWidth="1.4" strokeDasharray="4 4" />
          <text x="66" y="83" fontSize="9.5" textAnchor="middle" fill={ACCENT}>있잖아 나…</text>
        </g>
        <g transform="translate(88 100)">
          <rect x="-16" y="-9" width="32" height="18" rx="6" fill="#2b1a2c" stroke="#4d2f4c" />
          <text x="0" y="4" fontSize="10" textAnchor="middle" fill="#f0cfe4">⌫</text>
          <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
        </g>
        <text x="10" y="112" fontSize="9" fill={DIM}>썼다 지웠다 5분째</text>
      </g>
    </svg>
  );
}

/* ══ 02 무대 — 작가 · 배우 · 연출 ═════════════════════ */
export function StageArt() {
  return (
    <svg viewBox="0 0 360 190" className="scene-svg" role="img" aria-label="작가인 나, 무대에 선 캐릭터, 연출을 맡은 AI">
      <defs>
        <linearGradient id="abStageBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#221944" />
          <stop offset="100%" stopColor="#0b0718" />
        </linearGradient>
        <radialGradient id="abStageSpot" cx="50%" cy="76%" r="42%">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="190" fill="url(#abStageBg)" />
      <path d="M180 6 L246 164 H114 Z" fill="#ffe9b8" opacity="0.08" />
      <rect width="360" height="190" fill="url(#abStageSpot)" />
      <ellipse cx="180" cy="158" rx="62" ry="11" fill="#fff" opacity="0.14" />
      <Curtains h={190} />

      {/* 가운데 — 무대에 선 캐릭터 */}
      <Kid x={180} y={112} face="🎭" label="캐릭터 · 배우" />

      {/* 왼쪽 — 작가인 나 (무대 밖, 어둡게) */}
      <g transform="translate(72 118) scale(0.72)" opacity="0.62">
        <ellipse cx="0" cy="45" rx="19" ry="5" fill="#000" opacity="0.3" />
        <path d="M-15 45 L-11 8 Q0 1 11 8 L15 45 Z" fill="#9b8fb5" />
        <path d="M12 13 L26 26" stroke="#9b8fb5" strokeWidth="5" strokeLinecap="round" />
        <circle cx="0" cy="-9" r="14" fill={SKIN} />
        <text x="0" y="-3" fontSize="17" textAnchor="middle">🙂</text>
        <text x="30" y="24" fontSize="16">✍️</text>
      </g>
      <text x="72" y="166" fontSize="9.5" textAnchor="middle" fill={DIM} letterSpacing="0.6">너 · 작가</text>

      {/* 오른쪽 — 연출 */}
      <g transform="translate(290 118) scale(0.72)" opacity="0.62">
        <ellipse cx="0" cy="45" rx="19" ry="5" fill="#000" opacity="0.3" />
        <path d="M-15 45 L-11 8 Q0 1 11 8 L15 45 Z" fill="#8f9fc0" />
        <path d="M-12 13 L-26 26" stroke="#8f9fc0" strokeWidth="5" strokeLinecap="round" />
        <circle cx="0" cy="-9" r="14" fill={SKIN} />
        <text x="0" y="-3" fontSize="17" textAnchor="middle">😊</text>
        <text x="-44" y="24" fontSize="16">🎬</text>
      </g>
      <text x="290" y="166" fontSize="9.5" textAnchor="middle" fill={DIM} letterSpacing="0.6">AI · 연출</text>
    </svg>
  );
}

/* ══ 03 흐름 — 여덟 컷 필름 ═══════════════════════════ */
const FRAMES: { em: string; ritual?: boolean }[] = [
  { em: "🙋" }, { em: "🎭" }, { em: "🃏", ritual: true }, { em: "📖" }, { em: "💭" },
  { em: "🤝" }, { em: "🪞", ritual: true }, { em: "⏪", ritual: true }, { em: "👏", ritual: true },
];

export function ActsArt() {
  return (
    <svg viewBox="0 0 360 96" className="scene-svg" role="img" aria-label="여덟 개의 막이 필름처럼 이어진 그림">
      <rect width="360" height="96" fill="#140e28" />
      <rect x="0" y="14" width="360" height="68" fill="#1c1434" />
      {Array.from({ length: 15 }).map((_, i) => (
        <g key={i}>
          <rect x={7 + i * 24} y="19" width="9" height="6" rx="1.5" fill="#0d0919" />
          <rect x={7 + i * 24} y="71" width="9" height="6" rx="1.5" fill="#0d0919" />
        </g>
      ))}
      {FRAMES.map((f, i) => (
        <g key={i} transform={`translate(${8 + i * 39} 32)`}>
          <rect
            width="33" height="32" rx="6"
            fill={f.ritual ? "#241b10" : "#241a3e"}
            stroke={f.ritual ? GOLD : "#3f2f60"} strokeWidth="1.4"
          />
          <text x="16.5" y="22" fontSize="15" textAnchor="middle">{f.em}</text>
        </g>
      ))}
      <path className="ab-flow" d="M14 88 H346" stroke={ACCENT} strokeWidth="1.6" opacity="0.7" fill="none" />
    </svg>
  );
}

/* ══ 04 조종간 — 질문이 네 갈래로 ═════════════════════ */
const BRANCHES: { em: string; t: string; y: number }[] = [
  { em: "🎬", t: "장면으로", y: 26 },
  { em: "💭", t: "마음으로", y: 68 },
  { em: "🌀", t: "딴 데로", y: 110 },
  { em: "🫧", t: "지금은 패스", y: 152 },
];

export function BranchArt() {
  return (
    <svg viewBox="0 0 360 180" className="scene-svg" role="img" aria-label="질문 하나가 네 갈래 방향으로 갈라진다">
      <rect width="360" height="180" fill="#150f2c" />
      {BRANCHES.map((b) => (
        <path
          key={b.t} className="ab-flow"
          d={`M88 90 C150 90 150 ${b.y} 196 ${b.y}`}
          fill="none" stroke={ACCENT} strokeWidth="1.8" opacity="0.65"
        />
      ))}

      {/* 질문 */}
      <g transform="translate(46 90)">
        <circle r="26" fill="#241a3e" stroke={ACCENT} strokeWidth="1.8" />
        <text x="0" y="8" fontSize="22" textAnchor="middle" fill={ACCENT}>?</text>
      </g>

      {BRANCHES.map((b) => (
        <g key={b.t} transform={`translate(196 ${b.y})`}>
          <rect x="0" y="-15" width="126" height="30" rx="15" fill="#1d1533" stroke="#3f2f60" strokeWidth="1.3" />
          <text x="20" y="5" fontSize="14" textAnchor="middle">{b.em}</text>
          <text x="38" y="4" fontSize="11" fill="#d6c8ec">{b.t}</text>
        </g>
      ))}
    </svg>
  );
}

/* ══ 05 약속 — 새끼손가락 걸기 ════════════════════════ */
export function PromiseArt() {
  return (
    <svg viewBox="0 0 360 130" className="scene-svg" role="img" aria-label="새끼손가락을 건 두 손">
      <rect width="360" height="130" fill="#150f2c" />

      {/* 소매 */}
      <rect x="44" y="52" width="76" height="36" rx="13" fill="#3a2c5c" />
      <rect x="240" y="52" width="76" height="36" rx="13" fill="#2f3a5c" />
      <rect x="104" y="50" width="12" height="40" rx="5" fill="#4a3a72" />
      <rect x="244" y="50" width="12" height="40" rx="5" fill="#3c4a72" />

      {/* 주먹 */}
      <g>
        <rect x="108" y="48" width="46" height="44" rx="17" fill={BODY} />
        <rect x="112" y="42" width="20" height="14" rx="7" fill={BODY} />
        {[62, 72, 82].map((y) => (
          <path key={y} d={`M136 ${y} h13`} stroke="#c9b295" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        ))}
      </g>
      <g>
        <rect x="206" y="48" width="46" height="44" rx="17" fill="#cdbcda" />
        <rect x="228" y="42" width="20" height="14" rx="7" fill="#cdbcda" />
        {[62, 72, 82].map((y) => (
          <path key={y} d={`M211 ${y} h13`} stroke="#a794b8" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        ))}
      </g>

      {/* 걸린 새끼손가락 — 고리 두 개가 맞물린다 */}
      <circle cx="166" cy="70" r="16" fill="none" stroke={GOLD} strokeWidth="7" strokeLinecap="round" />
      <circle cx="194" cy="70" r="16" fill="none" stroke={ACCENT} strokeWidth="7" strokeLinecap="round" />
      <path d="M182 70 A16 16 0 0 1 166 86" fill="none" stroke={GOLD} strokeWidth="7" strokeLinecap="round" />

      {[
        [146, 28], [216, 32], [180, 116],
      ].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize="13" textAnchor="middle" opacity="0.85">
          ✨
          <animate attributeName="opacity" values="0.25;0.9;0.25" dur={`${2.2 + i * 0.6}s`} repeatCount="indefinite" />
        </text>
      ))}
    </svg>
  );
}

/* ══ 06 안전 — 무대가 먼저 멈춘다 ═════════════════════ */
export function SafetyArt() {
  return (
    <svg viewBox="0 0 360 160" className="scene-svg" role="img" aria-label="커튼이 닫히고 무대가 멈춘 장면">
      <defs>
        <radialGradient id="abSafeGlow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="160" fill="#100c22" />
      <rect width="360" height="160" fill="url(#abSafeGlow)" />

      {/* 거의 닫힌 커튼 */}
      <path d="M0 0 H150 Q128 80 146 160 H0 Z" fill={CURTAIN} opacity="0.85" />
      <path d="M360 0 H210 Q232 80 214 160 H360 Z" fill={CURTAIN} opacity="0.85" />
      <path d="M0 0 H40 Q22 80 34 160 H0 Z" fill={CURTAIN_D} opacity="0.75" />
      <path d="M360 0 H320 Q338 80 326 160 H360 Z" fill={CURTAIN_D} opacity="0.75" />

      {/* 멈춤 */}
      <g transform="translate(180 66)">
        <circle r="28" fill="#132126" stroke="#2d4a52" strokeWidth="2" />
        <rect x="-9" y="-11" width="6.5" height="22" rx="3" fill={BLUE} />
        <rect x="2.5" y="-11" width="6.5" height="22" rx="3" fill={BLUE} />
      </g>
      <text x="180" y="112" fontSize="10.5" textAnchor="middle" fill={BLUE} letterSpacing="0.6">
        여기서 무대 멈춤
      </text>

      {/* 연결되는 전화 */}
      <g transform="translate(180 134)">
        <rect x="-52" y="-13" width="104" height="26" rx="13" fill="#1b2a30" stroke="#2d4a52" strokeWidth="1.4" />
        <text x="-30" y="5" fontSize="13" textAnchor="middle">☎️</text>
        <text x="8" y="4" fontSize="11" textAnchor="middle" fill="#cfe7ee">109 · 1388</text>
      </g>
    </svg>
  );
}

/* ══ 07 기록 — 이 기기 밖으로 안 나간다 ═══════════════ */
export function PrivacyArt() {
  return (
    <svg viewBox="0 0 360 160" className="scene-svg" role="img" aria-label="기록은 이 기기 안에만 남고 서버로 올라가지 않는다">
      <rect width="360" height="160" fill="#150f2c" />

      {/* 서버 — 올라가지 않는 쪽 */}
      <g transform="translate(272 42)" opacity="0.5">
        <rect x="-38" y="-26" width="76" height="52" rx="10" fill="#1b1533" stroke="#3a2c58" strokeWidth="1.4" />
        <rect x="-24" y="-14" width="48" height="8" rx="4" fill="#2e2247" />
        <rect x="-24" y="0" width="48" height="8" rx="4" fill="#2e2247" />
        <text x="0" y="22" fontSize="9" textAnchor="middle" fill={DIM}>서버</text>
      </g>
      {/* 끊긴 업로드 경로 */}
      <path d="M150 74 C196 74 214 56 232 46" fill="none" stroke="#4a3a6e" strokeWidth="1.8" strokeDasharray="5 5" />
      <g transform="translate(206 60)">
        <circle r="13" fill="#2a1620" stroke="#7a3550" strokeWidth="1.6" />
        <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#e59ab0" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <text x="246" y="92" fontSize="9.5" textAnchor="middle" fill={DIM}>업로드 안 함</text>

      {/* 내 폰 */}
      <g transform="translate(86 80)">
        <rect x="-44" y="-58" width="88" height="116" rx="16" fill="#17102a" stroke={ACCENT} strokeWidth="1.8" />
        <rect x="-13" y="-51" width="26" height="3" rx="1.5" fill="#3a2c58" />
        <rect x="-32" y="-38" width="46" height="13" rx="6.5" fill="#241a3e" />
        <rect x="-8" y="-20" width="40" height="13" rx="6.5" fill="#3a2a5e" />
        <rect x="-32" y="-2" width="52" height="13" rx="6.5" fill="#241a3e" />
        <g transform="translate(0 32)">
          <rect x="-11" y="-2" width="22" height="17" rx="4" fill={GOLD} />
          <path d="M-6 -2 v-6 a6 6 0 0 1 12 0 v6" fill="none" stroke={GOLD} strokeWidth="2.4" />
          <circle cx="0" cy="7" r="2.4" fill="#241b10" />
        </g>
      </g>
      <text x="86" y="152" fontSize="9.5" textAnchor="middle" fill={DIM} letterSpacing="0.6">
        이 기기 안에만
      </text>
    </svg>
  );
}
