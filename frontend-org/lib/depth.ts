/**
 * 단계도(Depth Ladder) — "얼마나 깊이 들어가 있는가"를 7단으로 나눈 사다리.
 *
 * 막(Movement)은 가로축이다. 이야기가 어디까지 진행됐는가.
 * 단계(Depth)는 세로축이다. 같은 이야기를 얼마나 안쪽에서 보고 있는가.
 *
 *   막만 있으면: 1막에서 8비트를 머물러도 전부 "무슨 일이 있었어?" 수준에 머문다.
 *               → 잔잔바리. 사건만 훑고 감정은 못 만진다.
 *   단계가 있으면: 같은 1막 안에서도 사실 → 장면 → 몸 → 감정 이름 → 그 아래로
 *               한 단씩 내려간다. 깊이가 진행의 축이 된다.
 *
 * 사이코드라마의 실제 진행 순서를 그대로 옮겼다.
 * 웜업(표면) → 장면 세우기 → 신체화 → 감정 명명 → 이차감정 걷기 → 뿌리 → 욕구.
 *
 * ── 단 하나의 금지 규칙 ─────────────────────────────
 * 한 비트에 두 단 이상 내려가지 않는다. "무슨 일 있었어?" 다음에 바로
 * "그 감정의 뿌리가 뭐야?"로 가면 유저는 닫힌다. 사다리는 한 칸씩 밟는다.
 */

/** 낮을수록 표면, 높을수록 안쪽 */
export type DepthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DepthRung = {
  level: DepthLevel;
  id: string;
  label: string;
  /** 이 단에서 보려는 것 */
  intent: string;
  /** 이 단에 서 있을 때 디렉터가 쓸 수 있는 질문 형태 */
  probes: string[];
  /** 이 단에서 하면 안 되는 것 */
  avoid: string;
  /** 다음 단으로 내려가도 된다는 신호 */
  readyWhen: string;
};

