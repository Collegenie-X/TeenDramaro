/**
 * 🎞 상황극 삽화 — 상황 카드마다 한 컷짜리 무대 그림.
 * 내 무대 삽화(InnerArt)와 같은 톤: 종이색 얼굴 · 낮은 채도 배경 · 무대 조명(--sit) 포인트.
 *
 *   SitArt   상황극 한 장 — archetype id로 장면을 고르고, 없으면(🪞 내 장면) 장르 대표 장면
 *            (📺 🎬 📚 유명한 원작 장면 8편 포함)
 *
 * 장면마다: 하늘(시간) · 장소 배경 · 두 사람의 자세 · 상황을 말해 주는 물건 하나.
 */
import { useId, type ReactNode } from "react";
import type { Archetype } from "@/lib/types";

const C = {
  sit: "#ffcf7a", sitD: "#3a2a10", ink: "#f3eff8", dim: "#b4abc6", line: "#2d2542",
  skin: "#fdf3e6", paper: "#fbf3e0", gold: "#c9b27a", warm: "#ffe9b8", wood: "#6a4a30",
  blue: "#8fbbe0", red: "#ff8a8a", mint: "#9fe0c0", violet: "#c9a6ff",
};
const FONT = '-apple-system, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';
const W = 320, H = 100, G = 90; // 바닥선

/* ══ 사람 ════════════════════════════════════════════ */
type Mood = "calm" | "tense" | "talk" | "soft" | "sleep";
type Arms = "down" | "front" | "up" | "reach" | "cross" | "phone";

function Kid({
  x, y = G, s = 1, shirt = "#e8d9c5", hair = "#3a2c48", mood = "calm", arms = "down", flip, dim = 1, elder, children,
}: {
  x: number; y?: number; s?: number; shirt?: string; hair?: string; mood?: Mood; arms?: Arms; flip?: boolean;
  dim?: number; elder?: boolean; children?: ReactNode;
}) {
  const arm = (d: string, key: string) => <path key={key} d={d} stroke={shirt} strokeWidth="3.6" strokeLinecap="round" fill="none" />;
  const armSet: Record<Arms, ReactNode> = {
    down: [arm("M-7 -21 L-11 -6", "l"), arm("M7 -21 L11 -6", "r")],
    front: [arm("M-7 -21 L-3 -12", "l"), arm("M7 -21 L4 -12", "r")],
    up: [arm("M-7 -21 L-11 -6", "l"), arm("M7 -22 L13 -38", "r")],
    reach: [arm("M-7 -21 L-11 -6", "l"), arm("M7 -21 L19 -19", "r")],
    cross: [arm("M-7 -20 L5 -16", "l"), arm("M7 -20 L-5 -14", "r")],
    phone: [arm("M-7 -21 L-11 -6", "l"), arm("M7 -21 L5 -27", "r")],
  };
  const eyes = mood === "tense" ? <path d="M-4.5 -35h2.6M1.9 -35h2.6" stroke="#2a2233" strokeWidth="1.3" strokeLinecap="round" />
    : mood === "sleep" ? <path d="M-4.5 -35q1.3 1.2 2.6 0M1.9 -35q1.3 1.2 2.6 0" stroke="#2a2233" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    : <><circle cx="-3.2" cy="-35" r="1.15" fill="#2a2233" /><circle cx="3.2" cy="-35" r="1.15" fill="#2a2233" /></>;
  const mouth = mood === "talk" ? <ellipse cx="0" cy="-30.5" rx="1.8" ry="1.4" fill="#7a3b46" />
    : mood === "tense" ? <path d="M-2.4 -30.5h4.8" stroke="#7a3b46" strokeWidth="1.2" strokeLinecap="round" />
    : <path d={mood === "soft" ? "M-2.6 -31.4q2.6 2.4 5.2 0" : "M-2 -31q2 1.4 4 0"} stroke="#7a3b46" strokeWidth="1.2" fill="none" strokeLinecap="round" />;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={dim}>
      <ellipse cx="0" cy="0" rx="12" ry="2.6" fill="#000" opacity=".35" />
      <path d="M-9.5 0 L-7.5 -23 Q0 -28 7.5 -23 L9.5 0 Z" fill={shirt} />
      {armSet[arms]}
      <circle cx="0" cy="-35" r="9.5" fill={C.skin} />
      {elder ? (
        <><path d="M-9.5 -36 Q-9 -46 0 -45.5 Q9 -46 9.5 -36 Q6 -41 0 -40.5 Q-6 -41 -9.5 -36Z" fill="#cfc8d6" /><circle cx="0" cy="-47" r="4" fill="#cfc8d6" /></>
      ) : (
        <path d="M-9.5 -36 Q-9.5 -46.5 0 -45.5 Q9.5 -46.5 9.5 -36 Q5.5 -41.5 0 -40.5 Q-5.5 -41.5 -9.5 -36Z" fill={hair} />
      )}
      <g transform={flip ? "scale(-1 1)" : undefined}>
        {eyes}{mouth}
        <circle cx="-6" cy="-31.5" r="1.4" fill="#f2a7a7" opacity=".45" /><circle cx="6" cy="-31.5" r="1.4" fill="#f2a7a7" opacity=".45" />
      </g>
      {arms === "phone" && <g><rect x="2" y="-33" width="5.5" height="8.5" rx="1.2" fill="#1a1428" stroke={C.blue} strokeWidth=".8" /><circle cx="4.7" cy="-29" r="9" fill={C.blue} opacity=".14" /></g>}
      {children}
    </g>
  );
}

/** 말풍선 — 짧은 글자 하나 */
function Bubble({ x, y, text, color = C.ink, tail = "left", w }: { x: number; y: number; text: string; color?: string; tail?: "left" | "right"; w?: number }) {
  const width = w ?? Math.max(20, text.length * 9 + 12);
  const tx = tail === "left" ? x + 6 : x + width - 6;
  return (
    <g>
      <rect x={x} y={y} width={width} height="17" rx="8.5" fill="#1a1428" stroke={color} strokeWidth="1.1" />
      <path d={`M${tx - 3} ${y + 16.5} l${tail === "left" ? -2 : 2} 6 l${tail === "left" ? 7 : -7} -6`} fill="#1a1428" stroke={color} strokeWidth="1.1" strokeLinejoin="round" />
      <rect x={tx - 4} y={y + 14} width="8" height="3" fill="#1a1428" />
      <text x={x + width / 2} y={y + 12.2} textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{text}</text>
    </g>
  );
}

