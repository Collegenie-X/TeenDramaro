/**
 * 🎭 등장 인물 얼굴 — data/archetypes.json의 look(생김새)으로 그린다.
 * 상황극 삽화(SituationArt)와 같은 톤: 종이색 얼굴 · 낮은 채도 옷 · 무대 조명(--sit) 테두리.
 *
 *   CastFace   동그란 얼굴 한 장 — 나이 · 머리 · 옷 · 소품 · 표정
 *   moodOf     지문(dir)에서 표정 한 가지를 고른다
 *   CastCard   🎭 등장 인물 — 나 / 상대 얼굴 + 상대의 결(persona)
 */
import { useId } from "react";
import type { Character, Look, Scene, Watcher } from "@/lib/types";

const C = { sit: "#ffcf7a", ink: "#f3eff8", skin: "#fdf3e6", line: "#2d2542", gray: "#cfc8d6", cheek: "#f2a7a7", eye: "#2a2233", lip: "#7a3b46" };

export type CastMood = "calm" | "talk" | "soft" | "tense";

const FALLBACK: Look = { age: "teen", hair: "short", shirt: "#e8d9c5" };

/** 장면 속 모든 사람 — 이름 → 생김새 (Feed가 말풍선 옆 얼굴을 고른다) */
export const castLooks = (s: Scene): Record<string, Look | undefined> =>
  Object.fromEntries([s.other, ...(s.others ?? []), ...(s.watchers ?? [])].map((c) => [c.name, c.look]));

/** 지문 → 표정. 없으면 말하는 얼굴 */
export function moodOf(dir?: string): CastMood {
  if (!dir) return "talk";
  if (/웃|토닥|집어 준|미소|끄덕/.test(dir)) return "soft";
  if (/피한|돌린|한숨|팔짱|굳|멈춘|가린|두드린|던지/.test(dir)) return "tense";
  if (/본다|보며|기다린/.test(dir)) return "calm";
  return "talk";
}

function Hair({ look, back }: { look: Look; back?: boolean }) {
  const col = look.hairColor ?? (look.age === "elder" ? C.gray : "#3a2c48");
  if (back) {
    // 얼굴 뒤로 내려오는 머리
    if (look.hair === "long") return <path d="M-13 -6 Q-15 14 -10 20 H10 Q15 14 13 -6Z" fill={col} />;
    if (look.hair === "bob") return <path d="M-13.5 -6 Q-14.5 8 -11 10 H11 Q14.5 8 13.5 -6Z" fill={col} />;
    if (look.hair === "pony") return <path d="M11 -10 Q22 -6 18 10 Q16 2 11 -2Z" fill={col} />;
    if (look.hair === "bun") return <circle cx="0" cy="-18" r="6" fill={col} />;
    return null;
  }
  if (look.hair === "curly")
    return <g fill={col}>{[-10, -5, 0, 5, 10].map((x, i) => <circle key={x} cx={x} cy={-11 - (i % 2) * 2.5} r="5" />)}<circle cx="-12" cy="-5" r="3.5" /><circle cx="12" cy="-5" r="3.5" /></g>;
  // 앞머리 — 공통 뼈대에 가르마만 다르게
  const fringe = look.hair === "short" ? "M-12 -3 Q-13 -16 0 -15.5 Q13 -16 12 -3 Q9 -10 3 -9.5 Q-4 -12 -12 -3Z"
    : look.hair === "bun" ? "M-12 -3 Q-12 -15 0 -14.5 Q12 -15 12 -3 Q7 -10 0 -9.5 Q-7 -10 -12 -3Z"
    : "M-12.5 -1 Q-13 -16 0 -15.5 Q13 -16 12.5 -1 Q10 -9 2 -10 Q-3 -6 -12.5 -1Z";
  return <path d={fringe} fill={col} />;
}