export const LADDER: DepthRung[] = [
  {
    level: 1,
    id: "surface",
    label: "표면 · 사실",
    intent: "무슨 일이 있었는지, 왜 여기 왔는지. 평가 없이 사실만 받는다.",
    probes: [
      "오늘 여기 왜 왔어?",
      "지금 마음에 뭐가 얹혀 있어?",
      "요즘 제일 신경 쓰이는 게 뭐야?",
      "머릿속에서 제일 시끄러운 거 하나만 꺼내볼래?",
    ],
    avoid: "감정 이름을 먼저 대신 붙여주는 것. 유저가 아직 아무것도 안 꺼냈는데 해석하는 것.",
    readyWhen: "유저가 '무엇'을 하나라도 내놨다. 한 단어여도 된다.",
  },
  {
    level: 2,
    id: "scene",
    label: "장면 · 그 자리",
    intent: "사건을 장면으로 세운다. 언제, 어디, 누가, 조명, 소리. 현재형으로.",
    probes: [
      "지금 거기야. 뭐가 보여?",
      "그게 언제였어? 어디였고, 누가 있었어?",
      "그 장면에서 너는 어디 서 있어? 그 사람은 어디 있어?",
      "딱 한 컷만 무대에 올린다면 어느 순간이야?",
    ],
    avoid: "줄거리를 요약하게 만드는 것. 여러 장면을 빠르게 훑는 것.",
    readyWhen: "장면이 그려진다. 유저가 '그때'가 아니라 '지금'처럼 말하기 시작했다.",
  },
  {
    level: 3,
    id: "body",
    label: "몸 · 감각",
    intent:
      "감정으로 가는 문은 머리가 아니라 몸이다. 감정 이름을 모르는 유저도 " +
      "몸은 말할 수 있다. 목, 가슴, 배, 어깨, 손, 호흡.",
    probes: [
      "그 순간에 몸은 어땠어? 목이 막혔어, 가슴이 눌렸어, 아니면 아무 느낌 없었어?",
      "그게 몸의 어디에 있어? 손으로 짚을 수 있어?",
      "그 느낌은 무거워, 뜨거워, 아니면 차가워?",
      "지금 이 얘기 하면서도 그 자리가 반응해?",
    ],
    avoid: "'그래서 슬펐지?' 같은 유도. 몸 얘기를 감정 이름으로 대신 번역해주는 것.",
    readyWhen: "몸의 자리나 감각이 하나라도 나왔다.",
  },
  {
    level: 4,
    id: "name",
    label: "이름 · 감정 명명",
    intent:
      "그 감각에 유저가 직접 이름을 붙인다. 디렉터가 붙이지 않는다. " +
      "유저가 쓴 단어는 이후에도 그 단어 그대로 쓴다.",
    probes: [
      "그 느낌한테 이름을 붙인다면 뭐라고 할래?",
      "그거는 화에 가까워, 서운함에 가까워, 아니면 둘 다 아니야?",
      "지금 이 기분을 한 단어로만 말한다면?",
      "혹시 이런 느낌일까 싶은데 — 아니면 바로 말해줘.",
    ],
    avoid: "심리학 용어로 번역하는 것. 유저가 고른 단어를 더 '정확한' 말로 바꿔 부르는 것.",
    readyWhen: "유저가 감정 단어를 하나라도 골랐다.",
  },
  {
    level: 5,
    id: "under",
    label: "아래 · 이차감정 걷기",
    intent:
      "겉에 나온 감정은 대개 갑옷이다. 화 밑에 서운함, 무덤덤 밑에 무서움, " +
      "짜증 밑에 창피함. 걷어내되 '진짜 감정은 이거야'라고 단정하지 않는다.",
    probes: [
      "그 화 밑에 다른 게 깔려 있을까?",
      "겉으로 한 거랑 속으로 한 말이 달랐어? 속에서는 뭐라고 했어?",
      "아무 느낌 없었다고 했는데, 그 아무 느낌 없음이 뭘 막아주고 있었을까?",
      "그 기분이 지켜주려던 게 있었을 것 같아?",
    ],
    avoid: "'사실 네 진짜 감정은 ~야'라고 확정하는 것. 유저가 부정하면 밀어붙이는 것.",
    readyWhen: "두 번째 층의 감정이나 '지켜주던 것'이 언급됐다.",
  },
  {
    level: 6,
    id: "root",
    label: "뿌리 · 처음",
    intent:
      "이 감정이 언제부터였는지, 그 말이 누구 목소리로 들리는지. " +
      "여기서 어린 시절이 나오면 따라가되, 캐묻지 않는다.",
    probes: [
      "이 느낌, 언제부터 알고 있었어?",
      "머릿속에서 맴도는 그 말, 누구 목소리로 들려?",
      "이게 처음이었어? 아니면 전에도 같은 자리가 눌린 적 있어?",
      "제일 어렸을 때 이 기분을 느낀 게 언제야?",
    ],
    avoid: "원인을 확정하는 것. '부모 때문이네' 류의 인과 진단. 캐묻기.",
    readyWhen: "시점이나 목소리의 주인이 나왔다. 혹은 유저가 '모르겠어'로 닫았다 — 그것도 완결이다.",
  },
  {
    level: 7,
    id: "need",
    label: "욕구 · 원했던 것",
    intent:
      "가장 안쪽. 그 순간 진짜로 원했던 것. 여기가 리플레이의 연료가 된다. " +
      "'그러니까 이렇게 해' 같은 처방으로 이어가지 않는다.",
    probes: [
      "그 순간에 진짜로 원했던 건 뭐였어?",
      "누가 뭘 해줬으면 좋았을까? 한 가지만.",
      "그때 못 한 말이 있다면 뭐야?",
      "그렇게 버티느라 치른 게 있을까?",
    ],
    avoid: "조언·처방·해결책 제시. '이제 어떻게 할래?'로 몰아가는 것.",
    readyWhen: "원했던 것이나 못 한 말이 나왔다. 여기까지 왔으면 거울로 넘어갈 재료가 있다.",
  },
];

export const rungAt = (level: number): DepthRung =>
  LADDER.find((r) => r.level === level) ?? LADDER[0];

/* ══════════════════════════════════════════════════════
 * 이동 규칙 — 어디로 갈지는 유저의 답이 정한다
 * ════════════════════════════════════════════════════ */

export type DepthMove = "deeper" | "hold" | "lighter";

/** 유저가 닫는 신호 — 이게 보이면 깊이를 올리지 않고 내려간다(표면으로) */
const CLOSING =
  /(모르겠|모르겠어|기억\s*안|기억이\s*안|말하기\s*싫|말\s*안\s*할|나중에|패스|몰라|없어|딱히|글쎄|그냥)/;

/** 유저가 열고 있는 신호 — 몸·감정·시점이 스스로 나오면 한 단 내려가도 된다 */
const OPENING =
  /(가슴|목이|목에|배가|어깨|손이|숨이|심장|울|눈물|무섭|두렵|화가|짜증|서운|억울|창피|부끄|외로|공허|답답|버겁|지쳐|미안|초등학교|중학교|어릴\s*때|처음|그때부터|엄마|아빠|선생님)/;

