/**
 * 🏠 홈 삽화 — 들어오자마자 막이 열리고, 조명이 돌고, 씬 종이가 떠오른다.
 * 소품(Kid · Curtains · ScenePage …)은 AboutArt 것을 같이 쓴다. 움직임은 globals.css 의 .hm-*
 */
import { C, FONT, Kid, ScenePage, Sky, Twinkle } from "@/components/AboutArt";

/* ══ 히어로 — 막이 걷히는 무대 ═══════════════════════════ */
export function HomeStageArt() {
  const rise: { x: number; t: string; d: number; r: number }[] = [
    { x: 92, t: C.sit, d: 0, r: -10 }, { x: 132, t: C.work, d: 1.7, r: 6 },
    { x: 232, t: C.inner, d: 0.9, r: -6 }, { x: 270, t: C.sit, d: 2.6, r: 9 },
  ];
  return (
    <svg viewBox="0 0 360 230" className="hm-stage" role="img" aria-label="막이 열린 무대 위로 두 갈래 조명이 흔들리고, 가운데 아이 주위로 씬 종이들이 떠오른다" style={{ fontFamily: FONT }}>
      <Sky id="hm-bg" h={230} />
      <defs>
        <linearGradient id="hm-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sit} stopOpacity=".42" /><stop offset="1" stopColor={C.sit} stopOpacity="0" /></linearGradient>
        <linearGradient id="hm-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.inner} stopOpacity=".4" /><stop offset="1" stopColor={C.inner} stopOpacity="0" /></linearGradient>
        <radialGradient id="hm-floor"><stop offset="0" stopColor="#ffe9b8" stopOpacity=".28" /><stop offset="1" stopColor="#ffe9b8" stopOpacity="0" /></radialGradient>
        <linearGradient id="hm-cur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.curtainD} /><stop offset=".5" stopColor={C.curtain} /><stop offset="1" stopColor={C.curtainD} /></linearGradient>
      </defs>
      <Twinkle pts={[[40, 30], [84, 92], [150, 40], [214, 96], [262, 34], [322, 88], [190, 62]]} />

      {/* 흔들리는 두 조명 */}
      <path className="hm-sweep" style={{ transformOrigin: "70px 0px" }} d="M70 0 L20 214 H150Z" fill="url(#hm-gold)" />
      <path className="hm-sweep hm-sweep-r" style={{ transformOrigin: "290px 0px" }} d="M290 0 L210 214 H340Z" fill="url(#hm-blue)" />

      {/* 무대 바닥 */}
      <rect x="0" y="196" width="360" height="34" fill="#140d22" />
      <path d="M0 196 H360" stroke="#3a2a5a" strokeWidth="1.5" />
      <ellipse cx="180" cy="200" rx="110" ry="18" fill="url(#hm-floor)" className="hm-pulse" />

      {/* 떠오르는 씬들 */}
      {rise.map((p, i) => (
        <g key={i} className="hm-rise" style={{ animationDelay: `${p.d}s` }}>
          <ScenePage x={p.x} y={176} s={0.62} tone={p.t} rot={p.r} />
        </g>
      ))}

      {/* 가운데 아이 — 씬 한 장을 들고 */}
      <g className="hm-hop">
        <Kid x={180} y={150} face="😆" arms="up">
          <g className="ab-bob"><ScenePage x={22} y={-14} s={0.7} glow /></g>
        </Kid>
      </g>
      {/* 말풍선 */}
      <g className="hm-bubble">
        <rect x="200" y="86" width="74" height="24" rx="12" fill={C.paper} />
        <path d="M208 108 l-6 9 12-6z" fill={C.paper} />
        <text x="237" y="102" fontSize="10.5" fontWeight="800" fill="#3a2a10" textAnchor="middle">액션! 🎬</text>
      </g>

      {/* 막 — 처음엔 닫혀 있다가 걷힌다 */}
      <g className="hm-cur-l"><path d="M-4 0 H184 Q150 115 178 230 H-4Z" fill="url(#hm-cur)" /><path d="M60 0 Q48 115 62 230M120 0 Q108 115 122 230" stroke="#24102a" strokeWidth="2" opacity=".5" fill="none" /></g>
      <g className="hm-cur-r"><path d="M364 0 H176 Q210 115 182 230 H364Z" fill="url(#hm-cur)" /><path d="M300 0 Q312 115 298 230M240 0 Q252 115 238 230" stroke="#24102a" strokeWidth="2" opacity=".5" fill="none" /></g>
      {/* 걷힌 막 자락 + 위 커튼 */}
      <path d="M0 0 H34 Q20 115 30 230 H0Z" fill={C.curtain} opacity=".9" />
      <path d="M360 0 H326 Q340 115 330 230 H360Z" fill={C.curtain} opacity=".9" />
      <path d="M0 0 H360 V14 Q270 28 180 14 Q90 28 0 14Z" fill={C.curtainD} />

      {/* 전구 간판 */}
      <g transform="translate(180 30)">
        <rect x="-62" y="-11" width="124" height="22" rx="11" fill="#0b0814" stroke={C.sit} strokeWidth="1.2" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={-54 + i * 9.8} cy={i % 2 ? -11 : 11} r="1.8" fill={C.sit} className="hm-bulb" style={{ animationDelay: `${(i % 3) * 0.3}s` }} />
        ))}
        <text y="4" fontSize="10" fontWeight="900" fill={C.sit} textAnchor="middle" letterSpacing="2">MINDSCENE</text>
      </g>
    </svg>
  );
}

