/**
 * 무대 구조(Stage) — 구조는 "관문"이 아니라 "렌즈"다.
 *
 * 앞선 설계의 문제: 국면마다 채워야 할 필수 슬롯을 두면, 디렉터가 체크리스트를
 * 채우러 다니게 되고 이야기는 다시 한 방향으로 좁아진다.
 *
 * 그래서 여기서는 아무것도 막지 않는다.
 *
 *   막(Movement) = 지금 무대가 대략 어느 깊이에 있는가   ← 구조. 느슨한 안내.
 *   렌즈(Lens)   = 디렉터가 써볼 수 있는 각도들          ← 제안일 뿐. 안 써도 된다.
 *   실마리(Thread) = 유저가 흘렸지만 아직 안 펼친 말      ← 이야기가 자라는 진짜 씨앗.
 *   질문(Beat)   = 그 자리에서 만들어지는 문장           ← 매번 새로. 고정 문구 없음.
 *
 * 흐름을 정하는 건 턴 수도, 슬롯도 아니라 유저다. 유저는 언제든
 * 방향을 바꾸고, 더 깊이 들어가고, 다음 막으로 넘어가고, 자기가 화제를 꺼낼 수 있다.
 * 디렉터는 유저가 방금 쓴 말에서 실마리를 잡아 거기서부터 넓힌다.
 *
 * 그래서 10턴에 끝날 수도, 100턴을 갈 수도 있다. 둘 다 정상이다.
 */

import type { SceneState, SessionState } from "./types";
import { cardById } from "./cards";
import { 이가 } from "./josa";
import { type DepthLevel, type DepthMove, depthBrief, rungAt } from "./depth";

export type MovementId =
  | "casting"   // 무대에 세울 사람을 만든다
  | "draw"      // 카드를 뽑는다 (의식)
  | "open"      // 이야기를 펼친다 — 여기서 얼마든지 오래 머문다
  | "deepen"    // 같은 이야기를 더 안쪽에서 본다
  | "meet"      // 사람과의 장면으로 들어간다
  | "mirror"    // 밖에서 되읽는다 (의식)
  | "replay"    // 다시 해본다 (의식)
  | "curtain";  // 막을 내린다 (의식)

/**
 * 렌즈 — 디렉터가 "이런 각도로도 물어볼 수 있다"는 목록.
 * 반드시 써야 하는 게 아니다. 유저가 이미 다른 데로 가고 있으면 버려도 된다.
 */
export type Lens = {
  id: string;
  /** 이 각도가 무엇을 보려는 것인지 */
  intent: string;
  /** 거울·커튼콜이 쓰는 기존 필드에 값이 잡히면 같이 넣어준다 */
  mirrorsTo?: "characterName" | "characterProfile" | "otherName" | "otherTrigger" | "firstResponse" | "replayResponse" | "coreFeeling";
};

export type Movement = {
  id: MovementId;
  label: string;
  sub: string;
  /** 이 막이 무엇을 하려는 자리인지 — 디렉터에게 주는 방향 감각 */
  intent: string;
  /** 써도 되고 안 써도 되는 각도들 */
  lenses: Lens[];
  /** 이 정도 주고받으면 다음 막을 "제안"해볼 만하다. 강제하지 않는다. */
  suggestAfter: number;
  /**
   * 이 막이 오르내릴 수 있는 깊이 대역 (lib/depth.ts의 L1~L7).
   * 막은 가로축(이야기 진행), 깊이는 세로축(같은 이야기의 안쪽)이다.
   * 대역을 두는 이유: 1막에서 갑자기 뿌리까지 캐면 유저가 닫히고,
   * 2막에서 계속 사실만 훑으면 잔잔바리가 된다.
   */
  depthBand: readonly [DepthLevel, DepthLevel];
  /** 이 막에 들어설 때 시작하는 깊이 */
  depthStart: DepthLevel;
  /** 질문 없이 디렉터가 진행하는 의식 */
  ritual?: "draw" | "mirror" | "replay" | "curtain";
  /** 오프닝 대사가 이미 던진 질문의 렌즈 id — 첫 비트가 같은 질문을 또 하지 않게 한다 */
  openingLens?: string;
  opening?: (s: SessionState) => string[];
  scene: (s: SessionState) => SceneState;
};

const base: SceneState = {
  backdrop: "curtain", light: 1, mood: "flat", mask: 1, chain: 0,
  other: false, card: "none",
};
const sc = (p: Partial<SceneState>): SceneState => ({ ...base, ...p });

