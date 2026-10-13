"use client";

/**
 * 예시 무대 — 상황·대화에 맞춰 움직이는 커스텀 SVG 무대.
 *
 * /play의 StageScene(추상 무드 무대)과 달리, 여기는 장면 그 자체를 그린다:
 * 밤 11시 침대방, 아침 복도, 급식실, 교문 앞, 현관… 그리고 그 안의 인물들.
 * 각 턴의 JSON `scene`이 무대 지시서다 — 배경, 누가 어디 서는지, 표정, 포즈, 소품.
 *
 * 인물 10명은 전부 커스텀 SVG다. 색·머리·소지품으로 구분된다.
 */

import { memo } from "react";

/* ══ 무대 지시서 타입 ═══════════════════════════ */

export type AvatarId =
  | "noeul"      // 🧡 노을 — 주황 후드, 분위기 메이커
  | "jiwoo"      // 💙 지우 — 파란 비니, 제일 친했던 애
  | "haden"      // 💚 해든 — 안경, 초록 가디건, 성실
  | "mom"        // 🤎 엄마 — 앞치마
  | "rin"        // 💜 린 — 보라 긴머리, 사진 찍는 애
  | "jjak"       // 💛 짝꿍 — 노란 머리
  | "chingu"     // 🩷 친구 — 분홍 양갈래, DM 상대
  | "classmate"  // 🩶 반 아이 — 회색 교복
  | "inner"      // 👻 속의 나 — 반투명 분신
  | "director";  // 🎬 디렉터 — 베레모

export type Emo = "calm" | "smile" | "grin" | "sad" | "tear" | "worry" | "shout" | "blank" | "mask";
export type Pose = "stand" | "phone" | "lie" | "turn" | "walk" | "sit";

export type CastSpec = {
  id: AvatarId;
  emo?: Emo;
  pose?: Pose;
  /** 0(왼쪽 끝)~1(오른쪽 끝) */
  x?: number;
  flip?: boolean;
  ghost?: boolean;
};

export type BgId =
  | "curtain" | "room-night" | "hallway" | "classroom" | "cafeteria"
  | "gate" | "entry" | "kitchen" | "chat" | "mirrorroom" | "spotlight";

export type PropId = "phone" | "paper" | "tray" | "card" | "none";

export type StageSpec = {
  bg: BgId;
  cast?: CastSpec[];
  prop?: PropId;
  caption?: string;
  /** 0 어두움 ~ 2 환함 */
  light?: 0 | 1 | 2;
};

/* ══ 인물 ═══════════════════════════════════════ */

type AvatarDef = {
  skin: string; outfit: string; outfit2: string; hair: string;
  hairStyle: "short" | "beanie" | "long" | "bun" | "twin" | "beret" | "crop";
  glasses?: boolean; apron?: boolean;
};

const AVATARS: Record<AvatarId, AvatarDef> = {
  noeul:     { skin: "#f2c9a0", outfit: "#d96b2f", outfit2: "#a84e1d", hair: "#4a2f20", hairStyle: "crop" },
  jiwoo:     { skin: "#edc39b", outfit: "#3a6ea8", outfit2: "#2a5080", hair: "#222a38", hairStyle: "beanie" },
  haden:     { skin: "#f0c8a4", outfit: "#3f7d52", outfit2: "#2d5c3b", hair: "#2e241c", hairStyle: "short", glasses: true },
  mom:       { skin: "#eec2a2", outfit: "#7a5a48", outfit2: "#5d4436", hair: "#3a2a22", hairStyle: "bun", apron: true },
  rin:       { skin: "#f3cdb0", outfit: "#7a4fa8", outfit2: "#5c3a80", hair: "#3c2a4d", hairStyle: "long" },
  jjak:      { skin: "#efc6a0", outfit: "#b89b3a", outfit2: "#8f7729", hair: "#c9a44a", hairStyle: "short" },
  chingu:    { skin: "#f4cfae", outfit: "#c05a84", outfit2: "#97456a", hair: "#55303f", hairStyle: "twin" },
  classmate: { skin: "#e9c09c", outfit: "#5a6472", outfit2: "#434c58", hair: "#2a2e36", hairStyle: "short" },
  inner:     { skin: "#bfb3d9", outfit: "#8d7fb3", outfit2: "#6f639c", hair: "#6a5c8f", hairStyle: "crop" },
  director:  { skin: "#eec4a2", outfit: "#2f3a4d", outfit2: "#222b3a", hair: "#30261e", hairStyle: "beret" },
};

