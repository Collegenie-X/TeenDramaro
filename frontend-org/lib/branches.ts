import type { Branch, SceneState, SessionState } from "./types";
import type { Step } from "./flow";
import { cardById } from "./cards";
import { 랑, 야아, 은는, 을를, 이가 } from "./josa";

/**
 * 재도전 분기 — 본편과 같은 Step 스크립트로 구성한다.
 * turn은 스크립트 안에서의 순번이고, advanceTo는 쓰지 않는다.
 */

const base: SceneState = {
  backdrop: "stage", light: 3, mood: "think", mask: 0.5, chain: 0,
  other: false, card: "face",
};
const sc = (p: Partial<SceneState>): SceneState => ({ ...base, ...p });

const me = (s: SessionState) => s.character.name || "주인공";
const you = (s: SessionState) => s.other.name || "그 사람";
const ba = (s: SessionState, k: string) => s.branchAnswers[k] ?? "";

/* ══════════════════════════════════════════════════════
 * 분기 A — 다른 대사로 리플레이 (3턴)
 * ════════════════════════════════════════════════════ */
const LINES: Step[] = [
  {
    turn: 1, act: "act4", kind: "ask", advanceTo: 1, bkey: "lines.say",
    lines: (s) => [
      "좋아, 한 번 더 무대 올린다.",
      `${이가(you(s))} 또 똑같은 말을 해. 이번엔 아까랑 완전히 다른 버전으로 가보자.`,
      "솔직하게 터뜨려도 되고, 아예 자리를 떠도 돼.",
    ],
    otherLine: (s) => s.other.trigger,
    placeholder: "이번엔 뭐라고 할래?",
    hints: (s) => [
      "이번엔 참지 않는다면 제일 먼저 뭐가 나올 것 같아?",
      "그 말을 하고 나면 어떤 기분일 것 같아? 후련할까, 무서울까?",
      `${이가(me(s))} 평소엔 절대 못 할 말도 여기선 해도 돼. 여긴 무대니까.`,
    ],
    scene: () => sc({ backdrop: "hallway", light: 3, mood: "shout", other: true, caption: "세 번째 테이크" }),
    emotion: "😤",
  },
  {
    turn: 2, act: "act4", kind: "beat", advanceTo: 2, ai: "compare",
    aiInput: (s) => ba(s, "lines.say"),
    lines: () => ["이번 대사에는 어떻게 반응하는지 보자."],
    scene: () => sc({ backdrop: "hallway", light: 4, mood: "warm", mask: 0, other: true }),
  },
  {
    turn: 3, act: "act4", kind: "beat", advanceTo: 3,
    lines: (s) => [
      `똑같은 장면인데 ${은는(me(s))} 세 가지 버전을 다 해봤어.`,
      "어느 게 정답이라서가 아니라, 셋 다 네가 할 수 있는 선택이라서 해본 거야.",
    ],
    compare: (s) => ({
      first: s.firstResponse,
      replay: ba(s, "lines.say"),
      labels: ["처음에 한 말", "세 번째 버전"],
    }),
    scene: () => sc({ backdrop: "stage", light: 4, mood: "warm", mask: 0, card: "flipped", caption: "세 개의 테이크" }),
    emotion: "🎬",
  },
];

/* ══════════════════════════════════════════════════════
 * 분기 B — 역할 교체 (6턴)
 * 유저가 갈등 상대 역을 맡고, 디렉터가 주인공 역을 맡는다.
 * ════════════════════════════════════════════════════ */