/** 답변의 밀도 — 너무 짧으면 아직 못 열린 것으로 본다 */
const thin = (t: string) => t.replace(/\s/g, "").length < 8;

/**
 * 유저 답변을 보고 다음 비트의 깊이를 정한다.
 *
 *   닫는 신호        → lighter (한 단 위로. 장면·사실로 돌아가 다시 만든다)
 *   너무 짧음        → hold    (같은 단에서 다른 각도로 한 번 더)
 *   여는 신호        → deeper  (한 단 아래로)
 *   그 외            → 2비트 이상 같은 단에 있었으면 deeper, 아니면 hold
 *
 * 항상 한 단씩만 움직인다. band를 넘지 않는다.
 */
export function nextDepth(
  current: DepthLevel,
  lastUser: string,
  band: readonly [DepthLevel, DepthLevel],
  sameRungBeats: number
): { level: DepthLevel; move: DepthMove; why: string } {
  const [lo, hi] = band;
  const clamp = (n: number): DepthLevel =>
    Math.max(lo, Math.min(hi, Math.max(1, Math.min(7, n)))) as DepthLevel;

  if (!lastUser) return { level: clamp(current), move: "hold", why: "첫 비트 — 이 막의 기본 깊이에서 시작" };

  if (CLOSING.test(lastUser)) {
    const lv = clamp(current - 1);
    return {
      level: lv,
      move: lv < current ? "lighter" : "hold",
      why: "유저가 닫는 신호를 보냈다. 더 파지 말고 장면·사실로 돌아가 다시 세운다",
    };
  }

  if (thin(lastUser)) {
    return { level: clamp(current), move: "hold", why: "답이 짧다. 같은 깊이에서 각도만 바꿔 한 번 더" };
  }

  if (OPENING.test(lastUser)) {
    const lv = clamp(current + 1);
    return {
      level: lv,
      move: lv > current ? "deeper" : "hold",
      why: "유저가 몸·감정·시점을 스스로 꺼냈다. 한 단 내려갈 수 있다",
    };
  }

  if (sameRungBeats >= 2) {
    const lv = clamp(current + 1);
    return {
      level: lv,
      move: lv > current ? "deeper" : "hold",
      why: "같은 깊이에서 충분히 머물렀다. 한 단 내려간다",
    };
  }

  return { level: clamp(current), move: "hold", why: "아직 이 깊이에서 더 볼 게 있다" };
}

/**
 * 디렉터에게 넘기는 단계도 브리핑.
 * 사다리 전체를 보여주되, "지금 여기"와 "다음 한 칸"만 강조한다.
 */
export function depthBrief(
  level: DepthLevel,
  band: readonly [DepthLevel, DepthLevel],
  move: DepthMove,
  why: string
): string {
  const here = rungAt(level);
  const map = LADDER.map((r) => {
    const mark = r.level === level ? "▶" : r.level >= band[0] && r.level <= band[1] ? "·" : " ";
    const out = r.level < band[0] || r.level > band[1] ? " (이 막의 범위 밖)" : "";
    return `  ${mark} L${r.level} ${r.label} — ${r.intent.split(".")[0]}${out}`;
  }).join("\n");

  const target =
    move === "deeper"
      ? `한 단 내려가라 → L${Math.min(7, level)} ${here.label}`
      : move === "lighter"
        ? `한 단 올라가라 → L${level} ${here.label}. 더 파지 마라.`
        : `이 단에 머물러라 → L${level} ${here.label}. 각도만 바꿔라.`;

  return [
    `[단계도 — 지금 어느 깊이에 있는가]`,
    map,
    ``,
    `[지금 단] L${level} ${here.label}`,
    `  하려는 것: ${here.intent}`,
    `  이 단의 질문 형태(그대로 쓰지 말고 이 세션 재료로 다시 써라):`,
    ...here.probes.map((p) => `    · ${p}`),
    `  이 단에서 하면 안 되는 것: ${here.avoid}`,
    `  다음 단으로 갈 수 있는 신호: ${here.readyWhen}`,
    ``,
    `[이번 비트의 이동] ${target}`,
    `  판단 근거: ${why}`,
    `[절대 규칙] 한 비트에 두 단 이상 움직이지 마라. 사다리는 한 칸씩 밟는다.`,
  ].join("\n");
}