/** 표정 — 눈·입만 바꿔도 사람이 달라 보인다 */
function Face({ emo, skin }: { emo: Emo; skin: string }) {
  const eyes = () => {
    switch (emo) {
      case "blank": return <><line x1={-7} y1={-2} x2={-3} y2={-2} /><line x1={3} y1={-2} x2={7} y2={-2} /></>;
      case "worry": return <><path d="M-8-4 Q-5-6 -2-4" fill="none" /><path d="M2-4 Q5-6 8-4" fill="none" /><circle cx={-5} cy={-1} r={1.6} fill="#2a2024" stroke="none" /><circle cx={5} cy={-1} r={1.6} fill="#2a2024" stroke="none" /></>;
      case "sad": case "tear": return <><path d="M-8-3 Q-5-1 -2-3" fill="none" /><path d="M2-3 Q5-1 8-3" fill="none" /></>;
      case "shout": return <><line x1={-8} y1={-5} x2={-2} y2={-2} /><line x1={8} y1={-5} x2={2} y2={-2} /></>;
      case "smile": case "grin": return <><path d="M-8-2 Q-5-5 -2-2" fill="none" /><path d="M2-2 Q5-5 8-2" fill="none" /></>;
      default: return <><circle cx={-5} cy={-2} r={1.7} fill="#2a2024" stroke="none" /><circle cx={5} cy={-2} r={1.7} fill="#2a2024" stroke="none" /></>;
    }
  };
  const mouth = () => {
    switch (emo) {
      case "smile": return <path d="M-4 5 Q0 8 4 5" fill="none" />;
      case "grin": return <path d="M-5 4 Q0 10 5 4 Z" fill="#8c4a3f" stroke="none" />;
      case "sad": return <path d="M-4 7 Q0 4 4 7" fill="none" />;
      case "tear": return <><path d="M-4 7 Q0 4 4 7" fill="none" /><circle cx={9} cy={4} r={2} fill="#7db7e8" stroke="none" /></>;
      case "worry": return <path d="M-3 6 Q0 5 3 6" fill="none" />;
      case "shout": return <ellipse cx={0} cy={6} rx={3.4} ry={4} fill="#6e3a33" stroke="none" />;
      case "blank": return <line x1={-3} y1={6} x2={3} y2={6} />;
      case "mask": return null;
      default: return <path d="M-3 5.5 Q0 7 3 5.5" fill="none" />;
    }
  };
  return (
    <g stroke="#2a2024" strokeWidth={1.1} strokeLinecap="round">
      <circle cx={0} cy={0} r={13} fill={skin} stroke="none" />
      {emo === "mask" ? (
        <>
          {/* 반쪽 가면 — 겉웃음 */}
          <path d="M0-13 A13 13 0 0 1 0 13 Z" fill="#efe6d8" stroke="#c9b89a" strokeWidth={0.8} />
          <path d="M3-2 Q6-5 9-2" fill="none" />
          <path d="M2 5 Q5.5 8 9 4" fill="none" />
          <path d="M-8-3 Q-5-1 -2-3" fill="none" />
          <path d="M-4 7 Q-1 5 -1 7" fill="none" />
        </>
      ) : (
        <>{eyes()}{mouth()}</>
      )}
    </g>
  );
}

