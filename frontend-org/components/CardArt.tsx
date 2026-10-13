"use client";

import { useId } from "react";
import { cardById, type CardId, type TarotCard } from "@/lib/cards";

/**
 * 카드 12장 커스텀 SVG 아트.
 * 이모지 대신 카드마다 고유한 그림을 그린다. 카드의 hue 그라디언트를 배경으로 쓰고
 * 금색 테두리·별빛은 StageScene, AboutArt와 같은 톤으로 맞췄다.
 *
 * flipped = 커튼콜 뒤 "뒤집힌 면". 같은 그림에 조명만 바꾼다 —
 * 무대와 같은 철학: 장면은 그대로, 보는 눈이 달라진다.
 */

const GOLD = "#e3c07a";
export const CARD_W = 120;
export const CARD_H = 180;

type Palette = {
  ink: string;   // 그림의 주 색
  soft: string;  // 보조 색
  glow: string;  // 빛
  shade: string; // 그림자·구멍
  label: string; // 이름 글자
  sub: string;   // 키워드 글자
};

const UP: Palette = { ink: "#fdf6ea", soft: "#c9b6e8", glow: GOLD, shade: "#120c22", label: "#fdf6ea", sub: "#d9c9ee" };
const FLIP: Palette = { ink: "#3b2a1a", soft: "#a77d3c", glow: "#d0742a", shade: "#efe1c8", label: "#2c2113", sub: "#6b5636" };

const STARS: [number, number, number][] = [
  [18, 22, 1.4], [98, 18, 1.1], [30, 44, 0.9], [104, 48, 1.3], [16, 100, 1.0], [102, 118, 0.9],
];