const SWAP: Step[] = [
  {
    turn: 1, act: "act3", kind: "ask", advanceTo: 1, bkey: "swap.day",
    lines: (s) => [
      "무대 조명 내려간다. 자리 바꿀게.",
      `이제 네가 ${you(s)} 역이야. 나는 ${을를(me(s))} 맡을게.`,
      `먼저 ${you(s)} 얘기부터 하자. 그날 ${은는(you(s))} 어떤 하루였을 것 같아?`,
      "좋게 포장 안 해도 돼. 별일 없었을 수도 있고.",
    ],
    placeholder: (s) => `${you(s)}의 그날`,
    aiNote: (s) => `역할 교체 중. 유저가 지금 ${you(s)}(갈등 상대) 역을 맡고 있고, 디렉터가 ${me(s)} 역이다. 유저의 말은 ${you(s)}의 입장에서 쓴 것이다.`,
    hints: (s) => [
      `그날 ${you(s)}한테도 무슨 일이 있었을까? 아니면 아무 일 없었을까?`,
      `${you(s)} 자리에 서보니까 지금 기분이 어때? 불편해도 괜찮아.`,
      "모르겠으면 「모르겠어」라고 써도 돼. 그것도 진짜 답이야.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 2, mood: "flat", mask: 0, other: true, swapped: true, card: "none", caption: `${you(s)}의 자리에서` }),
    emotion: "👀",
  },
  {
    turn: 2, act: "act3", kind: "beat", advanceTo: 2,
    lines: (s) => [
      `그럼 그날 장면으로 다시 들어갈게. ${you(s)} 역은 너고, ${은는(me(s))} 내가 해.`,
      `${이가(you(s))} 밥 먹자고 한 직후야.`,
    ],
    otherLine: (s) => s.firstResponse || "(아무 말 없이 폰만 본다)",
    speaker: (s) => me(s),
    scene: (s) => sc({ backdrop: "hallway", light: 3, mood: "flat", mask: 1, other: true, swapped: true, card: "none", caption: `${은는(me(s))} 그렇게 반응했다` }),
  },
  {
    turn: 3, act: "act3", kind: "ask", advanceTo: 3, bkey: "swap.see", ai: "deepen",
    lines: (s) => [
      `${야아(you(s))}. 지금 ${이가(me(s))} 저러고 있어.`,
      `${you(s)} 눈에 ${은는(me(s))} 어떻게 보여?`,
      "솔직하게. 짜증났으면 짜증났다고 해도 돼.",
    ],
    placeholder: (s) => `${you(s)} 눈에 보인 것`,
    aiNote: (s) => `역할 교체 중. 유저가 ${you(s)} 역이고, 방금 쓴 말은 "${you(s)}의 눈에 ${이가(me(s))} 어떻게 보였는가"다. ${me(s)}의 감정이 아니라 ${이가(you(s))} 읽은 인상을 다뤄라. ${을를(you(s))} 나쁜 사람으로 몰지 마라.`,
    hints: (s) => [
      `${you(s)} 눈에는 그게 거절로 보였을까, 아니면 그냥 조용한 걸로 보였을까?`,
      `${은는(you(s))} 그때 무슨 기분이었을 것 같아?`,
      `${이가(me(s))} 속으로 무슨 생각인지 ${은는(you(s))} 몰랐다는 것도 답이야.`,
    ],
    scene: (s) => sc({ backdrop: "mirror", light: 3, mood: "think", mask: 0, other: true, swapped: true, card: "none", caption: `${you(s)}의 시점` }),
  },
  {
    turn: 4, act: "act3", kind: "ask", advanceTo: 4, bkey: "swap.say",
    lines: (s) => [
      `${이가(you(s))} 그때 진짜로 하고 싶었던 말이 있었을까?`,
      `${you(s)} 역으로 ${me(s)}한테 직접 말해줘.`,
      "없었을 것 같으면 「없어」라고 해도 돼.",
    ],
    placeholder: (s) => `${이가(you(s))} 하고 싶었던 말`,
    hints: (s) => [
      `${you(s)}도 뭔가 묻고 싶은 게 있었을까? 뭐가 제일 궁금했을까.`,
      `${이가(you(s))} 그 말을 못 한 이유가 있었다면 뭐였을까?`,
      "아무 말도 안 하고 싶었을 수도 있어. 그대로 써줘.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 3, mood: "warm", mask: 0, other: true, swapped: true, card: "none", caption: `${이가(you(s))} 꺼내지 못한 말` }),
    emotion: "💬",
  },
  {
    turn: 5, act: "act3", kind: "ask", advanceTo: 5, bkey: "swap.back",
    lines: (s) => [
      "자, 조명 한 번 더. 자리 돌아간다.",
      `다시 ${야아(me(s))}.`,
      `방금 ${이가(you(s))} 한 말을 ${이가(me(s))} 들었어. 뭐라고 답할래?`,
    ],
    otherLine: (s) => ba(s, "swap.say") || "…(아무 말 없다)",
    placeholder: (s) => `${me(s)}의 대답`,
    hints: (s) => [
      `${이가(you(s))} 몰랐다는 걸 알고 나니까 지금 마음이 어때?`,
      "아까 삼켰던 말 중에 지금은 나올 것 같은 게 있어?",
      "여전히 아무 말 안 하고 싶으면 그렇게 써도 괜찮아.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 4, mood: "think", mask: 0.5, other: true, card: "face", caption: `${me(s)}의 자리로 돌아왔다` }),
  },
  {
    turn: 6, act: "act3", kind: "beat", advanceTo: 6,
    lines: (s) => [
      `${you(s)} 자리에 서보니까 보이는 게 좀 달랐지.`,
      `${이가(you(s))} 나빴다는 것도, ${이가(me(s))} 잘못했다는 것도 아니야. 서로 몰랐던 거야.`,
    ],
    compare: (s) => ({
      first: s.coreFeeling || s.firstResponse,
      replay: ba(s, "swap.see"),
      labels: [`${이가(me(s))} 느낀 것`, `${you(s)} 눈에 보인 것`],
    }),
    scene: () => sc({ backdrop: "stage", light: 4, mood: "warm", mask: 0, card: "flipped", caption: "두 사람의 시점" }),
    emotion: "🤝",
  },
];

/* ══════════════════════════════════════════════════════
 * 분기 C — 시간 이동 (5턴)
 * 1년 뒤로 가서 미래의 자기 자신을 만난다.
 * ════════════════════════════════════════════════════ */
const FUTURE: Step[] = [
  {
    turn: 1, act: "act4", kind: "ask", advanceTo: 1, bkey: "future.where",
    lines: (s) => [
      "조명 바꿀게. 1년 뒤로 간다.",
      `계절 한 바퀴 돌았어. ${은는(me(s))} 지금 어디 있어?`,
      "좋아졌다고 안 써도 돼. 그냥 떠오르는 장면으로.",
    ],
    placeholder: "1년 뒤, 어디에 있어?",
    hints: (s) => [
      "그 장면에서 지금 뭐가 제일 먼저 보여? 창, 사람, 아니면 소리?",
      "1년 뒤 거기 있는 기분은 어때? 지금보다 가벼워, 비슷해?",
      `1년 뒤에도 비슷할 것 같으면 그렇게 써줘. ${me(s)} 얘기니까.`,
    ],
    scene: () => sc({ backdrop: "sky", light: 3, mood: "think", mask: 0.5, card: "none", caption: "1년 뒤" }),
    emotion: "🌤️",
  },
  {
    turn: 2, act: "act4", kind: "ask", advanceTo: 2, bkey: "future.who", ai: "deepen",
    aiNote: (s) => `시간 이동 중. 지금은 1년 뒤 장면이고, 유저가 1년 뒤 ${me(s)}의 상황을 쓰고 있다. 과거형으로 되돌리지 말고 1년 뒤 시점으로 읽어라.`,
    lines: (s) => [
      `거기 ${me(s)} 옆에 누가 있어?`,
      "아무도 없어도 괜찮아. 그것도 하나의 1년 뒤야.",
      `${이가(you(s))} 아직 있을 수도 있고, 아예 다른 애일 수도 있어.`,
    ],
    placeholder: "옆에 누가 있어?",
    hints: (s) => [
      "옆에 있는 사람이랑 있을 때 숨이 편해? 아니면 여전히 좀 조여?",
      `${랑(you(s))}은 어떻게 됐을까? 그대로일 수도 있어.`,
      "「혼자」라고 써도 돼. 1년 전이랑 같은 혼자는 아닐 수도 있으니까.",
    ],
    scene: () => sc({ backdrop: "school", light: 3, mood: "flat", mask: 0.5, other: true, card: "none", caption: "1년 뒤의 옆자리" }),
  },
  {
    turn: 3, act: "act4", kind: "ask", advanceTo: 3, bkey: "future.diff",
    lines: (s) => [
      `1년 전 ${랑(me(s))} 지금 ${me(s)}, 딱 하나 달라진 게 있다면 뭐야?`,
      "아주 작은 거여도 돼. 안 달라졌으면 안 달라졌다고 해도 되고.",
    ],
    placeholder: "달라진 것 한 가지",
    hints: () => [
      "지금은 못 하는데 1년 뒤엔 할 수 있을 것 같은 게 뭐야?",
      "달라진 게 사람일 수도, 습관일 수도, 몸의 느낌일 수도 있어.",
      "「똑같아」도 괜찮아. 그럼 그 얘기를 해보자.",
    ],
    scene: () => sc({ backdrop: "sky", light: 4, mood: "warm", mask: 0, card: "face", caption: "달라진 한 가지" }),
    emotion: "🌱",
  },
  {
    turn: 4, act: "act4", kind: "ask", advanceTo: 4, bkey: "future.letter",
    lines: (s) => [
      `이제 제일 중요한 거.`,
      `1년 뒤의 ${이가(me(s))}, 지금 울고 있는 ${me(s)}한테 한마디 한다면 뭐라고 할까?`,
      "위로 안 해도 돼. 1년 뒤의 네가 할 법한 말로.",
    ],
    placeholder: "1년 뒤의 내가 지금의 나에게",
    hints: (s) => [
      `지금의 ${이가(me(s))} 제일 듣고 싶은 말이 뭘까?`,
      "그때 아무도 안 해준 말이 있어? 그 말을 네가 해줄 수 있어.",
      "짧을수록 좋아. 한 문장이면 충분해.",
    ],
    scene: () => sc({ backdrop: "mirror", light: 4, mood: "warm", mask: 0, card: "flipped", caption: "1년 뒤의 나와 지금의 나" }),
    emotion: "✉️",
  },
  {
    turn: 5, act: "act4", kind: "beat", advanceTo: 5,
    aiInput: (s) => ba(s, "future.letter"),
    aiNote: (s) => `시간 이동 중. 방금 쓴 말은 "1년 뒤의 ${이가(me(s))} 지금의 ${me(s)}에게 건넨 한마디"다. 이 말을 유저 자신이 이미 알고 있던 것으로 되돌려 읽어줘라. 조언하지 마라.`,
    lines: (s) => {
      const c = s.cardId ? cardById(s.cardId) : null;
      return [
        `지금 그 말, 1년 뒤의 ${이가(me(s))} 한 게 아니야. 네가 한 거야.`,
        `이미 알고 있었다는 뜻이야.`,
        c ? `${c.flip.emoji} ${c.flip.name}. 1년 걸릴 일도 아닐지 몰라.` : "",
      ].filter(Boolean);
    },
    otherLine: (s) => ba(s, "future.letter"),
    speaker: (s) => `1년 뒤의 ${me(s)}`,
    compare: (s) => ({
      first: s.coreFeeling,
      replay: ba(s, "future.letter"),
      labels: ["그때 속으로 한 말", "1년 뒤가 건넨 말"],
    }),
    scene: () => sc({ backdrop: "sky", light: 4, mood: "warm", mask: 0, card: "flipped", caption: "두 개의 시간이 만났다" }),
    emotion: "⭐",
  },
];

export const BRANCH_SCRIPTS: Record<Exclude<Branch, "newcard">, { label: string; steps: Step[] }> = {
  lines: { label: "다른 대사로 리플레이", steps: LINES },
  swap: { label: "역할 교체", steps: SWAP },
  future: { label: "시간 이동", steps: FUTURE },
};