function Hair({ def }: { def: AvatarDef }) {
  const c = def.hair;
  switch (def.hairStyle) {
    case "beanie":
      return <><path d="M-13 -4 A13 13 0 0 1 13 -4 L13 -7 A13 13 0 0 0 -13 -7 Z" fill={c} /><path d="M-13.5 -6 A13.5 13.5 0 0 1 13.5 -6 L12 -10 A12 12 0 0 0 -12 -10 Z" fill="#4a7ec2" /><rect x={-13.5} y={-7.5} width={27} height={3.4} rx={1.7} fill="#5a8ed2" /></>;
    case "long":
      return <><path d="M-13 -5 A13 13 0 0 1 13 -5 L14 14 Q10 16 8 12 L8 -2 Q4 -9 -4 -8 L-8 -3 L-8 12 Q-10 16 -14 14 Z" fill={c} /></>;
    case "bun":
      return <><path d="M-13 -3 A13 13 0 0 1 13 -3 L11 -8 Q4 -12 -6 -10 L-11 -6 Z" fill={c} /><circle cx={10} cy={-11} r={4.5} fill={c} /></>;
    case "twin":
      return <><path d="M-13 -4 A13 13 0 0 1 13 -4 L10 -9 Q0 -13 -10 -9 Z" fill={c} /><circle cx={-14} cy={2} r={4} fill={c} /><circle cx={14} cy={2} r={4} fill={c} /><circle cx={-14} cy={9} r={3.2} fill={c} /><circle cx={14} cy={9} r={3.2} fill={c} /></>;
    case "beret":
      return <><path d="M-13 -4 A13 13 0 0 1 13 -4 L11 -7 Q0 -11 -11 -7 Z" fill={c} /><path d="M-14 -7 Q0 -17 13 -8 Q14 -5 11 -6 Q0 -12 -11 -5 Q-15 -4 -14 -7 Z" fill="#6e3a4a" /></>;
    case "crop":
      return <path d="M-13 -3 A13 13 0 0 1 13 -3 L12 -7 Q6 -11.5 -2 -11 Q-10 -10 -12 -5 Z" fill={c} />;
    default:
      return <path d="M-13 -4 A13 13 0 0 1 13 -4 L11 -8 Q0 -12.5 -11 -8 Z" fill={c} />;
  }
}

