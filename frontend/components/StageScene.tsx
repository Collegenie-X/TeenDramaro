"use client";

import { cardById, type CardId } from "@/lib/cards";
import type { SceneState } from "@/lib/types";

const MOOD_FACE: Record<SceneState["mood"], string> = {
  bright: "😊", flat: "😶", tear: "😢", think: "🤔", warm: "😄", shout: "😤",
};

/** 빛 세기 → 무대 밝기 */
const LIGHT = [0.18, 0.32, 0.5, 0.72, 1] as const;

function Figure({
  x, y, s = 1, face, mask = 0, chain = 0, tint = "#e8d9c5", label,
}: {
  x: number; y: number; s?: number; face: string;
  mask?: number; chain?: number; tint?: string; label?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="figure">
      {/* 그림자 */}
      <ellipse cx="0" cy="62" rx="26" ry="6" fill="#000" opacity="0.25" />
      {/* 몸통 */}
      <path d="M-20 62 L-15 10 Q0 2 15 10 L20 62 Z" fill={tint} opacity="0.92" />
      {/* 팔 */}
      <path d="M-16 16 L-26 44" stroke={tint} strokeWidth="6" strokeLinecap="round" opacity="0.92" />
      <path d="M16 16 L26 44" stroke={tint} strokeWidth="6" strokeLinecap="round" opacity="0.92" />
      {/* 머리 */}
      <circle cx="0" cy="-12" r="19" fill="#fdf3e6" />
      <text x="0" y="-4" fontSize="24" textAnchor="middle">{face}</text>
      {/* 가면 — mask 1이면 얼굴 전체, 0.5면 반쪽만 */}
      {mask > 0 && (
        <g opacity={mask === 1 ? 0.95 : 0.85}>
          <clipPath id={`mk-${x}-${y}`}>
            <rect x={mask === 1 ? -20 : -20} y="-32" width={mask === 1 ? 40 : 20} height="40" />
          </clipPath>
          <g clipPath={`url(#mk-${x}-${y})`}>
            <circle cx="0" cy="-12" r="19.5" fill="#f0e2ff" stroke="#b08ce0" strokeWidth="1.5" />
            <text x="0" y="-4" fontSize="22" textAnchor="middle">🎭</text>
          </g>
          {mask === 0.5 && (
            <path d="M0 -32 L0 8" stroke="#b08ce0" strokeWidth="1" strokeDasharray="3 3" />
          )}
        </g>
      )}
      {/* 사슬 */}
      {chain > 0 && (
        <g opacity={chain} stroke="#c9a88a" strokeWidth="2.5" fill="none">
          <path d={chain === 1 ? "M-24 40 Q0 52 24 40" : "M-24 40 Q0 58 24 44"} strokeDasharray="5 4" />
          <circle cx="-24" cy="40" r="3" />
          <circle cx="24" cy={chain === 1 ? 40 : 44} r="3" />
        </g>
      )}
      {label && (
        <text x="0" y="80" fontSize="10" textAnchor="middle" fill="#cfc4dd" letterSpacing="1">
          {label}
        </text>
      )}
    </g>
  );
}