/* ── 모티프 12개 ─────────────────────────────────────── */
function Motif({ id, p, bg }: { id: CardId; p: Palette; bg: string }) {
  switch (id) {
    case "tower":
      return (
        <g>
          <path d="M28 142 Q60 126 92 142 V152 H28 Z" fill={p.soft} opacity="0.55" />
          <path d="M46 132 H74 L71 124 H49 Z" fill={p.ink} opacity="0.75" />
          <rect x="49" y="62" width="22" height="64" fill={p.ink} />
          {[72, 88, 104].map((y) => <rect key={y} x="57" y={y} width="6" height="8" rx="1" fill={p.shade} opacity="0.7" />)}
          <g transform="rotate(22 74 54)">
            <rect x="50" y="44" width="22" height="16" rx="1" fill={p.ink} />
            <path d="M50 44 L61 34 L72 44 Z" fill={p.ink} />
          </g>
          <path d="M84 16 L68 42 L78 42 L62 70" stroke={p.glow} strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M60 126 L57 110 L63 98 L59 84" stroke={p.shade} strokeWidth="1.6" fill="none" opacity="0.8" />
        </g>
      );
    case "moon":
      return (
        <g>
          <ellipse cx="60" cy="108" rx="40" ry="6" fill={p.soft} opacity="0.18" />
          <ellipse cx="60" cy="118" rx="30" ry="4" fill={p.soft} opacity="0.12" />
          <circle cx="58" cy="66" r="26" fill={p.ink} />
          <circle cx="70" cy="58" r="24" fill={bg} />
          <circle cx="70" cy="58" r="24" fill={p.shade} opacity="0.35" />
          {[[24, 130], [40, 136], [56, 132], [72, 138], [88, 132]].map(([x, y], i) => (
            <path key={i} d={`M${x - 8} ${y} Q${x} ${y - 4} ${x + 8} ${y}`} stroke={p.ink} strokeWidth="1.3" fill="none" opacity="0.5" />
          ))}
          <ellipse cx="44" cy="96" rx="26" ry="5" fill={p.ink} opacity="0.12" />
        </g>
      );
    case "sun":
      return (
        <g>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const long = i % 2 === 0;
            const r1 = 30, r2 = long ? 44 : 38;
            return (
              <line key={i} x1={60 + Math.cos(a) * r1} y1={68 + Math.sin(a) * r1}
                x2={60 + Math.cos(a) * r2} y2={68 + Math.sin(a) * r2}
                stroke={p.glow} strokeWidth={long ? 2.4 : 1.6} strokeLinecap="round" />
            );
          })}
          <circle cx="60" cy="68" r="24" fill={p.glow} />
          <circle cx="60" cy="68" r="17" fill={p.ink} opacity="0.55" />
          <rect x="6" y="118" width="108" height="56" fill={p.soft} opacity="0.35" />
          <path d="M6 118 H114" stroke={p.ink} strokeWidth="1.2" opacity="0.6" />
          {[126, 134, 142].map((y, i) => (
            <line key={y} x1={60 - 18 + i * 6} y1={y} x2={60 + 18 - i * 6} y2={y} stroke={p.glow} strokeWidth="1.6" opacity={0.6 - i * 0.15} strokeLinecap="round" />
          ))}
        </g>
      );
    case "justice":
      return (
        <g>
          <rect x="44" y="126" width="32" height="6" rx="2" fill={p.ink} />
          <rect x="58" y="42" width="4" height="86" rx="2" fill={p.ink} />
          <g transform="rotate(-7 60 56)">
            <rect x="26" y="54" width="68" height="3.5" rx="1.75" fill={p.ink} />
            <line x1="30" y1="57" x2="24" y2="86" stroke={p.soft} strokeWidth="1.2" />
            <line x1="30" y1="57" x2="38" y2="86" stroke={p.soft} strokeWidth="1.2" />
            <path d="M18 86 Q31 100 44 86 Z" fill={p.glow} />
            <line x1="90" y1="57" x2="82" y2="80" stroke={p.soft} strokeWidth="1.2" />
            <line x1="90" y1="57" x2="98" y2="80" stroke={p.soft} strokeWidth="1.2" />
            <path d="M76 80 Q89 94 102 80 Z" fill={p.glow} />
          </g>
          <circle cx="60" cy="44" r="4" fill={p.glow} />
        </g>
      );
    case "mirror":
      return (
        <g>
          <ellipse cx="60" cy="78" rx="30" ry="40" fill={p.glow} opacity="0.9" />
          <ellipse cx="60" cy="78" rx="25" ry="35" fill={p.soft} opacity="0.45" />
          <ellipse cx="60" cy="78" rx="25" ry="35" fill={bg} opacity="0.5" />
          <path d="M44 56 Q40 80 48 104" stroke={p.ink} strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
          {/* 비친 얼굴 — 실제보다 조금 흐리게 */}
          <circle cx="62" cy="72" r="9" fill={p.ink} opacity="0.85" />
          <path d="M50 102 Q62 84 74 102 Z" fill={p.ink} opacity="0.85" />
          <rect x="52" y="118" width="16" height="12" fill={p.glow} />
          <rect x="44" y="130" width="32" height="5" rx="2" fill={p.glow} />
        </g>
      );
    case "chain":
      return (
        <g>
          {[42, 66, 90, 114].map((y, i) => (
            <ellipse key={y} cx={i % 2 ? 66 : 54} cy={y} rx="9" ry="13" fill="none" stroke={p.ink} strokeWidth="4"
              strokeDasharray={i === 2 ? "56 12" : undefined} transform={i === 2 ? `rotate(24 66 ${y})` : undefined} />
          ))}
          <path d="M40 30 H80" stroke={p.soft} strokeWidth="3" strokeLinecap="round" />
          <circle cx="76" cy="122" r="2.5" fill={p.glow} />
        </g>
      );
    case "wave":
      return (
        <g>
          <rect x="6" y="112" width="108" height="62" fill={p.soft} opacity="0.32" />
          {/* 왼쪽에서 밀려와 오른쪽에서 말리는 큰 파도 */}
          <path d="M6 120 C 28 120 48 104 60 78 C 68 60 88 54 98 66 C 106 76 98 92 88 88 C 94 82 94 72 86 70 C 78 68 74 78 80 86 C 88 96 100 104 114 120 Z" fill={p.ink} />
          <path d="M6 120 C 30 118 50 110 66 98 C 80 88 96 100 114 120 Z" fill={p.soft} opacity="0.55" />
          {[[104, 56], [112, 66], [96, 48], [108, 46], [90, 40]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill={p.ink} opacity="0.9" />
          ))}
          {[136, 148].map((y, i) => (
            <path key={y} d={`M14 ${y} Q30 ${y - 6} 46 ${y} T78 ${y} T110 ${y}`} stroke={p.ink} strokeWidth="1.2" fill="none" opacity={0.45 - i * 0.15} />
          ))}
        </g>
      );
    case "door":
      return (
        <g>
          <rect x="34" y="34" width="52" height="102" rx="3" fill={p.shade} opacity="0.85" />
          <path d="M72 42 L104 34 L104 142 L72 132 Z" fill={p.glow} opacity="0.32" />
          <path d="M72 42 L92 38 L92 138 L72 132 Z" fill={p.glow} opacity="0.32" />
          <path d="M38 38 L70 44 L70 132 L38 138 Z" fill={p.ink} />
          <path d="M38 38 L70 44 L70 132 L38 138 Z" fill={p.soft} opacity="0.25" />
          <rect x="44" y="52" width="18" height="30" rx="1.5" fill={p.shade} opacity="0.25" />
          <circle cx="64" cy="90" r="2.4" fill={p.glow} />
          <rect x="30" y="136" width="60" height="4" rx="2" fill={p.soft} opacity="0.6" />
        </g>
      );
    case "mask":
      return (
        <g>
          {/* 뒤에 있는 맨얼굴 */}
          <circle cx="48" cy="66" r="18" fill={p.soft} opacity="0.4" />
          <path d="M24 110 Q48 88 72 110 Z" fill={p.soft} opacity="0.3" />
          {/* 가면 */}
          <g transform="translate(8 6)">
            <path d="M40 48 Q60 38 80 48 Q84 76 60 92 Q36 76 40 48 Z" fill={p.ink} />
            <path d="M47 60 Q52 55 58 60 Q52 64 47 60 Z" fill={p.shade} />
            <path d="M62 60 Q67 55 73 60 Q67 64 62 60 Z" fill={p.shade} />
            <path d="M50 76 Q60 84 70 76" stroke={p.shade} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M40 48 Q60 40 80 48" stroke={p.glow} strokeWidth="1.6" fill="none" />
          </g>
          <line x1="84" y1="94" x2="96" y2="132" stroke={p.glow} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "seed":
      return (
        <g>
          <rect x="6" y="104" width="108" height="70" fill={p.soft} opacity="0.3" />
          <path d="M6 104 H114" stroke={p.ink} strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="60" cy="114" rx="8" ry="10" fill={p.ink} />
          <path d="M60 124 Q56 138 46 148 M60 124 Q64 140 74 150 M60 124 Q60 140 58 156" stroke={p.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M60 104 Q58 88 60 72" stroke={p.glow} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M60 84 Q46 82 42 70 Q56 68 60 84 Z" fill={p.glow} />
          <path d="M60 76 Q74 72 78 60 Q64 60 60 76 Z" fill={p.glow} opacity="0.85" />
        </g>
      );
    case "web":
      return (
        <g>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return <line key={i} x1="60" y1="74" x2={60 + Math.cos(a) * 52} y2={74 + Math.sin(a) * 52} stroke={p.ink} strokeWidth="1.1" opacity="0.75" />;
          })}
          {[12, 24, 36, 48].map((r) => {
            const pts = Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              return `${60 + Math.cos(a) * r},${74 + Math.sin(a) * r}`;
            });
            return <polygon key={r} points={pts.join(" ")} fill="none" stroke={p.ink} strokeWidth="1" opacity="0.6" />;
          })}
          {/* 끼인 자리 — 매듭 */}
          <circle cx="60" cy="74" r="4" fill={p.glow} />
          <circle cx="82" cy="52" r="2.2" fill={p.soft} />
          <circle cx="40" cy="98" r="2.2" fill={p.soft} />
        </g>
      );
    case "star":
    default: {
      const star = Array.from({ length: 10 }).map((_, i) => {
        const r = i % 2 === 0 ? 22 : 9;
        const a = (-90 + i * 36) * (Math.PI / 180);
        return `${60 + Math.cos(a) * r},${56 + Math.sin(a) * r}`;
      });
      return (
        <g>
          <circle cx="60" cy="56" r="30" fill={p.glow} opacity="0.12" />
          <polygon points={star.join(" ")} fill={p.glow} />
          <path d="M60 78 L60 120" stroke={p.glow} strokeWidth="1.2" strokeDasharray="2 4" opacity="0.7" />
          {/* 올려다보는 작은 사람 */}
          <ellipse cx="60" cy="150" rx="14" ry="3" fill={p.shade} opacity="0.5" />
          <path d="M50 148 L53 124 Q60 120 67 124 L70 148 Z" fill={p.ink} />
          <circle cx="60" cy="116" r="8" fill={p.ink} />
        </g>
      );
    }
  }
}