/** 인물 한 명 — pose에 따라 몸이 달라진다 */
function Person({ spec, holding }: { spec: CastSpec; holding?: PropId }) {
  const def = AVATARS[spec.id];
  const emo = spec.emo ?? "calm";
  const pose = spec.pose ?? "stand";
  const x = 36 + (spec.x ?? 0.5) * 288;
  const ghost = spec.ghost || spec.id === "inner";

  const body = () => {
    switch (pose) {
      case "sit":
        return <>
          <rect x={-14} y={16} width={28} height={26} rx={9} fill={def.outfit} />
          <rect x={-14} y={36} width={12} height={14} rx={5} fill={def.outfit2} />
          <rect x={2} y={36} width={12} height={14} rx={5} fill={def.outfit2} />
        </>;
      case "walk":
        return <>
          <rect x={-13} y={16} width={26} height={30} rx={10} fill={def.outfit} />
          <rect x={-13} y={42} width={10} height={16} rx={4.5} fill={def.outfit2} transform="rotate(14 -8 42)" />
          <rect x={3} y={42} width={10} height={16} rx={4.5} fill={def.outfit2} transform="rotate(-12 8 42)" />
        </>;
      default:
        return <>
          <rect x={-14} y={16} width={28} height={32} rx={11} fill={def.outfit} />
          <rect x={-12} y={44} width={10} height={14} rx={4.5} fill={def.outfit2} />
          <rect x={2} y={44} width={10} height={14} rx={4.5} fill={def.outfit2} />
        </>;
    }
  };

  const arms = () => {
    if (pose === "phone") {
      return <>
        <rect x={-20} y={19} width={8} height={20} rx={4} fill={def.outfit2} />
        <rect x={9} y={12} width={8} height={18} rx={4} fill={def.outfit2} transform="rotate(-38 13 14)" />
        <g transform="translate(20 6)">
          <rect x={-4} y={-7} width={9} height={15} rx={2} fill="#1b2233" stroke="#39445c" strokeWidth={0.8} />
          <rect x={-2.8} y={-5.5} width={6.6} height={10} rx={1} fill="#9fd0ff" opacity={0.9}>
            <animate attributeName="opacity" values="0.9;0.55;0.9" dur="2.2s" repeatCount="indefinite" />
          </rect>
        </g>
      </>;
    }
    if (pose === "turn") return <rect x={-19} y={19} width={8} height={21} rx={4} fill={def.outfit2} />;
    return <>
      <rect x={-21} y={19} width={8} height={21} rx={4} fill={def.outfit2} />
      <rect x={13} y={19} width={8} height={21} rx={4} fill={def.outfit2} />
    </>;
  };

  const inner = (
    <g opacity={ghost ? 0.55 : 1}>
      {ghost && <ellipse cx={0} cy={60} rx={20} ry={4} fill="#000" opacity={0.18} />}
      {!ghost && <ellipse cx={0} cy={60} rx={21} ry={4.5} fill="#000" opacity={0.3} />}
      {body()}
      {arms()}
      {def.apron && <path d="M-10 20 L10 20 L8 44 L-8 44 Z" fill="#e8ddc8" opacity={0.9} />}
      {holding === "paper" && pose !== "phone" && <rect x={10} y={26} width={13} height={16} rx={1.5} fill="#f2ecd9" stroke="#b9ad90" strokeWidth={0.7} transform="rotate(8 16 34)" />}
      {holding === "tray" && <rect x={-16} y={30} width={32} height={6} rx={2} fill="#cfd6e0" stroke="#9aa3b0" strokeWidth={0.7} />}
      <g transform={pose === "turn" ? "translate(0 2)" : "translate(0 0)"}>
        {pose === "turn" ? (
          <g>
            <circle cx={0} cy={0} r={13} fill={def.skin} />
            <path d="M-13 -4 A13 13 0 0 1 13 -4 L13 8 Q0 13 -13 8 Z" fill={def.hair} />
          </g>
        ) : (
          <>
            <Face emo={emo} skin={def.skin} />
            <Hair def={def} />
            {def.glasses && (
              <g stroke="#30363f" strokeWidth={1.1} fill="none">
                <circle cx={-5} cy={-1.5} r={4.4} /><circle cx={5} cy={-1.5} r={4.4} /><line x1={-0.8} y1={-1.5} x2={0.8} y2={-1.5} />
              </g>
            )}
          </>
        )}
      </g>
    </g>
  );

  if (pose === "lie") {
    return (
      <g transform={`translate(${x} 150) rotate(-90) ${spec.flip ? "scale(-1 1)" : ""}`} style={{ transition: "transform 0.6s ease" }}>
        {inner}
      </g>
    );
  }
  return (
    <g transform={`translate(${x} 108) ${spec.flip ? "scale(-1 1)" : ""}`} style={{ transition: "transform 0.6s ease" }}>
      {inner}
    </g>
  );
}

/* ══ 배경 ═══════════════════════════════════════ */