function Backdrop({ kind, hue }: { kind: SceneState["backdrop"]; hue: [string, string] }) {
  switch (kind) {
    case "school":
      return (
        <g>
          <rect x="0" y="120" width="360" height="90" fill="#000" opacity="0.18" />
          {[30, 90, 150, 210, 270].map((x) => (
            <rect key={x} x={x} y="52" width="44" height="34" rx="3" fill="#fff" opacity="0.14" />
          ))}
          <rect x="150" y="96" width="60" height="24" rx="2" fill="#fff" opacity="0.1" />
          <text x="180" y="44" fontSize="13" textAnchor="middle" opacity="0.5">🏫</text>
        </g>
      );
    case "room":
      return (
        <g>
          <rect x="0" y="130" width="360" height="80" fill="#000" opacity="0.3" />
          <rect x="228" y="46" width="70" height="56" rx="4" fill="#fff" opacity="0.1" />
          <path d="M228 74 H298 M263 46 V102" stroke="#fff" strokeOpacity="0.16" />
          <rect x="44" y="118" width="86" height="14" rx="6" fill="#fff" opacity="0.14" />
          <text x="300" y="126" fontSize="13" opacity="0.45">🛏️</text>
        </g>
      );
    case "hallway":
      return (
        <g>
          <path d="M0 210 L110 120 H250 L360 210 Z" fill="#000" opacity="0.22" />
          <path d="M110 120 V210 M250 120 V210" stroke="#fff" strokeOpacity="0.1" />
          <text x="180" y="52" fontSize="13" textAnchor="middle" opacity="0.4">🚪</text>
        </g>
      );
    case "mirror":
      return (
        <g>
          <rect x="96" y="34" width="168" height="152" rx="84" fill="#fff" opacity="0.07" />
          <rect x="96" y="34" width="168" height="152" rx="84" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
          <path d="M120 60 Q150 44 176 46" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" fill="none" />
        </g>
      );
    case "sky":
      return (
        <g>
          {[[40, 40], [92, 68], [148, 34], [214, 58], [276, 38], [320, 76]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.25;0.9;0.25" dur={`${2.4 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <path d="M0 200 Q90 168 180 186 Q270 204 360 176 V210 H0 Z" fill="#000" opacity="0.28" />
        </g>
      );
    case "split":
      return (
        <g>
          <rect x="0" y="0" width="180" height="210" fill={hue[1]} opacity="0.2" />
          <rect x="180" y="0" width="180" height="210" fill="#000" opacity="0.32" />
          <line x1="180" y1="0" x2="180" y2="210" stroke="#fff" strokeOpacity="0.28" strokeDasharray="6 5" />
        </g>
      );
    case "stage":
      return (
        <g>
          <ellipse cx="180" cy="196" rx="132" ry="26" fill="#fff" opacity="0.1" />
          <path d="M132 24 L180 96 L228 24 Z" fill="#fff" opacity="0.07" />
          <text x="180" y="44" fontSize="13" textAnchor="middle" opacity="0.5">🎪</text>
        </g>
      );
    default:
      return null;
  }
}

export default function StageScene({
  scene, cardId, protagonist, antagonist,
}: {
  scene: SceneState;
  cardId: CardId | null;
  protagonist: string;
  antagonist?: string;
}) {
  const hue = cardId ? cardById(cardId).hue : (["#2a2340", "#4b3f6e"] as [string, string]);
  const card = cardId ? cardById(cardId) : null;
  const glow = LIGHT[scene.light];
  const key = `${scene.backdrop}-${scene.light}-${scene.mood}-${scene.mask}-${scene.chain}-${scene.other}-${scene.card}-${scene.swapped ?? false}`;

  return (
    <figure className="scene-wrap">
      <svg viewBox="0 0 360 240" className="scene-svg" role="img"
        aria-label={scene.caption ?? "무대 삽화"}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hue[0]} />
            <stop offset="100%" stopColor={hue[1]} />
          </linearGradient>
          <radialGradient id="spot" cx="50%" cy="72%" r="62%">
            <stop offset="0%" stopColor="#fff6e0" stopOpacity={0.55 * glow} />
            <stop offset="100%" stopColor="#fff6e0" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="360" height="240" fill="url(#sky)" />
        <rect width="360" height="240" fill="#05030c" opacity={0.55 - glow * 0.45} />

        <g key={key} className="scene-layer">
          <Backdrop kind={scene.backdrop} hue={hue} />
          <rect width="360" height="240" fill="url(#spot)" />

          {/* 무대 커튼 — 항상 양옆에 걸려 있다 */}
          <path d="M0 0 H62 Q40 120 58 240 H0 Z" fill="#4a1026" opacity="0.72" />
          <path d="M360 0 H298 Q320 120 302 240 H360 Z" fill="#4a1026" opacity="0.72" />
          {scene.backdrop === "curtain" && (
            <path d="M58 0 H302 Q280 130 302 240 H58 Q80 130 58 0 Z" fill="#5c1430" opacity="0.88" />
          )}

          {/* 분할 화면 라벨 */}
          {scene.split && (
            <>
              <text x="92" y="24" fontSize="10" textAnchor="middle" fill="#fff" opacity="0.7">{scene.split[0]}</text>
              <text x="268" y="24" fontSize="10" textAnchor="middle" fill="#fff" opacity="0.7">{scene.split[1]}</text>
            </>
          )}

          {/* 인물 */}
          {scene.backdrop === "split" ? (
            <>
              <Figure x={92} y={140} s={0.85} face="😊" mask={1} label={protagonist} />
              <Figure x={268} y={140} s={0.85} face="😢" mask={0} tint="#c9b8d6" />
            </>
          ) : scene.backdrop !== "curtain" ? (
            <>
              {/* swapped면 상대가 조명 한가운데에 서고 주인공이 옆으로 물러난다 */}
              <Figure
                x={scene.other ? 130 : 180} y={138}
                face={scene.swapped ? "🙂" : MOOD_FACE[scene.mood]}
                mask={scene.swapped ? 0 : scene.mask}
                chain={scene.swapped ? 0 : scene.chain}
                tint={scene.swapped ? "#b9c6d8" : "#e8d9c5"}
                label={scene.swapped ? (antagonist ?? "상대") : protagonist}
              />
              {scene.other && (
                <Figure
                  x={246} y={140} s={0.9}
                  face={scene.swapped ? MOOD_FACE[scene.mood] : "🙂"}
                  mask={scene.swapped ? scene.mask : 0}
                  tint={scene.swapped ? "#e8d9c5" : "#b9c6d8"}
                  label={scene.swapped ? protagonist : (antagonist ?? "상대")}
                />
              )}
            </>
          ) : null}

          {/* 부유하는 카드 */}
          {scene.card !== "none" && card && (
            <g className="float-card" transform="translate(300 62)">
              <rect x="-22" y="-30" width="44" height="60" rx="6"
                fill={scene.card === "back" ? "#241b38" : "#fdf6ea"}
                stroke="#d9c38e" strokeWidth="1.5" />
              {scene.card === "back" ? (
                <text x="0" y="6" fontSize="18" textAnchor="middle">✦</text>
              ) : (
                <>
                  <text x="0" y="0" fontSize="20" textAnchor="middle">
                    {scene.card === "flipped" ? card.flip.emoji : card.emoji}
                  </text>
                  <text x="0" y="18" fontSize="7" textAnchor="middle" fill="#5a4a2a">
                    {scene.card === "flipped" ? card.flip.name : card.name}
                  </text>
                </>
              )}
            </g>
          )}
        </g>
      </svg>
      {scene.caption && <figcaption className="scene-cap">{scene.caption}</figcaption>}
    </figure>
  );
}