/* ── 카드 한 장 (독립 svg) ───────────────────────────── */
export function CardArt({
  card, cardId, flipped = false, width = CARD_W, className, label = true, animate = false, style,
}: {
  card?: TarotCard; cardId?: CardId;
  flipped?: boolean; width?: number; className?: string;
  /** 하단 이름·키워드 표시 */
  label?: boolean;
  /** 별빛 깜빡임 */
  animate?: boolean;
  style?: React.CSSProperties;
}) {
  const c = card ?? cardById(cardId ?? "star");
  const uid = useId().replace(/:/g, "");
  const bgId = `cbg-${uid}`;
  const p = flipped ? FLIP : UP;
  const height = (width * CARD_H) / CARD_W;
  const name = flipped ? c.flip.name : c.name;
  const sub = flipped ? c.flip.emoji + " 뒤집힌 면" : c.keyword;

  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} width={width} height={height} className={className} style={style}
      role="img" aria-label={`${name} 카드`}>
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="0.4" y2="1">
          {flipped ? (
            <>
              <stop offset="0%" stopColor="#fdf6ea" />
              <stop offset="100%" stopColor="#e9d6b3" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor={c.hue[1]} />
              <stop offset="100%" stopColor={c.hue[0]} />
            </>
          )}
        </linearGradient>
      </defs>
      <rect width={CARD_W} height={CARD_H} rx="10" fill={`url(#${bgId})`} />
      <rect x="4.5" y="4.5" width={CARD_W - 9} height={CARD_H - 9} rx="7" fill="none" stroke={GOLD} strokeWidth="1.4" opacity={flipped ? 0.9 : 0.75} />
      {!flipped && STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity="0.55">
          {animate && <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2.4 + i * 0.4}s`} repeatCount="indefinite" />}
        </circle>
      ))}
      {flipped && <circle cx="60" cy="150" r="70" fill={FLIP.glow} opacity="0.12" />}
      <Motif id={c.id} p={p} bg={`url(#${bgId})`} />
      {label && (
        <>
          <rect x="10" y={CARD_H - 40} width={CARD_W - 20} height="0.8" fill={GOLD} opacity="0.5" />
          <text x="60" y={CARD_H - 23} fontSize="12" fontWeight="800" textAnchor="middle" fill={p.label}>{name}</text>
          <text x="60" y={CARD_H - 11} fontSize="7" textAnchor="middle" fill={p.sub} letterSpacing="0.4">{sub}</text>
        </>
      )}
    </svg>
  );
}