function Backdrop({ bg, light = 1 }: { bg: BgId; light?: 0 | 1 | 2 }) {
  const dim = light === 0 ? 0.5 : light === 1 ? 0.75 : 1;
  switch (bg) {
    case "room-night":
      return <g opacity={dim}>
        <rect x={0} y={0} width={360} height={200} fill="#131226" />
        <rect x={250} y={22} width={64} height={52} rx={4} fill="#1d2440" stroke="#2e3a63" />
        <circle cx={282} cy={40} r={9} fill="#e8e3c8" opacity={0.85} />
        <line x1={282} y1={22} x2={282} y2={74} stroke="#2e3a63" />
        <line x1={250} y1={48} x2={314} y2={48} stroke="#2e3a63" />
        <rect x={28} y={128} width={150} height={38} rx={8} fill="#2a2342" />
        <rect x={20} y={118} width={30} height={48} rx={6} fill="#342b52" />
        <rect x={36} y={120} width={130} height={12} rx={6} fill="#473a6e" />
      </g>;
    case "hallway":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#2a2d3d" />
        <rect x={0} y={150} width={360} height={50} fill="#383c52" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={18 + i * 42} y={44} width={34} height={92} rx={3} fill="#434963" stroke="#565e7e" strokeWidth={1} />)}
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={46 + i * 42} cy={92} r={2} fill="#7b84a8" />)}
        <rect x={214} y={38} width={120} height={70} rx={4} fill="#9fb4d8" opacity={0.5} />
        <line x1={274} y1={38} x2={274} y2={108} stroke="#565e7e" strokeWidth={2} />
      </g>;
    case "classroom":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#343040" />
        <rect x={0} y={152} width={360} height={48} fill="#4a4050" />
        <rect x={40} y={30} width={180} height={78} rx={4} fill="#2f4a3e" stroke="#5a7262" strokeWidth={2} />
        <line x1={58} y1={52} x2={150} y2={52} stroke="#8aa893" strokeWidth={2} opacity={0.7} />
        <line x1={58} y1={66} x2={120} y2={66} stroke="#8aa893" strokeWidth={2} opacity={0.5} />
        <rect x={250} y={60} width={78} height={48} rx={3} fill="#9fb4d8" opacity={0.45} />
        <rect x={60} y={132} width={70} height={10} rx={2} fill="#6e5a46" />
        <rect x={64} y={142} width={6} height={22} fill="#59483a" /><rect x={120} y={142} width={6} height={22} fill="#59483a" />
      </g>;
    case "cafeteria":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#3b3344" />
        <rect x={0} y={150} width={360} height={50} fill="#4e4257" />
        <rect x={30} y={60} width={300} height={8} fill="#5d4f68" />
        {[0, 1, 2].map((i) => <rect key={i} x={48 + i * 100} y={26} width={64} height={30} rx={4} fill="#55465f" stroke="#6e5c7a" />)}
        <rect x={40} y={130} width={120} height={9} rx={2} fill="#6e5a46" />
        <rect x={46} y={139} width={6} height={24} fill="#59483a" /><rect x={148} y={139} width={6} height={24} fill="#59483a" />
        <rect x={56} y={122} width={26} height={7} rx={1.5} fill="#cfd6e0" /><rect x={96} y={122} width={26} height={7} rx={1.5} fill="#cfd6e0" />
      </g>;
    case "gate":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="url(#sunset)" />
        <circle cx={300} cy={56} r={18} fill="#e8a05a" opacity={0.9} />
        <rect x={34} y={40} width={16} height={128} rx={3} fill="#4a4252" />
        <rect x={310} y={40} width={16} height={128} rx={3} fill="#4a4252" />
        <rect x={34} y={40} width={292} height={10} rx={3} fill="#564d61" />
        <rect x={0} y={160} width={360} height={40} fill="#453c50" />
        <path d="M60 50 L80 50 L80 44 L60 44 Z" fill="#564d61" />
      </g>;
    case "entry":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#241f30" />
        <rect x={236} y={28} width={86} height={140} rx={4} fill="#3a3148" stroke="#4e4260" strokeWidth={2} />
        <circle cx={248} cy={100} r={3} fill="#9b8463" />
        <rect x={0} y={158} width={360} height={42} fill="#352c44" />
        <rect x={40} y={166} width={22} height={9} rx={3} fill="#5a4a3c" /><rect x={68} y={166} width={22} height={9} rx={3} fill="#4a5a6c" />
        <path d="M0 0 L120 0 L80 158 L0 158 Z" fill="#e8c87a" opacity={0.12} />
      </g>;
    case "kitchen":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#2d2838" />
        <rect x={0} y={150} width={360} height={50} fill="#3d3550" />
        <rect x={30} y={96} width={190} height={56} rx={4} fill="#4e4260" />
        <rect x={60} y={88} width={60} height={10} rx={3} fill="#3a4a58" />
        <path d="M86 70 Q90 80 86 88" stroke="#8fb8d8" strokeWidth={2.4} fill="none" opacity={0.9}>
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.6s" repeatCount="indefinite" />
        </path>
        <rect x={250} y={40} width={70} height={46} rx={3} fill="#1d2440" stroke="#2e3a63" />
      </g>;
    case "chat":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#141425" />
        {[
          [52, 44, 64, 20], [150, 26, 80, 22], [258, 52, 68, 20], [96, 78, 74, 20], [216, 96, 62, 18],
        ].map(([x, y, w, h], i) => (
          <g key={i} opacity={0.75}>
            <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="#2a3150" />
            <circle cx={x + 14} cy={y + h / 2} r={2.2} fill="#5c6a9c" /><circle cx={x + 24} cy={y + h / 2} r={2.2} fill="#5c6a9c" /><circle cx={x + 34} cy={y + h / 2} r={2.2} fill="#5c6a9c" />
            <animate attributeName="opacity" values="0.75;0.35;0.75" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          </g>
        ))}
        <path d="M30 150 Q180 110 330 150" stroke="#3a4468" strokeWidth={1.4} fill="none" strokeDasharray="4 5" />
      </g>;
    case "mirrorroom":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#262238" />
        <rect x={0} y={154} width={360} height={46} fill="#332d48" />
        <rect x={236} y={30} width={84} height={120} rx={8} fill="#39334f" stroke="#5c5480" strokeWidth={2.4} />
        <rect x={244} y={38} width={68} height={104} rx={5} fill="#4a4468" opacity={0.9} />
        <line x1={252} y1={46} x2={300} y2={120} stroke="#6e6692" strokeWidth={3} opacity={0.5} />
      </g>;
    case "spotlight":
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#17121f" />
        <path d="M180 0 L116 176 L244 176 Z" fill="#e8d9a8" opacity={0.14} />
        <ellipse cx={180} cy={172} rx={70} ry={12} fill="#e8d9a8" opacity={0.12} />
      </g>;
    default: // curtain
      return <g opacity={dim}>
        <rect width={360} height={200} fill="#1d1428" />
        <path d="M0 0 H360 V200 H330 Q318 100 330 0 Z" fill="#5d2638" />
        <path d="M0 0 H30 Q42 100 30 200 H0 Z" fill="#5d2638" />
        <path d="M30 0 Q60 110 36 200 H74 Q56 100 72 0 Z" fill="#4a1e2d" opacity={0.8} />
        <path d="M330 0 Q300 110 324 200 H286 Q304 100 288 0 Z" fill="#4a1e2d" opacity={0.8} />
        <rect x={0} y={0} width={360} height={14} fill="#3a1722" />
      </g>;
  }
}

/* ══ 무대 ═══════════════════════════════════════ */

function ExampleStageInner({ spec }: { spec: StageSpec }) {
  return (
    <div className="exstage">
      <svg viewBox="0 0 360 200" style={{ display: "block", width: "100%" }} role="img" aria-label={spec.caption ?? "무대"}>
        <defs>
          <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a3550" /><stop offset="60%" stopColor="#8a4a48" /><stop offset="100%" stopColor="#5d3a44" />
          </linearGradient>
        </defs>
        <Backdrop bg={spec.bg} light={spec.light ?? 1} />
        {(spec.cast ?? []).map((c, i) => (
          <Person key={`${c.id}-${i}`} spec={c} holding={spec.prop} />
        ))}
        <rect x={0} y={0} width={360} height={200} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={2} rx={2} />
      </svg>
      {spec.caption && <div className="exstage-cap">🎬 {spec.caption}</div>}
    </div>
  );
}

const ExampleStage = memo(ExampleStageInner);
export default ExampleStage;