const me = (s: SessionState) => s.character.name || "주인공";
const you = (s: SessionState) => s.other.name || "그 사람";
const card = (s: SessionState) => (s.cardId ? cardById(s.cardId) : null);

export const MOVEMENTS: Movement[] = [
  {
    id: "casting",
    label: "캐스팅",
    sub: "대신 여행할 애를 만들어요",
    intent:
      "여기서 정하는 건 설정이 아니라 거리(距離)다. 무대에 서는 건 유저가 아니라 " +
      "유저가 만든 애다. 유저는 무대를 만들고 그 애를 상황에 던지는 사람이다. " +
      "이 거리가 확보되면 유저는 자기 얘기를 훨씬 멀리까지 할 수 있다.\n" +
      "그래서 이 캐릭터는 무난하면 안 된다. 극단적이어야 투사가 걸린다. " +
      "제일 약한 지점과 제일 센 지점을 둘 다 받아라 — '무난한 애'가 나오면 " +
      "한 번 더 밀어라: '그 애의 제일 약한 데는 어디야? 진짜 극단적으로.'\n" +
      "이름·약점·강점이 잡히면 마지막으로 상황을 받는다 — '오늘 이 애를 어디에 " +
      "던질까?' 이게 유저가 여기 온 이유다. 단 3인칭으로 들어온다. " +
      "유저 본인의 사정을 직접 묻지 마라. 캐릭터의 상황으로만 물어라.",
    lenses: [
      { id: "name", intent: "대신 무대에 설 애의 이름. 진짜 이름이 아닌 것으로", mirrorsTo: "characterName" },
      { id: "weak", intent: "이 애의 제일 약한 지점 — 극단적으로. 무난하면 다시 밀어라", mirrorsTo: "characterProfile" },
      { id: "strong", intent: "이 애의 제일 센 지점 — 이것도 극단적으로. 약점만 있으면 투사가 안 걸린다" },
      { id: "gap", intent: "겉으로 보이는 모습과 속의 거리 — 남들은 이 애를 어떻게 아는지" },
      { id: "throw", intent: "오늘 이 애를 던질 상황. 유저가 여기 온 이유가 3인칭으로 들어오는 자리" },
      { id: "mine", intent: "이 애의 어디가 유저랑 닮았는지. 유저가 먼저 꺼낼 때만 받는다. 캐묻지 마라" },
    ],
    // 이름·약점·강점·겉모습·상황투입(throw)까지 5비트. throw는 이야기의 출발점이라
    // 그 전에 "다음 장면으로"가 뜨면 무대 없이 1막으로 넘어가 버린다.
    suggestAfter: 5,
    /**
     * 캐스팅은 깊이를 파는 자리가 아니라 거리를 만드는 자리다.
     * 극단적인 약점·강점이 감정 재료가 되므로 L3까지만 열어둔다.
     * 감정 명명(L4)부터는 1막·2막의 몫이다.
     */
    depthBand: [1, 3] as const,
    depthStart: 1,
    openingLens: "name",
    opening: () => [
      "여기는 마음무대야. 오늘 무대에 서는 건 네가 아니야.",
      "네가 만든 애가 대신 여행을 해. 너는 무대를 세우고, 그 애를 상황에 던지는 사람이야. 연출은 내가 할게.",
      "그러니까 이 애는 극단적이어도 돼. 무난한 애는 재미도 없고, 무대에서 아무 일도 안 일어나.",
      "이름부터 하나 지어줘. 진짜 이름 말고.",
    ],
    scene: () => sc({ backdrop: "curtain", light: 1 }),
  },

  {
    id: "draw",
    label: "카드 뽑기",
    sub: "오늘의 실마리가 정해져요",
    intent: "카드를 한 장 뽑아 오늘 이야기의 실마리로 삼는다.",
    lenses: [],
    suggestAfter: 0,
    /** 의식. 깊이를 움직이지 않는다. */
    depthBand: [1, 2] as const,
    depthStart: 1,
    ritual: "draw",
    opening: (s) => [
      s.character.name
        ? `${이가(me(s))} 무대에 올랐어. 조명 들어간다.`
        : "무대에 조명 들어간다. 배우는 아직 이름이 없어도 돼.",
      "카드를 한 장 뽑아볼게. 네가 고르는 게 아니라 뽑히는 거야.",
    ],
    scene: () => sc({ backdrop: "stage", light: 2, card: "back" }),
  },

  {
    id: "open",
    label: "1막 · 펼치기",
    sub: "하고 싶은 얘기를 꺼내요",
    intent:
      "유저가 하고 싶은 얘기를 펼치는 자리다. 정해진 주제가 없다. " +
      "카드는 말문을 여는 실마리일 뿐이고, 유저가 전혀 다른 얘기로 가면 그쪽으로 따라가라. " +
      "여기서는 얼마든지 오래 머물러도 된다. 한 사건만 다뤄도 되고, 여러 사건을 오가도 된다.",
    lenses: [
      { id: "what", intent: "무슨 일이 있었는지 — 사건의 뼈대" },
      { id: "scene", intent: "그 자리 — 언제, 어디, 누가 있었는지" },
      { id: "moment", intent: "가장 선명하게 남은 한 장면이나 한마디" },
      { id: "body", intent: "그 순간 몸 — 목, 가슴, 손, 발" },
      { id: "after", intent: "그 일이 끝나고 무엇을 했는지" },
      { id: "before", intent: "전에도 비슷한 적이 있었는지" },
      { id: "other", intent: "그 자리에 있던 다른 사람은 어땠는지" },
      { id: "elsewhere", intent: "이 얘기 말고 오늘 마음에 걸리는 다른 것" },
    ],
    suggestAfter: 8,
    /** 장면을 세우고(L2) 몸(L3)을 거쳐 감정 이름(L4)까지. 뿌리·욕구는 2막 몫. */
    depthBand: [2, 4] as const,
    depthStart: 2,
    openingLens: "moment",
    opening: (s) => {
      const c = card(s)!;
      return [
        `${c.emoji} ${c.name} — ${c.keyword}.`,
        "이 카드는 그냥 말문 여는 용도야. 여기서 떠오르는 게 있으면 그걸로, 아예 다른 얘기가 하고 싶으면 그걸로 가도 돼.",
        `조명 들어간다. ${이가(me(s))} 네가 던진 그 상황 안에 서 있어.`,
        `${me(s)}한테 제일 선명한 순간이 어디야? 딱 한 컷만 무대에 올려봐.`,
      ];
    },
    scene: (s) => sc({ backdrop: "stage", light: 2, card: "face", caption: `${card(s)?.name} 카드가 열렸다` }),
  },

  {
    id: "deepen",
    label: "2막 · 안쪽",
    sub: "같은 이야기를 더 안에서 봐요",
    intent:
      "사건이 아니라 그 사건이 건드린 자리를 본다. 이유를 캐묻지 마라. " +
      "유저가 이미 쓴 말 중 가장 무거운 단어 하나를 골라, 그 단어를 열어라. " +
      "'모르겠어'는 회피가 아니라 완결된 답이다. 해석을 확정하지 마라.",
    lenses: [
      { id: "core", intent: "가장 아팠던 지점", mirrorsTo: "coreFeeling" },
      { id: "voice", intent: "머릿속에서 맴돈 말 — 누구 목소리였는지" },
      { id: "first", intent: "이 느낌이 처음이었는지, 언제부터였는지" },
      { id: "fear", intent: "일어날까 봐 무서운 것" },
      { id: "want", intent: "그 순간 진짜로 원했던 것" },
      { id: "cost", intent: "그렇게 버티느라 치른 것" },
      { id: "exception", intent: "그렇지 않았던 때도 있었는지" },
    ],
    suggestAfter: 8,
    /** 이 막이 깊이의 본진. 몸(L3)에서 욕구(L7)까지 한 칸씩 내려간다. */
    depthBand: [3, 7] as const,
    depthStart: 4,
    opening: () => ["조명 조금 내릴게. 이제 밖에서 안쪽으로 들어가자.", "안 가고 싶으면 말해. 여기서 멈춰도 돼."],
    scene: () => sc({ backdrop: "room", light: 1, mood: "tear", mask: 0.5, caption: "문을 닫은 뒤의 얼굴" }),
  },

  {
    id: "meet",
    label: "3막 · 마주침",
    sub: "사람이 있는 장면으로 들어가요",
    intent:
      "이야기 속에 사람이 있다면 그 장면을 세운다. 상대를 악역으로 만들지 마라. " +
      "사람이 아니어도 된다 — 단톡방, 성적표, 집 현관도 상대가 될 수 있다. " +
      "상대가 없는 이야기면 없는 대로 간다. 억지로 갈등을 만들지 마라.",
    lenses: [
      { id: "who", intent: "마주치면 마음이 복잡해지는 상대", mirrorsTo: "otherName" },
      { id: "line", intent: "그 상대가 하는 말 중 제일 힘든 한마디 — 그대로", mirrorsTo: "otherTrigger" },
      { id: "react", intent: "그 말을 들었을 때 실제로 한 행동이나 말", mirrorsTo: "firstResponse" },
      { id: "inner", intent: "겉으로 한 것과 속으로 한 말의 차이", mirrorsTo: "coreFeeling" },
      { id: "history", intent: "원래 어떤 사이였는지" },
      { id: "guess", intent: "상대는 그때 무슨 생각이었을 것 같은지" },
      { id: "wish", intent: "그 사람한테 진짜로 하고 싶었던 말" },
    ],
    suggestAfter: 8,
    /** 사람이 있는 장면을 다시 세우므로 L2로 올라갔다가, 겉과 속의 차이(L5)까지. */
    depthBand: [2, 5] as const,
    depthStart: 2,
    openingLens: "who",
    opening: () => [
      "이야기에 사람이 있으면 한 명 무대로 불러올게. 마주치면 마음이 복잡해지는 사람, 있어? 이름을 지어줘.",
      "없으면 없다고 해도 돼. 다른 길로 갈게.",
    ],
    scene: () => sc({ backdrop: "hallway", light: 2, caption: "복도, 누군가 걸어온다" }),
  },

  {
    id: "mirror",
    label: "4막 · 거울",
    sub: "밖에서 내 이야기를 봐요",
    intent: "지금까지 유저가 준 재료만으로 이야기를 3인칭으로 되읽어주고, 틀린 데를 고치게 한다.",
    lenses: [
      { id: "fix", intent: "되읽어준 이야기에서 맞는 부분과 아닌 부분", mirrorsTo: "coreFeeling" },
      { id: "missing", intent: "이야기에서 빠진 것" },
      { id: "title", intent: "이 이야기에 제목을 붙인다면" },
    ],
    suggestAfter: 3,
    /** 이미 나온 감정을 밖에서 되읽는 자리. 새로 파지 않는다. */
    depthBand: [4, 6] as const,
    depthStart: 4,
    ritual: "mirror",
    opening: () => [
      "이제 무대에서 한 발 내려와서, 밖에서 이 이야기를 볼 차례야.",
      "네 말로 만든 이야기를 내가 다시 읽어줄게.",
    ],
    scene: (s) => sc({ backdrop: "mirror", light: 2, mood: "think", mask: 0.5, card: "face", caption: `거울 앞의 ${me(s)}` }),
  },

  {
    id: "replay",
    label: "5막 · 리플레이",
    sub: "같은 장면, 다른 선택",
    intent:
      "같은 장면을 한 번 더 세우고 이번엔 다르게 해볼 기회를 준다. " +
      "리플레이가 정답이라고 말하지 마라. 둘 다 할 수 있다는 것만 보여줘라.",
    lenses: [
      { id: "line", intent: "이번에는 뭐라고 할 것인지", mirrorsTo: "replayResponse" },
      { id: "body", intent: "그 말을 한다고 상상하면 몸이 어떤지" },
      { id: "cost", intent: "그 말을 하면 무엇이 달라지고 무엇이 무서운지" },
      { id: "again", intent: "또 다른 버전으로도 해본다면" },
    ],
    suggestAfter: 4,
    /** 몸의 반응(L3)으로 시작해 무서운 것(L5~6)까지. */
    depthBand: [3, 6] as const,
    depthStart: 3,
    ritual: "replay",
    opening: (s) => [
      "같은 장면으로 한 번만 더 가볼게. 이번엔 다르게 해도 돼.",
      `${이가(you(s))} 똑같은 말을 해.`,
    ],
    scene: () => sc({ backdrop: "hallway", light: 3, mood: "think", mask: 0.5, other: true, caption: "같은 복도, 두 번째 테이크" }),
  },

  {
    id: "curtain",
    label: "커튼콜",
    sub: "이야기가 완성돼요",
    intent: "오늘 무대를 닫는다. 조언하지 말고, 유저가 실제로 쓴 말에 근거해서만 정리한다.",
    lenses: [],
    suggestAfter: 0,
    /** 의식. 도달한 깊이를 그대로 정리한다. */
    depthBand: [1, 7] as const,
    depthStart: 7,
    ritual: "curtain",
    opening: (s) => [`${me(s)}의 이야기, 여기서 막을 내릴게.`],
    scene: (s) => sc({ backdrop: "stage", light: 4, mood: "warm", mask: 0, card: "flipped", caption: `${me(s)}의 이야기 · 커튼콜` }),
  },
];