function Acc({ look }: { look: Look }) {
  switch (look.acc) {
    case "glasses": return <g fill="none" stroke="#2a2233" strokeWidth="1.1"><circle cx="-4.6" cy="-1" r="3.4" /><circle cx="4.6" cy="-1" r="3.4" /><path d="M-1.2 -1.2h2.4" /></g>;
    case "earphone": return <g><path d="M-13 0 q-1.5 4 0 7" stroke="#f3eff8" strokeWidth="1.4" fill="none" /><circle cx="-12.6" cy="0" r="2" fill="#f3eff8" /></g>;
    case "cap": return <g><path d="M-12.5 -6 Q-12 -17 0 -17 Q12 -17 12.5 -6Z" fill="#3a7bd5" /><path d="M2 -7 Q12 -9 19 -5 Q12 -4 2 -5Z" fill="#2f5fa8" /></g>;
    case "headband": return <path d="M-12.4 -8 Q0 -16 12.4 -8" stroke={C.sit} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    default: return null;
  }
}

function Body({ look }: { look: Look }) {
  const extra = (() => {
    switch (look.acc) {
      case "cardigan": return <><path d="M-4 15 L-2 30 M4 15 L2 30" stroke="#5a2a24" strokeWidth="1.6" /><circle cx="-3" cy="22" r="1" fill={C.ink} /><circle cx="-2.6" cy="27" r="1" fill={C.ink} /></>;
      case "apron": return <path d="M-8 18 h16 v14 h-16z" fill={C.ink} opacity=".85" />;
      case "whistle": return <><path d="M-6 15 L0 22 L6 15" stroke={C.sit} strokeWidth="1" fill="none" /><rect x="-2.5" y="21" width="5" height="3.6" rx="1.4" fill="#c9cfd6" /></>;
      case "lanyard": return <><path d="M-5 15 L0 23 L5 15" stroke={C.sit} strokeWidth="1" fill="none" /><rect x="-3" y="23" width="6" height="5" rx="1" fill={C.ink} /></>;
      default: return <path d="M-4 15 L0 19 L4 15" stroke="#000" strokeOpacity=".2" strokeWidth="1.2" fill="none" />;
    }
  })();
  return <g><path d="M-20 34 Q-19 17 -6 14 H6 Q19 17 20 34Z" fill={look.shirt} />{extra}</g>;
}

function Face({ look, mood }: { look: Look; mood: CastMood }) {
  const elder = look.age === "elder";
  const eyes = mood === "tense" ? <path d="M-6 -1h3M3 -1h3" stroke={C.eye} strokeWidth="1.4" strokeLinecap="round" />
    : mood === "soft" || elder ? <path d="M-6 -.4q1.5 -1.6 3 0M3 -.4q1.5 -1.6 3 0" stroke={C.eye} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    : <><circle cx="-4.5" cy="-1" r="1.4" fill={C.eye} /><circle cx="4.5" cy="-1" r="1.4" fill={C.eye} /></>;
  const brows = mood === "tense" ? <path d="M-7 -5.5 l3.5 1.2M7 -5.5 l-3.5 1.2" stroke={C.eye} strokeWidth="1.1" strokeLinecap="round" opacity=".7" /> : null;
  const mouth = mood === "talk" ? <ellipse cx="0" cy="5.6" rx="2.2" ry="1.7" fill={C.lip} />
    : mood === "tense" ? <path d="M-2.8 5.6h5.6" stroke={C.lip} strokeWidth="1.3" strokeLinecap="round" />
    : mood === "soft" ? <path d="M-3.2 4.4q3.2 3 6.4 0" stroke={C.lip} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    : <path d="M-2.4 5q2.4 1.6 4.8 0" stroke={C.lip} strokeWidth="1.3" fill="none" strokeLinecap="round" />;
  return (
    <g>
      {eyes}{brows}{mouth}
      <circle cx="-7.5" cy="3.5" r="2" fill={C.cheek} opacity=".5" /><circle cx="7.5" cy="3.5" r="2" fill={C.cheek} opacity=".5" />
      {elder && <g stroke="#c9a88a" strokeWidth=".8" fill="none" strokeLinecap="round"><path d="M-10 -1.5l-1.6 -.8M-10 .5l-1.8 .3M10 -1.5l1.6 -.8M10 .5l1.8 .3" /><path d="M-4.5 8.5q4.5 1.6 9 0" opacity=".6" /></g>}
    </g>
  );
}