const Floor = ({ color = "#1b1626" }: { color?: string }) => <rect x="0" y={G - 4} width={W} height={H - G + 4} fill={color} />;
const Window = ({ x, y, w = 26, h = 22, lit }: { x: number; y: number; w?: number; h?: number; lit?: boolean }) => (
  <g><rect x={x} y={y} width={w} height={h} rx="2" fill={lit ? C.warm : "#0f1a2c"} opacity={lit ? .9 : 1} stroke="#3a5470" strokeWidth="1.5" />
    <path d={`M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`} stroke="#3a5470" strokeWidth="1.2" /></g>
);
const Lamp = ({ x }: { x: number }) => (
  <g><path d={`M${x} 0V14`} stroke="#5a4a30" strokeWidth="1.2" /><path d={`M${x - 10} 14h20l-4 8h-12z`} fill="#e7c58a" />
    <path d={`M${x - 8} 22 L${x - 44} ${G - 6} H${x + 44} L${x + 8} 22Z`} fill={C.warm} opacity=".07" /></g>
);
const Moon = ({ x, y }: { x: number; y: number }) => <path d={`M${x + 7} ${y + 4}a8 8 0 1 1-8-8 6 6 0 0 0 8 8z`} fill={C.warm} opacity=".85" />;
const Board = ({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) => (
  <g><rect x={x} y={y} width={w} height={h} rx="2" fill="#1d3a2c" stroke="#5a4a30" strokeWidth="2.5" />{children}</g>
);

/* ══ 장면 18장 ═══════════════════════════════════════ */
type Scene = { sky: [string, string]; art: ReactNode };

const SCENES: Record<string, () => Scene> = {
  /* 발코니 고백 → 학원 앞 30분 · 밤 */
  balcony: () => ({
    sky: ["#101a33", "#05070d"],
    art: <>
      <Moon x={28} y={18} />
      <rect x="0" y="22" width="56" height="70" fill="#141d2e" />
      {[0, 1, 2].map((r) => <Window key={r} x={10} y={30 + r * 18} w={14} h={10} lit={r === 1} />)}
      <rect x="254" y="14" width="66" height="78" fill="#141d2e" />
      {[0, 1, 2, 3].map((r) => <Window key={r} x={276} y={22 + r * 16} w={14} h={10} />)}
      <rect x="112" y="30" width="96" height="60" fill="#1a2233" />
      <rect x="128" y="20" width="64" height="13" rx="3" fill={C.sit} /><text x="160" y="30" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#2a1a06">○○ 학원</text>
      <rect x="148" y="58" width="24" height="32" fill="#2a3448" stroke="#3a5470" />
      <Floor />
      <Kid x={124} shirt="#f2c7d0" hair="#4a2c38" mood="soft" arms="phone" />
      <Kid x={196} shirt="#bcd3ea" mood="talk" flip arms="front" />
      <path d="M138 52 q22 -14 44 0" stroke={C.red} strokeWidth="1.2" strokeDasharray="2 3" fill="none" opacity=".8" />
      <path d="M160 41c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z" fill={C.red} opacity=".85" />
    </>,
  }),

  /* 대신 쓰는 편지 → 대신 쓰는 DM */
  cyrano: () => ({
    sky: ["#3d2a44", "#120a18"],
    art: <>
      <Board x={40} y={18} w={110} h={46}><path d="M54 34h44M54 44h28" stroke="#e8f0e8" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" /></Board>
      <Window x={250} y={20} w={46} h={40} />
      <Floor />
      <rect x="70" y="66" width="60" height="6" rx="2" fill={C.wood} /><path d="M76 72v14M124 72v14" stroke={C.wood} strokeWidth="3" />
      <Kid x={100} shirt="#e8d9c5" mood="calm" arms="phone" />
      <Kid x={246} shirt="#f2c7d0" hair="#4a2c38" mood="soft" flip arms="phone" dim={.75} />
      <g>
        <rect x="136" y="18" width="62" height="30" rx="7" fill="#1a1428" stroke={C.blue} strokeWidth="1.1" />
        <path d="M144 28h40M144 36h28" stroke={C.ink} strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M196 50 l-4 -4" stroke={C.blue} />
      </g>
      <path d="M112 50 q10 -14 22 -18" stroke={C.sit} strokeWidth="1.2" strokeDasharray="2 3" fill="none" />
      <path d="M200 34 q24 2 38 14" stroke={C.blue} strokeWidth="1.2" strokeDasharray="2 3" fill="none" />
      <path d="M118 18l6 6-10 10h-6v-6z" fill={C.sit} opacity=".9" />
    </>,
  }),

  /* 기차 출발 전 → 전학 가는 날 셔틀 정류장 · 노을 */
  train: () => ({
    sky: ["#5a2c40", "#120a18"],
    art: <>
      <circle cx="270" cy="58" r="18" fill="#ff9a6a" opacity=".5" />
      <path d="M0 70 h320" stroke="#3a2c40" strokeWidth="1" />
      <Floor color="#1d1520" />
      <path d="M44 86 V30" stroke="#9aa7b4" strokeWidth="2.5" /><rect x="30" y="20" width="44" height="18" rx="4" fill="#3a7bd5" />
      <text x="52" y="32.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff">셔틀</text>
      <g transform="translate(206 44)">
        <rect width="110" height="40" rx="7" fill={C.sit} /><rect x="8" y="6" width="94" height="14" rx="2" fill="#2a3448" />
        <path d="M36 6v14M64 6v14" stroke={C.sit} strokeWidth="2" /><circle cx="24" cy="42" r="6" fill="#222" /><circle cx="88" cy="42" r="6" fill="#222" />
      </g>
      <Kid x={108} shirt="#bcd3ea" mood="tense" arms="front" />
      <Kid x={160} shirt="#f2c7d0" hair="#4a2c38" mood="soft" flip arms="reach" />
      <g transform="translate(176 66)"><rect width="18" height="22" rx="3" fill="#7a5ab0" /><path d="M5 0v-5h8v5" stroke="#7a5ab0" strokeWidth="2" fill="none" /></g>
      <Bubble x={124} y={18} text="5분" color={C.sit} />
    </>,
  }),

  /* 대출 카드의 이름 → 졸업 D-7 도서관 서고 */
  loveletter: () => ({
    sky: ["#2a2030", "#0e0a12"],
    art: <>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x="20" y={18 + r * 22} width="130" height="3" fill={C.wood} />
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={24 + i * 9} y={4 + r * 22 + (i % 3)} width="7" height={14 - (i % 3)} rx="1" fill={["#7a5ab0", "#3a7bd5", "#a0574a", "#4e7a5a"][(i + r) % 4]} opacity=".75" />)}
        </g>
      ))}
      <path d="M240 0 L200 90 H290 L268 0Z" fill={C.warm} opacity=".08" />
      <Floor color="#1a1420" />
      <Kid x={220} shirt="#e8d9c5" mood="soft" arms="front" />
      <g transform="translate(232 40) rotate(-8)">
        <rect width="40" height="28" rx="2" fill={C.paper} />
        <text x="5" y="9" fontSize="6.5" fontWeight="800" fill="#6a4a30">대출 카드</text>
        <path d="M5 14h30M5 19h30M5 24h30" stroke="#c9b27a" strokeWidth=".8" />
        <path d="M6 18.5h16" stroke={C.red} strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <text x="290" y="22" fontSize="11" fontWeight="900" fill={C.sit} textAnchor="end">D-7</text>
    </>,
  }),

  /* 세 딸의 대답 → 명절 할머니의 질문 */
  lear: () => ({
    sky: ["#3a2618", "#120c08"],
    art: <>
      <Lamp x={160} />
      <rect x="250" y="20" width="40" height="30" rx="2" fill="#2a1d14" stroke={C.gold} strokeWidth="1.2" />
      <path d="M256 44l10-12 8 8 6-5 6 9z" fill={C.gold} opacity=".5" />
      <Kid x={160} y={70} elder shirt="#a0574a" mood="talk" arms="front" />
      <Kid x={84} shirt="#bcd3ea" mood="tense" arms="front" />
      <Kid x={118} s={.9} shirt="#f2c7d0" hair="#4a2c38" mood="soft" arms="front" />
      <Kid x={236} shirt="#c9e6d4" mood="calm" flip arms="front" />
      <rect x="64" y="70" width="196" height="8" rx="3" fill={C.wood} />
      <path d="M76 78v12M248 78v12" stroke={C.wood} strokeWidth="4" />
      <ellipse cx="140" cy="68" rx="10" ry="2.6" fill={C.ink} opacity=".7" /><ellipse cx="190" cy="68" rx="10" ry="2.6" fill={C.ink} opacity=".7" />
      <Bubble x={176} y={14} text="누가 제일?" color={C.sit} />
    </>,
  }),

  /* 식탁에서 처음 「아니」 → 학원 하나 더 */
  dollhouse: () => ({
    sky: ["#2c2236", "#0d0a12"],
    art: <>
      <Lamp x={160} />
      <Window x={30} y={20} w={40} h={34} />
      <Kid x={104} s={1.15} shirt="#7a8aa0" hair="#2a2233" mood="talk" arms="front" />
      <Kid x={216} shirt="#f2c7d0" hair="#4a2c38" mood="tense" flip arms="front" />
      <rect x="80" y="66" width="160" height="8" rx="3" fill={C.wood} />
      <path d="M92 74v16M228 74v16" stroke={C.wood} strokeWidth="4" />
      <g transform="translate(146 54) rotate(-6)"><rect width="28" height="14" rx="1.5" fill={C.paper} /><text x="14" y="10" textAnchor="middle" fontSize="7" fontWeight="900" fill="#a0574a">학원+1</text></g>
      <Bubble x={226} y={20} text="아니" color={C.sit} tail="left" />
    </>,
  }),

  /* 돌아온 동생 → 반나절 연락 두절 */
  prodigal: () => ({
    sky: ["#1c2030", "#07080d"],
    art: <>
      <rect x="60" y="14" width="56" height="76" fill="#2a1d14" stroke="#5a4a30" strokeWidth="2" />
      <path d="M60 14 L88 22 V86 L60 90Z" fill="#3a2c20" />
      <path d="M88 22 V86 L116 90 V14Z" fill={C.warm} opacity=".35" />
      <Floor />
      <Kid x={104} shirt="#bcd3ea" mood="tense" arms="down">
        <rect x="-15" y="-24" width="8" height="18" rx="3" fill="#7a5ab0" />
      </Kid>
      <Kid x={210} shirt="#c9e6d4" mood="tense" flip arms="cross" />
      <g transform="translate(250 22)">
        <rect width="46" height="24" rx="5" fill="#1a1428" stroke={C.red} strokeWidth="1.1" />
        <text x="23" y="10" textAnchor="middle" fontSize="6.5" fill={C.dim}>부재중</text>
        <text x="23" y="20" textAnchor="middle" fontSize="9" fontWeight="900" fill={C.red}>12통</text>
      </g>
      <path d="M150 50 h20" stroke={C.dim} strokeWidth="1.2" strokeDasharray="2 3" />
    </>,
  }),

  /* 사라진 물건 → 사라진 학급비 */
  missing: () => ({
    sky: ["#203247", "#0a111a"],
    art: <>
      <Board x={70} y={14} w={150} h={42}>
        <text x="84" y="32" fontSize="9" fill="#e8f0e8" opacity=".6">학급비</text>
        <path d="M84 42h50" stroke="#e8f0e8" strokeOpacity=".35" strokeWidth="1.5" strokeLinecap="round" />
      </Board>
      <Floor />
      <rect x="120" y="64" width="64" height="6" rx="2" fill={C.wood} /><path d="M126 70v18M178 70v18" stroke={C.wood} strokeWidth="3" />
      <g transform="translate(138 48)"><path d="M0 16 V6 h28 v10z" fill={C.paper} /><path d="M0 6 L14 -4 L28 6" fill="none" stroke={C.gold} strokeWidth="1.4" /></g>
      <text x="152" y="44" textAnchor="middle" fontSize="16" fontWeight="900" fill={C.sit}>?</text>
      <Kid x={88} shirt="#e8d9c5" mood="tense" arms="reach" />
      <g transform="translate(106 68)"><circle r="7" fill="none" stroke={C.sit} strokeWidth="2" /><path d="M5 5l6 6" stroke={C.sit} strokeWidth="2.5" strokeLinecap="round" /></g>
      <Kid x={236} shirt="#bcd3ea" mood="calm" flip arms="cross" dim={.8} />
      <Kid x={272} s={.9} shirt="#f2c7d0" hair="#4a2c38" mood="talk" flip arms="down" dim={.65} />
    </>,
  }),

  /* 마지막으로 본 사람 → 바뀐 체육복 */
  holmes: () => ({
    sky: ["#203247", "#0a111a"],
    art: <>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}><rect x={20 + i * 30} y="16" width="26" height="70" rx="2" fill="#203247" stroke="#2f4a66" />
          <path d={`M${25 + i * 30} 24h16M${25 + i * 30} 28h16`} stroke="#2f4a66" /><circle cx={41 + i * 30} cy="52" r="1.4" fill={C.gold} /></g>
      ))}
      <Floor />
      <g transform="translate(200 18)">
        <path d="M14 0 v6" stroke={C.dim} strokeWidth="1.2" /><path d="M0 12 l14-6 14 6 -4 6 v24 h-20 v-24z" fill="#3a7bd5" />
        <rect x="8" y="20" width="12" height="6" rx="1" fill={C.paper} /><path d="M10 23h8" stroke="#a0574a" strokeWidth="1.2" />
      </g>
      <g transform="translate(214 40)"><circle r="11" fill={C.sit} opacity=".12" stroke={C.sit} strokeWidth="2" /><path d="M8 8l9 9" stroke={C.sit} strokeWidth="3" strokeLinecap="round" /></g>
      <Kid x={262} shirt="#e8d9c5" mood="tense" flip arms="reach" />
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={176 - i * 22} cy={G - (i % 2) * 3} rx="4" ry="1.8" fill={C.dim} opacity={.5 - i * .1} />)}
    </>,
  }),

  /* 한 방의 열두 명 → 반티 투표 28:1 */
  twelve: () => ({
    sky: ["#203247", "#0a111a"],
    art: <>
      <Board x={80} y={8} w={160} h={44}>
        <text x="160" y="38" textAnchor="middle" fontSize="22" fontWeight="900" fill="#e8f0e8" opacity=".85">28 : 1</text>
        <text x="92" y="20" fontSize="7" fill="#e8f0e8" opacity=".55">반티</text>
      </Board>
      <Floor />
      <Kid x={268} shirt="#ffcf7a" hair="#4a2c38" mood="talk" flip arms="up" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} transform={`translate(${24 + i * 24} ${96 - (i % 2) * 4})`} opacity=".85">
          <path d="M-9 4 Q-9 -6 0 -7 Q9 -6 9 4Z" fill="#7a8aa0" />
          <circle cy="-14" r="7" fill={C.skin} /><path d="M-7 -15 Q-7 -22 0 -22 Q7 -22 7 -15 Q3 -18 0 -18 Q-3 -18 -7 -15Z" fill="#3a2c48" />
        </g>
      ))}
    </>,
  }),

  /* 살 1파운드 → 내기에서 진 사람 매점 */
  merchant: () => ({
    sky: ["#2a2440", "#0d0b16"],
    art: <>
      <rect x="20" y="16" width="120" height="50" fill="#221c33" />
      {[0, 1].map((r) => (
        <g key={r}><rect x="20" y={36 + r * 24} width="120" height="3" fill={C.wood} />
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={26 + i * 14} y={22 + r * 24} width="10" height="14" rx="2" fill={["#ff8a8a", "#ffcf7a", "#8fbbe0", "#9fe0c0"][(i + r) % 4]} opacity=".7" />)}
        </g>
      ))}
      <rect x="18" y="4" width="62" height="13" rx="3" fill={C.sit} /><text x="49" y="14" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#2a1a06">매점</text>
      <Floor />
      <Kid x={176} shirt="#bcd3ea" mood="tense" arms="front" />
      <Kid x={262} shirt="#c9e6d4" mood="talk" flip arms="reach" />
      <g transform="translate(219 16)" stroke={C.gold} strokeWidth="1.4" fill="none">
        <path d="M0 0v30M-18 6h36M-8 32h16" />
        <path d="M-18 6l-6 12h12zM18 6l-6 12h12z" />
        <path d="M-24 18a6 3 0 0 0 12 0M12 18a6 3 0 0 0 12 0" fill={C.gold} fillOpacity=".25" />
      </g>
    </>,
  }),

  /* 뒤바뀐 사람 → 이름표 그대로인 빌린 체육복 */
  swapped: () => ({
    sky: ["#1f3b2e", "#0b140f"],
    art: <>
      <path d="M0 78 Q160 66 320 78 V100 H0Z" fill="#1f3b2e" />
      <path d="M20 88 Q160 74 300 88" stroke={C.ink} strokeOpacity=".25" strokeWidth="1.2" fill="none" />
      <Kid x={120} shirt="#3a7bd5" mood="tense" arms="down">
        <rect x="-6" y="-19" width="12" height="6" rx="1" fill={C.paper} /><text x="0" y="-14.6" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#a0574a">서윤</text>
      </Kid>
      <Kid x={200} shirt="#3a7bd5" hair="#4a2c38" mood="talk" flip arms="down">
        <rect x="-6" y="-19" width="12" height="6" rx="1" fill={C.paper} /><text x="0" y="-14.6" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#3a7bd5" transform="scale(-1 1)">하준</text>
      </Kid>
      <path d="M128 22 Q160 4 192 22" stroke={C.sit} strokeWidth="1.6" fill="none" /><path d="M188 16l4 6-7 1" stroke={C.sit} strokeWidth="1.6" fill="none" />
      <path d="M192 34 Q160 50 128 34" stroke={C.sit} strokeWidth="1.6" fill="none" opacity=".6" /><path d="M132 40l-4-6 7-1" stroke={C.sit} strokeWidth="1.6" fill="none" opacity=".6" />
      <text x="160" y="32" textAnchor="middle" fontSize="11" fontWeight="900" fill={C.sit}>?!</text>
    </>,
  }),

  /* 반복되는 하루 → 시험 전날 스터디카페 3회차 */
  loop: () => ({
    sky: ["#14182a", "#06070d"],
    art: <>
      {[0, 1, 2].map((i) => <rect key={i} x={20 + i * 50} y="28" width="4" height="60" fill="#2a2440" />)}
      <Lamp x={110} />
      <Floor />
      <rect x="70" y="62" width="90" height="6" rx="2" fill={C.wood} />
      <rect x="84" y="56" width="22" height="6" fill={C.paper} /><rect x="110" y="57" width="18" height="5" fill="#bcd3ea" />
      <Kid x={96} y={84} shirt="#e8d9c5" mood="sleep" arms="front" />
      <g transform="translate(232 44)">
        <circle r="24" fill="#1a1428" stroke={C.sit} strokeWidth="1.6" />
        <path d="M0 -14 V0 L9 6" stroke={C.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M-30 -6 A30 30 0 1 1 -22 22" stroke={C.violet} strokeWidth="1.6" fill="none" strokeDasharray="3 3" />
        <path d="M-27 18 l5 4 1-6" stroke={C.violet} strokeWidth="1.6" fill="none" />
      </g>
      <g transform="translate(270 70)"><rect width="40" height="16" rx="8" fill={C.sit} /><text x="20" y="11.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#2a1a06">3회차</text></g>
    </>,
  }),

  /* 무리에 안 맞는 아이 → 셔틀 맨 뒷자리 가운데 */
  duckling: () => ({
    sky: ["#1c2634", "#080b12"],
    art: <>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 74} y="12" width="62" height="30" rx="5" fill="#2b4566" stroke="#3a5470" strokeWidth="2" />)}
      <rect x="10" y="62" width="300" height="28" rx="8" fill="#3a2c48" />
      <rect x="10" y="48" width="300" height="18" rx="6" fill="#4a3858" />
      <Kid x={44} y={74} shirt="#7a8aa0" mood="talk" arms="front" />
      <Kid x={84} y={74} shirt="#7a8aa0" hair="#4a2c38" mood="soft" flip arms="front" />
      <Kid x={160} y={74} shirt={C.sit} mood="tense" arms="front" />
      <Kid x={236} y={74} shirt="#7a8aa0" mood="soft" arms="front" />
      <Kid x={276} y={74} shirt="#7a8aa0" hair="#4a2c38" mood="talk" flip arms="front" />
      <path d="M140 74 h-12M180 74 h12" stroke={C.sit} strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
    </>,
  }),

  /* 우리끼리의 섬 → 수련회 방, 어른 없는 밤 */
  island: () => ({
    sky: ["#0a1020", "#05070d"],
    art: <>
      <rect x="236" y="14" width="54" height="40" rx="3" fill="#0f1a2c" stroke="#3a5470" strokeWidth="2" /><Moon x={262} y={32} />
      <rect x="20" y="10" width="34" height="80" fill="#1a1428" stroke="#2d2542" />
      <text x="37" y="40" textAnchor="middle" fontSize="7" fill={C.dim}>203호</text>
      <Floor color="#1a1626" />
      <rect x="64" y="76" width="200" height="14" rx="5" fill="#3a3550" opacity=".8" />
      <Kid x={98} y={86} s={.9} shirt="#bcd3ea" mood="talk" arms="front" />
      <Kid x={138} y={88} s={.9} shirt="#f2c7d0" hair="#4a2c38" mood="calm" arms="front" />
      <Kid x={186} y={88} s={.9} shirt="#c9e6d4" mood="tense" flip arms="front" />
      <Kid x={226} y={86} s={.9} shirt={C.sit} mood="talk" flip arms="up" />
      <g transform="translate(160 78)"><rect x="-5" y="-4" width="10" height="8" rx="2" fill="#9aa7b4" /><path d="M-5 -4 L-30 -60 H30 L5 -4Z" fill={C.warm} opacity=".12" /></g>
    </>,
  }),

  /* 망설이는 왕자 → 받은 캡처, 아직 아무 말 안 함 */
  hamlet: () => ({
    sky: ["#0a0d18", "#030408"],
    art: <>
      <rect x="30" y="20" width="44" height="34" rx="2" fill="#0f1a2c" stroke="#2d2542" strokeWidth="2" />
      <Floor color="#120f1c" />
      <rect x="70" y="64" width="110" height="24" rx="4" fill="#2a2440" /><rect x="72" y="58" width="30" height="10" rx="4" fill="#e7dcf7" opacity=".6" />
      <Kid x={130} y={80} shirt="#7a8aa0" mood="tense" arms="phone" />
      <circle cx="136" cy="50" r="30" fill={C.blue} opacity=".06" />
      <g transform="translate(196 10)">
        <rect width="64" height="66" rx="6" fill="#1a1428" stroke={C.blue} strokeWidth="1.2" />
        <rect x="6" y="8" width="34" height="9" rx="4.5" fill="#3a3550" /><rect x="22" y="22" width="36" height="9" rx="4.5" fill={C.blue} opacity=".55" />
        <rect x="6" y="36" width="40" height="9" rx="4.5" fill="#3a3550" />
        <path d="M6 54 h38" stroke={C.dim} strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="52" cy="54" r="5" fill={C.sit} /><path d="M50 54 l2 2 3-4" stroke="#2a1a06" strokeWidth="1.2" fill="none" />
      </g>
      <text x="282" y="52" fontSize="12" fontWeight="900" fill={C.dim}>…</text>
    </>,
  }),

  /* 형제의 박 → 편의점 1+1 */
  heungbu: () => ({
    sky: ["#14243a", "#070c14"],
    art: <>
      <rect x="40" y="10" width="240" height="80" fill="#1c2836" />
      <rect x="40" y="10" width="240" height="12" fill="#3a7bd5" />
      <rect x="54" y="28" width="70" height="58" rx="3" fill="#13303a" stroke={C.mint} strokeOpacity=".5" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={60 + c * 16} y={32 + r * 18} width="9" height="14" rx="3" fill={["#ff8a8a", "#9fe0c0", "#ffcf7a"][(r + c) % 3]} opacity=".7" />))}
      <g transform="translate(232 28)"><rect width="38" height="20" rx="4" fill={C.red} /><text x="19" y="14.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">1+1</text></g>
      <Floor />
      <Kid x={160} shirt="#e8d9c5" mood="calm" arms="up">
        <rect x="9" y="-46" width="7" height="11" rx="2" fill="#ff8a8a" /><rect x="17" y="-46" width="7" height="11" rx="2" fill="#ff8a8a" />
      </Kid>
      <Kid x={222} shirt="#c9e6d4" mood="soft" flip arms="reach" dim={.85} />
      <Kid x={104} s={.9} shirt="#bcd3ea" mood="talk" arms="reach" dim={.85} />
    </>,
  }),

  /* 가족을 위해 → 동생 픽업이 내 차례, 친구들은 PC방 */
  simcheong: () => ({
    sky: ["#3d2a44", "#120a18"],
    art: <>
      <rect x="20" y="14" width="110" height="76" fill="#1a1428" />
      <rect x="30" y="20" width="90" height="16" rx="3" fill="#1a1428" stroke={C.violet} strokeWidth="1.6" />
      <text x="75" y="32" textAnchor="middle" fontSize="9" fontWeight="900" fill={C.violet}>PC방</text>
      {[0, 1].map((i) => <rect key={i} x={36 + i * 44} y="44" width="34" height="22" rx="2" fill={C.violet} opacity=".15" />)}
      <Floor />
      <Kid x={56} s={.85} shirt="#7a8aa0" mood="talk" arms="up" dim={.6} />
      <Kid x={92} s={.85} shirt="#7a8aa0" hair="#4a2c38" mood="soft" arms="down" dim={.6} />
      <Kid x={208} shirt={C.sit} mood="calm" flip arms="reach" />
      <Kid x={186} s={.62} shirt="#f2c7d0" hair="#4a2c38" mood="soft" flip arms="up" />
      <g transform="translate(268 30)"><rect width="34" height="16" rx="3" fill={C.paper} /><text x="17" y="11.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#a0574a">어린이집</text></g>
      <path d="M150 50 l-12 6 12 6" stroke={C.dim} strokeWidth="1.2" fill="none" opacity=".6" />
    </>,
  }),

  /* 📺 응답하라 1988 → 언니 생일 케이크에 얹힌 내 생일 */
  reply1988: () => ({
    sky: ["#3a2618", "#120c08"],
    art: <>
      <Lamp x={160} />
      <rect x="250" y="16" width="44" height="38" rx="2" fill="#0f1a2c" stroke="#5a4a30" strokeWidth="2" />
      <path d="M272 16v38M250 35h44" stroke="#5a4a30" strokeWidth="1.5" />
      <Kid x={272} y={52} s={.55} shirt="#9fe0c0" mood="soft" arms="up" dim={.8} />
      <Kid x={78} s={1.12} shirt="#a0574a" hair="#2a2233" mood="tense" arms="front" />
      <Kid x={124} shirt="#bcd3ea" mood="calm" arms="front" />
      <Kid x={210} shirt="#f2c7d0" hair="#4a2c38" mood="tense" flip arms="front" />
      <rect x="56" y="68" width="196" height="8" rx="3" fill={C.wood} />
      <path d="M68 76v14M240 76v14" stroke={C.wood} strokeWidth="4" />
      <g transform="translate(150 52)">
        <rect x="-18" y="0" width="36" height="16" rx="3" fill={C.paper} /><rect x="-18" y="0" width="36" height="5" rx="2" fill={C.red} opacity=".7" />
        {[-12, -6, 0, 6, 12].map((x) => <g key={x}><rect x={x - .8} y="-8" width="1.6" height="8" fill="#9fc3e0" /><ellipse cx={x} cy="-10" rx="1.6" ry="2.4" fill={C.sit} /></g>)}
        <text x="0" y="13" textAnchor="middle" fontSize="5" fontWeight="900" fill="#a0574a">수아</text>
      </g>
      <g transform="translate(176 58)" opacity=".9">{[0, 4, 8].map((x) => <g key={x}><rect x={x} y="0" width="1.6" height="8" fill="#f2c7d0" /><ellipse cx={x + .8} cy="-2" rx="1.4" ry="2.2" fill={C.sit} /></g>)}</g>
      <Bubble x={196} y={14} text="나는?" color={C.sit} />
    </>,
  }),

  /* 📚 슬램덩크 → 체육관에 시비 걸러 간 날 */
  slamdunk: () => ({
    sky: ["#2a2440", "#0d0b16"],
    art: <>
      <rect x="0" y="0" width={W} height="60" fill="#1c1830" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={10 + i * 54} y="6" width="40" height="22" rx="2" fill="#2b4566" opacity=".55" />)}
      <g transform="translate(262 18)">
        <rect x="-20" y="0" width="40" height="26" rx="2" fill="#f3eff8" opacity=".85" /><rect x="-8" y="10" width="16" height="11" fill="none" stroke={C.red} strokeWidth="1.5" />
        <ellipse cx="0" cy="30" rx="10" ry="3" fill="none" stroke={C.red} strokeWidth="2" />
        <path d="M-10 30 l3 12 M10 30 l-3 12 M-4 31 l1 11 M4 31 l-1 11" stroke={C.ink} strokeOpacity=".6" />
      </g>
      <rect x="0" y={G - 4} width={W} height={H - G + 4} fill="#5a3c26" />
      <path d="M0 92 H320" stroke={C.ink} strokeOpacity=".35" />
      <Kid x={82} shirt="#3a3550" mood="tense" arms="cross" />
      <Kid x={158} shirt="#ff8a8a" mood="calm" flip arms="front" />
      <Kid x={204} s={.85} shirt="#ffcf7a" mood="talk" flip arms="up" />
      <g transform="translate(118 86)"><circle r="6" fill="#e07a3a" /><path d="M-6 0h12M0 -6v12" stroke="#6a2a10" strokeWidth=".8" /></g>
      <g transform="translate(30 50)"><rect width="24" height="30" rx="2" fill="#2a3448" stroke="#3a5470" /><text x="12" y="20" textAnchor="middle" fontSize="11" fontWeight="900" fill={C.sit}>14</text></g>
    </>,
  }),

  /* 🎞 이웃집 토토로 → 비 오는 정류장 */
  totoro: () => ({
    sky: ["#1c2634", "#080b12"],
    art: <>
      <g stroke="#9fc3e0" strokeOpacity=".45" strokeWidth="1.1">
        {Array.from({ length: 18 }, (_, i) => <line key={i} x1={8 + i * 18} y1={(i * 11) % 40} x2={4 + i * 18} y2={(i * 11) % 40 + 10} />)}
      </g>
      <path d="M40 86 V24" stroke="#9aa7b4" strokeWidth="2.5" /><rect x="26" y="16" width="30" height="16" rx="4" fill="#3a7bd5" />
      <text x="41" y="27.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff">BUS</text>
      <path d="M290 86 V20" stroke="#5a4a30" strokeWidth="2" /><circle cx="290" cy="18" r="5" fill={C.warm} opacity=".9" />
      <path d="M260 86 L276 22 H304 L320 86Z" fill={C.warm} opacity=".06" />
      <Floor color="#151a24" />
      <ellipse cx="160" cy={G} rx="60" ry="3" fill="#9fc3e0" opacity=".15" />
      <Kid x={120} shirt="#ffcf7a" mood="calm" arms="reach">
        <Kid x={-6} y={-18} s={.5} shirt="#f2c7d0" hair="#4a2c38" mood="sleep" arms="front" />
      </Kid>
      <path d="M100 38 Q120 18 140 38 Z" fill="#7a5ab0" /><path d="M120 38 V62" stroke="#5a4a30" strokeWidth="1.5" />
      <Kid x={196} s={1.35} shirt="#6a8a5a" mood="soft" flip arms="front">
        <path d="M-3 -46 q4 -8 10 -4 q-4 1 -6 6z" fill="#6aa05a" />
      </Kid>
      <path d="M176 22 Q196 0 216 22 Z" fill="#3a3550" stroke={C.dim} strokeOpacity=".4" />
      <path d="M196 22 V36" stroke="#5a4a30" strokeWidth="1.5" />
      <text x="214" y="12" fontSize="8" fill={C.sit} opacity=".9">톡 톡</text>
    </>,
  }),

  /* 🎞 센과 치히로 → 학생회실 「일 시켜 주세요」 */
  spirited: () => ({
    sky: ["#2c2236", "#0d0a12"],
    art: <>
      <Lamp x={232} />
      <rect x="20" y="16" width="70" height="30" rx="2" fill="#221c33" stroke="#3d2f62" />
      <text x="55" y="34" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.violet}>학생회</text>
      <Floor />
      <g transform="translate(26 58)">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 3} y={-i * 7} width="56" height="7" rx="2" fill={["#ff8a8a", "#ffcf7a", "#8fbbe0", "#9fe0c0"][i]} opacity=".75" />)}
      </g>
      <rect x="196" y="62" width="90" height="8" rx="2" fill={C.wood} /><path d="M204 70v18M278 70v18" stroke={C.wood} strokeWidth="3" />
      <g transform="translate(206 50)"><rect width="22" height="12" fill={C.paper} /><rect x="3" y="-4" width="22" height="12" fill={C.paper} opacity=".8" /></g>
      <Kid x={252} y={62} shirt="#7a5ab0" mood="tense" flip arms="front" />
      <Kid x={128} shirt="#f2c7d0" hair="#4a2c38" mood="talk" arms="front" />
      <Bubble x={140} y={16} text="일하게 해 주세요" color={C.sit} />
    </>,
  }),

  /* 🎞 인사이드 아웃 → 머릿속 본부 */
  insideout: () => ({
    sky: ["#1a1838", "#08061a"],
    art: <>
      <rect x="96" y="8" width="128" height="40" rx="4" fill="#0f1a2c" stroke="#5a6ab0" strokeWidth="2" />
      <rect x="140" y="30" width="40" height="5" rx="2" fill={C.wood} /><circle cx="128" cy="24" r="6" fill={C.ink} opacity=".8" /><circle cx="192" cy="24" r="6" fill={C.ink} opacity=".8" />
      <text x="160" y="20" textAnchor="middle" fontSize="6" fill={C.dim}>오늘 어땠어?</text>
      <Floor color="#151230" />
      <rect x="70" y="60" width="180" height="12" rx="6" fill="#2a2a5a" />
      {["#ffcf7a", "#3a7bd5", "#ff8a8a", "#c9a6ff", "#9fe0c0"].map((c, i) => <circle key={c} cx={98 + i * 31} cy="66" r="3.2" fill={c} />)}
      <Kid x={64} shirt="#ffcf7a" hair="#3a7bd5" mood="talk" arms="up" />
      <Kid x={112} s={.9} shirt="#3a7bd5" hair="#2a4a8a" mood="sleep" arms="reach" />
      <Kid x={208} shirt="#ff8a8a" hair="#a0302a" mood="tense" flip arms="up" />
      <Kid x={248} s={.85} shirt="#c9a6ff" mood="tense" flip arms="front" />
      <Kid x={286} shirt="#9fe0c0" mood="calm" flip arms="cross" />
      <circle cx="160" cy="88" r="5" fill="#3a7bd5" opacity=".85" /><circle cx="160" cy="88" r="5" fill="none" stroke={C.ink} strokeOpacity=".4" />
    </>,
  }),

  /* 🎞 너의 이름은. → 어제 내가 반장한테 뭐라고 했다고? */
  yourname: () => ({
    sky: ["#355777", "#0f1a28"],
    art: <>
      <path d="M0 0 H80 L40 90 H0Z" fill={C.warm} opacity=".07" />
      <Board x={110} y={10} w={120} h={36}><text x="122" y="30" fontSize="8" fill="#e8f0e8" opacity=".55">반장 선거 후보 등록</text></Board>
      <Floor />
      <rect x="120" y="66" width="80" height="6" rx="2" fill={C.wood} /><path d="M126 72v16M194 72v16" stroke={C.wood} strokeWidth="3" />
      <g transform="translate(140 52) rotate(-4)">
        <rect width="40" height="15" rx="1.5" fill={C.paper} /><text x="20" y="10.5" textAnchor="middle" fontSize="7" fontWeight="800" fill={C.red} fontStyle="italic">너 누구야?</text>
      </g>
      <Kid x={98} shirt="#f2c7d0" hair="#4a2c38" mood="tense" arms="front" />
      <Kid x={226} shirt="#ffcf7a" mood="talk" flip arms="phone" />
      <Kid x={272} s={.9} shirt="#bcd3ea" mood="soft" flip arms="down" dim={.75} />
      <Bubble x={210} y={6} text="기억 안 나?" color={C.sit} tail="left" />
      <path d="M40 30 l3 -6 3 6 -3 6z" fill={C.sit} opacity=".6" />
    </>,
  }),

  /* 📚 스파이 패밀리 → 가족 캠프 면접 */
  spyfamily: () => ({
    sky: ["#203247", "#0a111a"],
    art: <>
      <rect x="220" y="58" width="90" height="8" rx="2" fill={C.wood} /><path d="M228 66v22M302 66v22" stroke={C.wood} strokeWidth="3" />
      <Kid x={266} y={60} shirt="#2a2233" mood="tense" flip arms="front" />
      <rect x="282" y="52" width="14" height="6" fill={C.paper} />
      <Floor />
      <Kid x={48} s={1.1} shirt="#3a3550" hair="#e8d28a" mood="soft" arms="front" />
      <Kid x={96} s={.8} shirt="#f2c7d0" hair="#d98fb0" mood="talk" arms="front" />
      <Kid x={142} s={1.1} shirt="#a0574a" hair="#2a2233" mood="soft" arms="front" />
      <g opacity=".95">
        <rect x="18" y="4" width="60" height="16" rx="8" fill="#1a1428" stroke={C.violet} strokeDasharray="2 2" />
        <text x="48" y="15" textAnchor="middle" fontSize="7" fill={C.violet}>🔊 회사는 안 돼…</text>
        <rect x="118" y="4" width="64" height="16" rx="8" fill="#1a1428" stroke={C.violet} strokeDasharray="2 2" />
        <text x="150" y="15" textAnchor="middle" fontSize="7" fill={C.violet}>🔊 요리 대회…?</text>
      </g>
      <path d="M96 30 v4" stroke={C.violet} strokeWidth="1.2" /><circle cx="96" cy="28" r="2" fill={C.violet} />
      <Bubble x={226} y={20} text="구체적으로" color={C.sit} tail="right" />
    </>,
  }),

  /* 📖 해리 포터 → 수련회 「말하는 모자」 */
  sortinghat: () => ({
    sky: ["#14182a", "#06070d"],
    art: <>
      <path d="M140 0 L104 82 H216 L180 0Z" fill={C.warm} opacity=".12" />
      <rect x="40" y="76" width="240" height="12" fill="#3a2c48" />
      <Kid x={160} y={78} shirt="#bcd3ea" mood="tense" arms="up">
        <path d="M-14 -40 Q-16 -46 -6 -48 L0 -76 Q4 -66 10 -50 Q18 -46 16 -40Z" fill="#6a4a30" />
        <path d="M-4 -56 q4 3 8 0" stroke="#2a1a10" strokeWidth="1.2" fill="none" />
      </Kid>
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i} transform={`translate(${14 + i * 29} ${104 - (i % 2) * 5})`} opacity=".75">
          <path d="M-9 4 Q-9 -6 0 -7 Q9 -6 9 4Z" fill={i < 3 ? "#ffcf7a" : "#7a8aa0"} />
          <circle cy="-14" r="7" fill={C.skin} />
        </g>
      ))}
      <Bubble x={190} y={10} text="흐음~ 어디 보자" color={C.sit} tail="left" />
      <text x="20" y="20" fontSize="9" fontWeight="900" fill={C.sit} opacity=".8">1조! 1조!</text>
    </>,
  }),
};

