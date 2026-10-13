import type { Act, SceneState, SessionState } from "./types";
import { cardById } from "./cards";
import { 은는, 을를, 이가 } from "./josa";

export type StepKind =
  /** 디렉터가 묻고 유저가 주관식으로 답한다 */
  | "ask"
  /** 카드 뽑기 인터랙션 */
  | "draw"
  /** 디렉터/보조자아가 말하고 유저는 "계속"만 누른다 */
  | "beat"
  /** 커튼콜 */
  | "curtain";

export type Step = {
  turn: number;
  act: Act;
  kind: StepKind;
  /** 이 스텝이 끝나면 turn이 여기까지 진행된다 (기획서의 "유저 답변 턴" 흡수) */
  advanceTo: number;
  /** 디렉터 대사 — 여러 줄이면 말풍선 여러 개 */
  lines: (s: SessionState) => string[];
  /** 보조자아 대사 */
  otherLine?: (s: SessionState) => string;
  placeholder?: string | ((s: SessionState) => string);
  /** 주관식 입력을 어디에 저장할지 */
  field?: keyof Pick<SessionState, "firstResponse" | "replayResponse" | "coreFeeling"> | "characterName" | "characterProfile" | "otherName" | "otherTrigger";
  /** AI 확장 종류 */
  ai?: "inference" | "deepen" | "mirror" | "correct" | "compare" | "curtain";
  /** 힌트 3종 */
  hints?: (s: SessionState) => string[];
  scene: (s: SessionState) => SceneState;
  /** 이 턴에서 감정 흐름 이모지를 추가 */
  emotion?: string;
  /** 확인 분기 — [수락, 되돌리기]. 되돌리면 직전 ask 턴을 다시 한다 */
  confirm?: [string, string];
  /** confirm의 되돌리기가 돌아갈 턴 */
  backTo?: number;

  /* ── 분기 스크립트에서만 쓰는 필드 ─────────────────── */
  /** 주관식 답을 session.branchAnswers[bkey]에 저장한다 */
  bkey?: string;
  /** ai 호출에 넣을 입력을 직접 고른다 (기본: 방금 쓴 말) */
  aiInput?: (s: SessionState) => string;
  /** 지금 누가 누구를 보고 있는지 — AI 디렉터에게 시점을 알려준다 */
  aiNote?: (s: SessionState) => string;
  /** 보조자아 말풍선에 띄울 이름 (기본: 갈등 상대) */
  speaker?: (s: SessionState) => string;
  /** 나란히 비교 블록 */
  compare?: (s: SessionState) => { first: string; replay: string; labels?: [string, string] };
};

const base: SceneState = {
  backdrop: "curtain", light: 1, mood: "flat", mask: 1, chain: 0,
  other: false, card: "none",
};
const sc = (p: Partial<SceneState>): SceneState => ({ ...base, ...p });

const kw = (s: SessionState) => (s.cardId ? cardById(s.cardId) : null);