export function CastFace({ look, mood = "calm", size = 40, ring = true, title }: { look?: Look; mood?: CastMood; size?: number; ring?: boolean; title?: string }) {
  const l = look ?? FALLBACK;
  const id = `cf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const s = l.age === "adult" ? 1.04 : l.age === "elder" ? 1 : .96;
  return (
    <svg width={size} height={size} viewBox="-26 -26 52 52" className="cast-face" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${id}-bg`} cx=".5" cy=".3" r=".8"><stop offset="0" stopColor="#3a2c48" /><stop offset="1" stopColor="#120e1a" /></radialGradient>
        <clipPath id={`${id}-c`}><circle r="25" /></clipPath>
      </defs>
      <circle r="25" fill={`url(#${id}-bg)`} />
      <g clipPath={`url(#${id}-c)`}>
        <g transform={`translate(0 ${l.age === "teen" ? 2 : 0}) scale(${s})`}>
          <Hair look={l} back />
          <Body look={l} />
          <rect x="-3.5" y="9" width="7" height="6" fill={C.skin} />
          <ellipse cx="0" cy="0" rx="12" ry="12.6" fill={C.skin} />
          <Hair look={l} />
          <Face look={l} mood={mood} />
          <Acc look={l} />
        </g>
      </g>
      {ring && <circle r="24.5" fill="none" stroke={C.sit} strokeOpacity=".55" strokeWidth="1" />}
    </svg>
  );
}

/** 🎭 등장 인물 — 상황 카드 안. 상대의 결은 연기 재료로 펼쳐 둔다 */
export function CastCard({ me, other, others = [], watchers = [] }: { me: Character; other: Character; others?: Character[]; watchers?: Watcher[] }) {
  const p = other.persona;
  const many = others.length > 0;
  return (
    <div className="cast">
      <div className="cast-h">🎭 등장 인물{many ? ` · ${others.length + 1} : 1` : ""}</div>
      <div className="cast-row">
        <div className="cast-who">
          <CastFace look={me.look} mood="calm" size={52} title={`${me.name} 얼굴`} />
          <b>{me.name}</b><small>🙋 네가 맡아</small>
        </div>
        <div className="cast-vs" aria-hidden="true">⋯</div>
        <div className="cast-who">
          <CastFace look={other.look} mood="talk" size={52} title={`${other.name} 얼굴`} />
          <b>{other.name}</b><small>🎭 상대</small>
        </div>
      </div>
      {many && (
        <div className="cast-others">
          {others.map((o) => (
            <div key={o.name} className="cast-other">
              <CastFace look={o.look} mood="talk" size={34} />
              <div><b>{o.name}</b><small>{o.persona?.tag ?? `원하는 것 — ${o.want}`}</small></div>
            </div>
          ))}
        </div>
      )}
      {p && (
        <div className="cast-persona">
          <p className="cast-tag">「{p.tag}」</p>
          <dl className="kv">
            <dt>말투</dt><dd>{p.speech}{other.habit && <> · 「{other.habit}」</>}</dd>
            <dt>몸짓</dt><dd>{p.body.slice(0, 2).join(" · ")}</dd>
            <dt>🫶 풀리는 말</dt><dd>{p.soft}</dd>
            <dt>🥀 서운한 말</dt><dd>{p.sore}</dd>
          </dl>
        </div>
      )}
      {watchers.length > 0 && (
        <div className="cast-watch">
          <div className="cast-h">👀 지켜보는 눈</div>
          {watchers.map((w) => (
            <div key={w.name} className="cast-other">
              <CastFace look={w.look} mood="calm" size={30} ring={false} />
              <div><b>{w.name}</b><small>{w.voice === "inner" ? "🔊 속마음이 들려" : w.at ? `${w.at}에서 보고 있어` : "보고 있어"}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