/* ══ 두 무대 카드 속 작은 장면 ═══════════════════════════ */
export function TrackArt({ kind }: { kind: "sit" | "inner" }) {
  if (kind === "sit") {
    return (
      <svg viewBox="0 0 160 96" className="hm-track-art" aria-hidden="true" style={{ fontFamily: FONT }}>
        <rect width="160" height="96" fill="#20160a" />
        <path className="hm-sweep" style={{ transformOrigin: "80px 0px" }} d="M80 0 L44 90 H116Z" fill={C.sit} opacity=".22" />
        <ellipse cx="80" cy="88" rx="50" ry="7" fill={C.sit} opacity=".2" />
        <Kid x={66} y={52} s={0.66} face="😏" arms="front">
          <path d="M-15 -19 Q0 -32 15 -19Z" fill="#3b2a5a" />
          <path d="M6 -26 Q22 -46 30 -40 Q18 -34 10 -22" fill={C.sit} />
          <rect x="-10" y="18" width="20" height="14" rx="1.5" fill={C.paper} stroke="#c99a3c" />
        </Kid>
        <Kid x={104} y={58} s={0.56} face="😳" tint="#d6c7b0" />
        <g className="hm-pop"><text x="118" y="24" fontSize="16">💘</text></g>
        <path d="M0 0 H16 Q8 48 14 96 H0Z M160 0 H144 Q152 48 146 96 H160Z" fill={C.curtain} opacity=".85" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 96" className="hm-track-art" aria-hidden="true" style={{ fontFamily: FONT }}>
      <rect width="160" height="96" fill="#0b1622" />
      <circle cx="104" cy="44" r="38" fill={C.inner} opacity=".16" className="hm-pulse" />
      <ellipse cx="104" cy="44" rx="20" ry="28" fill="#132538" stroke="#c9b27a" strokeWidth="2.4" />
      <ellipse cx="104" cy="44" rx="16" ry="24" fill="#1a3048" />
      <g className="hm-breathe"><Kid x={104} y={46} s={0.42} face="🙂" tint={C.inner} dim={0.5} flip /></g>
      <path d="M104 72v10M96 82h16" stroke="#c9b27a" strokeWidth="2.4" strokeLinecap="round" />
      <Kid x={58} y={56} s={0.6} face="🤔" tint="#c9d6e3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${10 + i * 30} 96 v-6 a8 8 0 0 1 16 0 v6`} fill="#0b1522" stroke={C.inner} strokeOpacity=".5" strokeWidth="1.3" />
      ))}
      <g className="hm-pop" style={{ animationDelay: "1.2s" }}><text x="20" y="24" fontSize="14">💭</text></g>
    </svg>
  );
}

/* ══ 내 씬 선반 — 모은 만큼 종이가 꽂힌다 ═════════════════ */
export function ShelfArt({ count }: { count: number }) {
  const slots = 6;
  const tones = [C.sit, C.inner, C.work, C.note, C.sit, C.inner];
  return (
    <svg viewBox="0 0 300 70" className="hm-shelf" aria-hidden="true" style={{ fontFamily: FONT }}>
      <rect x="6" y="58" width="288" height="6" rx="3" fill="#3a2d5a" />
      {Array.from({ length: slots }, (_, i) => {
        const x = 34 + i * 46;
        if (i < count) {
          return (
            <g key={i} className="hm-drop" style={{ animationDelay: `${i * 0.12}s` }}>
              <ScenePage x={x} y={38} s={0.86} tone={tones[i]} rot={(i % 2 ? 4 : -4)} />
            </g>
          );
        }
        return (
          <g key={i} opacity={i === count ? 1 : 0.4} className={i === count ? "hm-pulse" : undefined}>
            <rect x={x - 12} y={22} width="24" height="31" rx="3.5" fill="none" stroke={C.work} strokeDasharray="3 3" />
            {i === count && <text x={x} y="42" fontSize="14" fill={C.work} textAnchor="middle">+</text>}
          </g>
        );
      })}
      {count > slots && <text x="292" y="16" fontSize="10" fill={C.work} textAnchor="end" fontWeight="800">+{count - slots}</text>}
    </svg>
  );
}