export const STEPS: Step[] = [
  {
    turn: 1, act: "entry", kind: "ask", advanceTo: 1, field: "characterName",
    lines: () => [
      "여기는 마음무대야. 오늘은 네가 작가고, 나는 연출을 맡을게.",
      "무대에 설 캐릭터에게 이름을 하나 줘봐. 진짜 이름 말고 가상의 이름으로.",
    ],
    placeholder: "예: 소라",
    hints: () => [
      "어떤 이름을 부르면 마음이 조금 편해질 것 같아?",
      "지금 네 기분이랑 닮은 단어가 있어? 계절이든 색이든 소리든.",
      "안 떠오르면 아무거나 적어도 돼. 마음에 안 들면 나중에 바꾸자.",
    ],
    scene: () => sc({ backdrop: "curtain", light: 1, card: "none" }),
  },
  {
    turn: 2, act: "entry", kind: "ask", advanceTo: 2, field: "characterProfile",
    lines: (s) => [
      `${s.character.name}. 좋은 이름이야.`,
      `${은는(s.character.name)} 몇 살이야? 학교는 다니고 있어?`,
      "너랑 같아도 되고, 완전히 달라도 돼.",
    ],
    placeholder: "예: 고1이고 여자야",
    hints: (s) => [
      `사람들은 ${을를(s.character.name)} 보면 뭐라고 할 것 같아?`,
      "너랑 닮은 데가 있어? 달랐으면 하는 데는?",
      "쓰고 싶은 만큼만 써. 한 단어여도 되고, 안 정해도 돼.",
    ],
    scene: () => sc({ backdrop: "stage", light: 2, mood: "flat" }),
  },
  {
    turn: 3, act: "entry", kind: "draw", advanceTo: 3,
    lines: (s) => [
      `${이가(s.character.name)} 무대에 올랐어. 조명 들어간다.`,
      "카드를 한 장 뽑아볼게. 네가 고르는 게 아니라 뽑히는 거야.",
    ],
    scene: () => sc({ backdrop: "stage", light: 2, card: "back" }),
  },
  {
    turn: 4, act: "act1", kind: "ask", advanceTo: 5, field: "firstResponse",
    lines: (s) => {
      const c = kw(s)!;
      return [
        `${c.emoji} ${c.name} — ${c.keyword}.`,
        `이 카드 보고 떠오르는 거 있어? ${s.character.name}에게 어떤 일이 있었어?`,
        "한 줄이어도 괜찮아. 정리 안 된 채로 그냥 던져도 돼.",
      ];
    },
    placeholder: `무슨 일이 있었는지 편하게 적어줘`,
    hints: (s) => {
      const c = kw(s)!;
      return [
        `${c.emoji} ${c.cardHint}`,
        "그 일을 떠올리면 제일 먼저 오는 게 장면이야, 말이야, 아니면 느낌이야?",
        "언제였는지, 누가 있었는지부터 적어도 돼. 순서 안 맞아도 내가 읽을게.",
      ];
    },
    scene: (s) => sc({ backdrop: "stage", light: 2, card: "face", caption: `${kw(s)?.name} 카드가 열렸다` }),
    emotion: "😶",
  },
  {
    turn: 6, act: "act1", kind: "beat", advanceTo: 6, ai: "inference", confirm: ["맞아, 그런 느낌이야", "조금 달라"], backTo: 4,
    lines: () => ["잠깐만. 네가 한 말 안에서 내가 뭘 읽었는지 보여줄게.", "아니면 바로 말해줘. 내가 틀린 거니까."],
    scene: (s) => sc({
      backdrop: "split", light: 2, card: "face",
      split: ["밖에서의 " + s.character.name, "혼자일 때"],
      caption: "같은 사람, 두 개의 화면",
    }),
  },
  {
    turn: 7, act: "act1", kind: "ask", advanceTo: 7, field: "coreFeeling", ai: "deepen",
    lines: (s) => [
      `그럼 하나만 더 물어볼게. 왜 그래? 뭐가 ${을를(s.character.name)} 그렇게 만들어?`,
      "모르겠으면 모르겠다고 해도 돼. 그것도 답이야.",
    ],
    placeholder: "왜 그런 것 같아?",
    hints: (s) => [
      "그 순간 몸은 어땠어? 목이 막혔어, 가슴이 눌렸어, 아니면 아무 느낌 없었어?",
      "그게 처음이었어? 아니면 전에도 비슷한 적 있었어?",
      `모르겠으면 「모르겠어」도 답이야. 이유를 억지로 만들지 않아도 돼.`,
    ],
    scene: () => sc({ backdrop: "room", light: 1, mood: "tear", mask: 0.5, caption: "문을 닫은 뒤의 얼굴" }),
    emotion: "😢",
  },
  {
    turn: 8, act: "act2", kind: "ask", advanceTo: 8, field: "otherName", ai: "deepen",
    lines: (s) => [
      "여기서 한 사람을 무대로 불러올게.",
      `${s.character.name} 주변에, 겉으로는 친한데 마주치면 마음이 복잡해지는 사람 있어? 이름을 지어줘.`,
    ],
    placeholder: "예: 유나",
    hints: () => [
      "누가 떠올랐을 때 몸이 먼저 굳었어? 그럼 오늘은 다른 사람으로 해도 돼.",
      "사람이 아니어도 돼. 단톡방, 성적표, 집 현관 같은 것도 상대가 될 수 있어.",
      "지금은 꺼내고 싶지 않으면 「없어」라고 적어줘. 다른 길로 갈게.",
    ],
    scene: () => sc({ backdrop: "hallway", light: 2, mood: "flat", mask: 1, caption: "복도, 누군가 걸어온다" }),
  },
  {
    turn: 9, act: "act2", kind: "ask", advanceTo: 9, field: "otherTrigger",
    lines: (s) => [
      `${s.other.name}. 알겠어.`,
      `${이가(s.other.name)} 뭐라고 할 때 제일 힘들어? 그 말 그대로 적어줘.`,
    ],
    placeholder: "예: 다른 애들이랑 밥 먹자~ 할 때",
    hints: () => [
      "그 말이 나올 때 주변은 어땠어? 어디였고, 누가 옆에 있었어?",
      "말이 아니라 표정이나 침묵이었을 수도 있어. 뭐가 제일 크게 남았어?",
      "그대로 옮기기 힘들면 비슷하게만 적어도 돼.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 2, mood: "flat", mask: 1, other: true, caption: `${이가(s.other.name)} 다가온다` }),
  },
  {
    turn: 10, act: "act2", kind: "beat", advanceTo: 10,
    lines: () => ["그럼 내가 그 역을 해볼게. 무대 올라간다."],
    otherLine: (s) => s.other.trigger,
    scene: (s) => sc({ backdrop: "hallway", light: 3, mood: "flat", mask: 1, other: true, caption: `${s.other.name}의 대사` }),
  },
  {
    turn: 11, act: "act2", kind: "ask", advanceTo: 11, field: "firstResponse",
    lines: (s) => [
      `지금 ${은는(s.character.name)} 뭐라고 해? 아니면 아무 말 안 해?`,
      "멋있는 대답 말고, 진짜로 했을 법한 걸로.",
    ],
    placeholder: "예: 아무 말 안 해. 폰 봄",
    hints: () => [
      "그때 몸은 뭘 했어? 손, 눈, 발 — 말보다 몸이 먼저 답할 때가 많아.",
      "하고 싶었던 거랑 실제로 한 게 달랐어?",
      "아무것도 안 한 것도 답이야. 잘한 대답 아니어도 그대로 적어줘.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 3, mood: "flat", mask: 1, other: true, caption: `${s.character.name}의 차례` }),
  },
  {
    turn: 12, act: "act2", kind: "ask", advanceTo: 13, field: "coreFeeling", ai: "inference",
    lines: (s) => [
      `${은는(s.character.name)} 그렇게 했어. 근데 겉이랑 속이 같지는 않았을 거야.`,
      "그때 머릿속에서 뭔 말이 맴돌았어?",
      "아무한테도 안 한 말, 여기서는 해도 돼.",
    ],
    placeholder: "머릿속에 맴돈 말",
    hints: () => [
      "그 말이 누구 목소리로 들려? 네 목소리야, 아니면 누가 하던 말이야?",
      "그 말이 맴돈 게 처음이었어? 언제부터 그랬을까.",
      "문장 안 돼도 돼. 단어 하나여도 돼. 쓰기 싫으면 넘겨도 되고.",
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 1, mood: "flat", mask: 1, other: true, chain: 1, caption: "밖은 조용하고, 안은 시끄럽다" }),
    emotion: "🥀",
  },
  {
    turn: 14, act: "act3", kind: "beat", advanceTo: 14, ai: "mirror",
    lines: () => ["이제 무대에서 한 발 내려와서, 밖에서 이 이야기를 볼 차례야.", "네 말로 만든 이야기를 내가 다시 읽어줄게."],
    scene: (s) => sc({ backdrop: "mirror", light: 2, mood: "think", mask: 0.5, card: "face", caption: `거울 앞의 ${s.character.name}` }),
    emotion: "🤔",
  },
  {
    turn: 15, act: "act3", kind: "ask", advanceTo: 15, field: "coreFeeling",
    lines: () => [
      "이 이야기 어때? 맞는 부분, 아닌 부분 말해줘.",
      "내가 틀렸으면 고쳐줘. 네 이야기니까 네 말이 맞아.",
    ],
    placeholder: "맞는 부분 / 아닌 부분",
    hints: () => [
      "읽으면서 어디서 걸렸어? 걸린 데가 제일 중요한 데야.",
      "내가 너무 세게 말한 데 있어? 아니면 너무 약하게 말한 데?",
      "다 맞으면 「맞아」 한마디면 돼.",
    ],
    scene: () => sc({ backdrop: "mirror", light: 3, mood: "think", mask: 0.5, card: "face" }),
  },
  {
    turn: 16, act: "act3", kind: "beat", advanceTo: 16, ai: "correct", confirm: ["이제 맞아", "한 번 더 고칠게"], backTo: 15,
    lines: () => ["고쳐줘서 고마워. 다시 정리해볼게."],
    scene: () => sc({ backdrop: "mirror", light: 3, mood: "think", mask: 0.5, card: "face", caption: "초점이 맞는다" }),
  },
  {
    turn: 17, act: "act4", kind: "ask", advanceTo: 17, field: "replayResponse",
    lines: (s) => [
      "같은 장면으로 한 번만 더 가볼게. 이번엔 다르게 해도 돼.",
      `${이가(s.other.name)} 똑같은 말을 해. 이번에 ${은는(s.character.name)} 뭐라고 할래?`,
      "안 해도 되고, 하다 말아도 돼.",
    ],
    otherLine: (s) => s.other.trigger,
    placeholder: "새로운 대사",
    hints: (s) => [
      "지금 이 자리에서라면 뭐라고 하고 싶어? 그때 못 한 말 그대로.",
      "그 말을 한다고 상상하면 몸이 어때? 두근거려, 무서워, 아니면 좀 시원해?",
      `${이가(s.character.name)} 할 수 있을 만큼만. 하다 마는 것도 연습이야.`,
    ],
    scene: (s) => sc({ backdrop: "hallway", light: 3, mood: "think", mask: 0.5, other: true, caption: "같은 복도, 두 번째 테이크" }),
  },
  {
    turn: 18, act: "act4", kind: "beat", advanceTo: 18, ai: "compare",
    lines: () => ["보조자아 반응 갈게. 그리고 1차랑 나란히 놓고 보자."],
    compare: (s) => ({ first: s.firstResponse, replay: s.replayResponse, labels: ["1차 · 그때", "리플레이 · 다시"] }),
    scene: (s) => sc({ backdrop: "hallway", light: 4, mood: "warm", mask: 0.5, other: true, caption: `${s.other.name}의 반응` }),
    emotion: "😮",
  },
  {
    turn: 19, act: "act4", kind: "beat", advanceTo: 19,
    lines: (s) => {
      const c = kw(s)!;
      return [
        "마지막으로 카드를 뒤집어볼게.",
        `${c.emoji} ${c.name} → ${c.flip.emoji} ${c.flip.name}`,
        c.flip.reading,
      ];
    },
    scene: () => sc({ backdrop: "sky", light: 4, mood: "warm", mask: 0, chain: 0.5, card: "flipped", caption: "카드가 뒤집혔다" }),
    emotion: "😄",
  },
  {
    turn: 20, act: "curtain", kind: "curtain", advanceTo: 20, ai: "curtain",
    lines: (s) => [`${s.character.name}의 이야기, 여기서 막을 내릴게.`],
    scene: (s) => sc({ backdrop: "stage", light: 4, mood: "warm", mask: 0, card: "flipped", caption: `${s.character.name}의 이야기 · 커튼콜` }),
  },
];

export const stepFor = (turn: number): Step =>
  STEPS.find((st) => st.turn === turn) ??
  STEPS.reduce((a, b) => (b.turn <= turn && b.turn > a.turn ? b : a), STEPS[0]);

export const nextTurn = (turn: number): number => {
  const cur = stepFor(turn);
  const after = STEPS.find((st) => st.turn > cur.advanceTo);
  return after ? after.turn : 20;
};

export const actOf = (turn: number): Act => stepFor(turn).act;