export const movementById = (id: MovementId): Movement => MOVEMENTS.find((m) => m.id === id)!;
export const movementIndex = (id: MovementId): number => MOVEMENTS.findIndex((m) => m.id === id);
export const nextMovement = (id: MovementId): Movement | null => MOVEMENTS[movementIndex(id) + 1] ?? null;

export type { Thread } from "./types";

/** 지금 비트의 깊이 상태 — 엔진이 lib/depth.ts의 nextDepth()로 계산해 넘긴다 */
export type DepthCue = { level: DepthLevel; move: DepthMove; why: string };

/**
 * 디렉터에게 넘기는 구조 브리핑.
 *
 * 두 축을 같이 준다:
 *   가로축 = 막(Movement). 이야기가 어디까지 왔는가.
 *   세로축 = 단계(Depth).  같은 이야기를 얼마나 안쪽에서 보고 있는가.
 *
 * 핵심: "이걸 채워라"가 아니라 "이런 각도가 있다, 그런데 유저를 먼저 따라가라"다.
 * 단계도만은 예외다 — 깊이는 한 칸씩 밟으라는 것이 지시다.
 */
export function stageBrief(m: Movement, s: SessionState, beats: number, cue?: DepthCue): string {
  const openThreads = (s.threads ?? []).filter((t) => !t.pulled);
  const lenses = m.lenses.map((l) => `  · [${l.id}] ${l.intent}`).join("\n");
  const threads = openThreads.length
    ? openThreads.map((t) => `  · "${t.text}"`).join("\n")
    : "  (아직 없음)";

  const cueBlock = cue
    ? depthBrief(cue.level, m.depthBand, cue.move, cue.why)
    : depthBrief(m.depthStart, m.depthBand, "hold", "이 막의 기본 깊이");

  const rung = rungAt(cue?.level ?? m.depthStart);
  const f = s.frame;
  const frameBlock = f && (f.where || f.when || f.who?.length)
    ? [
        "[지금 세워진 장면 — 빈 칸이 있으면 그걸 묻는 것이 제일 좋은 질문이다]",
        `  어디: ${f.where || "(비어 있음)"}`,
        `  언제: ${f.when || "(비어 있음)"}`,
        `  누가: ${f.who?.length ? f.who.join(", ") : "(비어 있음)"}`,
        `  조명: ${f.light || "(비어 있음)"}`,
        `  소리: ${f.sound || "(비어 있음)"}`,
      ].join("\n")
    : "[지금 세워진 장면] 아직 비어 있다. 장면이 없으면 감정을 물어도 허공에 뜬다 — 먼저 무대를 세워라.";

  const feltBlock = s.feelings?.length
    ? `[유저가 직접 고른 감정 — 이 단어 그대로 써라. 다른 말로 바꿔 부르지 마라]\n  ${s.feelings.join(" · ")}`
    : "[유저가 직접 고른 감정] 아직 없다. 감정 단어는 디렉터가 붙이지 말고 유저가 고르게 해라.";

  return [
    `[지금 막] ${m.label} (${m.id}) — 이 막에서 ${beats}번째 주고받는 중`,
    `[이 막이 하려는 것]\n${m.intent}`,
    ``,
    cueBlock,
    ``,
    frameBlock,
    feltBlock,
    ``,
    `[써볼 수 있는 각도 — 의무 아님. 유저가 다른 데로 가면 버려라]\n${lenses || "  (없음)"}`,
    `[지금 깊이(L${cue?.level ?? m.depthStart} ${rung.label})에 맞는 각도를 고르는 게 우선이다]`,
    `[유저가 흘렸지만 아직 안 펼친 말 — 이걸 먼저 잡아라]\n${threads}`,
    m.lenses.length
      ? "[가장 중요한 규칙] 각도 목록을 순서대로 채우지 마라. 유저가 방금 쓴 말에서 가장 살아 있는 단어 하나를 골라 거기서부터 열어라. 목록에 없는 방향이라도 유저가 그쪽으로 가면 따라가라."
      : "",
    beats >= m.suggestAfter
      ? "[신호] 이 막에서 꽤 머물렀다. 유저가 더 할 말이 있어 보이면 계속 머물러라. 끊긴 느낌이면 suggestNext를 true로 줘서 다음 막을 '제안'해도 된다. 강제로 넘기지는 마라."
      : "[신호] 아직 초반이다. suggestNext는 false로 두고 계속 열어라.",
  ]
    .filter(Boolean)
    .join("\n");
}