/** 🪞 내 장면에서 온 상황극 — 장르 대표 장면으로 */
const BY_GENRE: Record<string, string> = {
  romance: "balcony", family: "dollhouse", mystery: "missing", court: "twelve",
  comedy: "swapped", youth: "duckling", tragedy: "hamlet", folk: "heungbu",
};

/* ══ 상황극 한 장 ══════════════════════════════════════ */
export function SitArt({ a, slug = true, className }: { a: Archetype; slug?: boolean; className?: string }) {
  const key = SCENES[a.id] ? a.id : BY_GENRE[a.genre] ?? "missing";
  const { sky, art } = SCENES[key]();
  const id = `sa${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const label = [a.scene?.place, a.scene?.time].filter(Boolean).join(" · ");
  const slugW = Math.min(W - 16, label.length * 7.6 + 30);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`sit-art ${className ?? ""}`} role="img" style={{ fontFamily: FONT }}
      aria-label={`${a.adaptTitle} — ${label || a.typeName}`}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
        <radialGradient id={`${id}-vig`} cx=".5" cy=".45" r=".75"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
        <clipPath id={`${id}-clip`}><rect width={W} height={H} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width={W} height={H} fill={`url(#${id}-sky)`} />
        {art}
        <rect width={W} height={H} fill={`url(#${id}-vig)`} pointerEvents="none" />
        {slug && label && (
          <g transform="translate(8 80)">
            <rect width={slugW} height="14" rx="7" fill="#0b0912" opacity=".78" />
            <text x="8" y="10" fontSize="8" fontWeight="800" fill={C.sit} letterSpacing=".4">S#</text>
            <text x="24" y="10" fontSize="8" fill={C.ink} opacity=".85">{label}</text>
          </g>
        )}
      </g>
    </svg>
  );
}