/* ── 카드 뒷면 ───────────────────────────────────────── */
export function CardBack({ width = 62, className }: { width?: number; className?: string }) {
  const height = (width * CARD_H) / CARD_W;
  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} width={width} height={height} className={className} aria-hidden>
      <rect width={CARD_W} height={CARD_H} rx="10" fill="#1a1230" />
      <rect x="4.5" y="4.5" width={CARD_W - 9} height={CARD_H - 9} rx="7" fill="none" stroke={GOLD} strokeWidth="1.4" opacity="0.8" />
      <rect x="12" y="12" width={CARD_W - 24} height={CARD_H - 24} rx="4" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.45" />
      <polygon points="60,50 82,90 60,130 38,90" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.7" />
      <polygon points="60,66 72,90 60,114 48,90" fill={GOLD} opacity="0.25" />
      <text x="60" y="97" fontSize="22" textAnchor="middle" fill={GOLD}>✦</text>
      {[[24, 30], [96, 30], [24, 150], [96, 150]].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize="9" textAnchor="middle" fill={GOLD} opacity="0.6">✦</text>
      ))}
    </svg>
  );
}

/* ── 다른 svg 안에 끼워 넣는 용도 (StageScene 부유 카드) ── */
export function CardArtEmbed({
  cardId, flipped, x, y, width,
}: { cardId: CardId; flipped?: boolean; x: number; y: number; width: number }) {
  const height = (width * CARD_H) / CARD_W;
  return (
    <svg x={x} y={y} width={width} height={height} viewBox={`0 0 ${CARD_W} ${CARD_H}`} overflow="visible">
      <CardArt cardId={cardId} flipped={flipped} width={CARD_W} label={false} />
    </svg>
  );
}
