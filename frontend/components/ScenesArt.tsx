/**
 * 🎬 내 씬 화면 삽화 — 빈 선반 무대 · 씬 카드 썸네일.
 * 소품은 AboutArt, 움직임은 globals.css 의 .hm-* / .sc-*
 */
import { C, FONT, Kid, ScenePage, Sky, Twinkle } from "@/components/AboutArt";
import { TrackArt } from "@/components/HomeArt";
import { SitArt } from "@/components/SituationArt";
import { getArchetype } from "@/lib/store";
import type { ScenePiece } from "@/lib/types";

/* ══ 비어 있을 때 — 조명 아래 빈 선반, 첫 씬이 내려오길 기다린다 ══ */
export function EmptyShelfArt() {
  return (
    <svg viewBox="0 0 360 190" className="scene-svg" role="img" aria-label="조명 아래 빈 선반 위로 씬 종이 한 장이 천천히 내려오고, 아이가 올려다본다" style={{ fontFamily: FONT }}>
      <Sky id="sc-empty" h={190} />
      <defs>
        <linearGradient id="sc-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9b8" stopOpacity=".4" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></linearGradient>
      </defs>
      <Twinkle pts={[[34, 26], [92, 60], [270, 30], [322, 70], [200, 22]]} />
      <path className="hm-sweep" style={{ transformOrigin: "180px 0px" }} d="M180 0 L110 170 H250Z" fill="url(#sc-cone)" />
      {/* 선반 — 빈 칸 다섯 */}
      <rect x="70" y="128" width="220" height="7" rx="3.5" fill="#3a2d5a" />
      <path d="M84 135v20M276 135v20" stroke="#3a2d5a" strokeWidth="5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={92 + i * 38} y={92} width="24" height="32" rx="3.5" fill="none" stroke={C.work} strokeOpacity={i === 2 ? 0.9 : 0.35} strokeDasharray="3 3" className={i === 2 ? "hm-pulse" : undefined} />
      ))}
      {/* 내려오는 첫 씬 */}
      <g className="sc-fall"><ScenePage x={180} y={60} s={0.82} glow /></g>
      <Kid x={300} y={122} s={0.62} face="🤩" arms="up" />
      <text x="180" y="178" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={C.work}>첫 씬이 여기 꽂혀</text>
    </svg>
  );
}

/* ══ 🪞 내 장면 띠 — 거울 방. 씬마다 하늘빛 · 표정 · 객석 자리가 조금씩 다르다 ══ */
const SKIES: [string, string][] = [["#0f2032", "#070c14"], ["#2a1d2e", "#120d1e"], ["#1c1638", "#0a0712"], ["#13262a", "#081214"]];
const FACES = ["🙂", "🤔", "😌", "🥲", "😶", "😮"];
function InnerStrip({ seed, avatar }: { seed: number; avatar: boolean }) {
  const [top, bottom] = SKIES[seed % SKIES.length];
  const mx = 200 + (seed % 3) * 34;
  const face = avatar ? "🎭" : FACES[seed % FACES.length];
  const gid = `in${seed}`;
  return (
    <svg viewBox="0 0 320 100" style={{ fontFamily: FONT, display: "block" }}>
      <defs>
        <linearGradient id={`${gid}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
        <radialGradient id={`${gid}-h`}><stop offset="0" stopColor={C.inner} stopOpacity=".4" /><stop offset="1" stopColor={C.inner} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="100" fill={`url(#${gid}-s)`} />
      <Twinkle pts={[[24 + (seed % 5) * 6, 16], [120, 24], [296, 14]]} />
      <circle cx={mx} cy="46" r="44" fill={`url(#${gid}-h)`} className="hm-pulse" />
      <ellipse cx={mx} cy="46" rx="20" ry="28" fill="#132538" stroke="#c9b27a" strokeWidth="2.4" />
      <ellipse cx={mx} cy="46" rx="16" ry="24" fill="#1a3048" />
      <g className="hm-breathe"><Kid x={mx} y={48} s={0.42} face={face} tint={C.inner} dim={0.5} flip /></g>
      <Kid x={mx - 66} y={52} s={0.6} face={face} tint="#c9d6e3" />
      <rect x="0" y="88" width="320" height="12" fill="#0b1522" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${12 + i * 36} 100 v-6 a8 8 0 0 1 16 0 v6`} fill="#0b1522" stroke={C.inner} strokeOpacity={i === seed % 9 ? 0.95 : 0.4} strokeWidth="1.3" />
      ))}
    </svg>
  );
}
const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ══ 씬 카드 위 띠 그림 — 🎞는 그 상황극 장면, 🪞는 거울 방 ══ */
export function PieceThumb({ p }: { p: ScenePiece }) {
  const a = p.source.track === "situation" ? getArchetype(p.source.archetypeId) : undefined;
  return (
    <div className={`sc-thumb ${p.source.track}`} aria-hidden="true">
      {p.source.track === "inner" ? <InnerStrip seed={hash(p.id)} avatar={p.source.avatar} />
        : a ? <SitArt a={a} slug={false} /> : <TrackArt kind="sit" />}
    </div>
  );
}
