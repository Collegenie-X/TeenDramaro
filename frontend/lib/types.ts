import type { CardId } from "./cards";

export type Act = "entry" | "act1" | "act2" | "act3" | "act4" | "curtain";

export const ACT_META: Record<Act, { label: string; sub: string; turns: [number, number] }> = {
  entry:   { label: "무대 입장", sub: "캐릭터를 만들고 카드를 뽑아요", turns: [1, 3] },
  act1:    { label: "1막 · 상황 열기", sub: "무슨 일이 있었는지 꺼내봐요", turns: [4, 7] },
  act2:    { label: "2막 · 역할 대화", sub: "그 사람과 다시 마주쳐요", turns: [8, 13] },
  act3:    { label: "3막 · 거울", sub: "밖에서 내 이야기를 봐요", turns: [14, 16] },
  act4:    { label: "4막 · 리플레이", sub: "같은 장면, 다른 선택", turns: [17, 19] },
  curtain: { label: "커튼콜", sub: "이야기가 완성돼요", turns: [20, 20] },
};

/** 삽화 무대의 상태 — 턴마다 조금씩 변한다 */
export type SceneState = {
  /** 배경 프리셋 */
  backdrop: "curtain" | "school" | "room" | "split" | "hallway" | "mirror" | "stage" | "sky";
  /** 0 = 완전히 닫힘/어두움 → 4 = 환함 */
  light: 0 | 1 | 2 | 3 | 4;
  /** 주인공 표정 */
  mood: "bright" | "flat" | "tear" | "think" | "warm" | "shout";
  /** 가면이 얼마나 씌워져 있나 (1 = 완전, 0 = 벗음) */
  mask: 0 | 0.5 | 1;
  /** 속박 소품 세기 */
  chain: 0 | 0.5 | 1;
  /** 상대 인물 등장 여부 */
  other: boolean;
  /** 카드 부유 표시 */
  card: "none" | "back" | "face" | "flipped";
  /** 삽화 아래 캡션 */
  caption?: string;
  /** 분할 화면 두 칸의 라벨 */
  split?: [string, string];
  /** 역할 교체 — 상대가 주인공 자리에 선다 */
  swapped?: boolean;
};

export type Msg = {
  id: string;
  /** director = AI 디렉터, user = 유저, other = 보조자아(갈등 상대) */
  role: "director" | "user" | "other" | "system";
  text: string;
  /** 🔍 추론 블록 */
  inference?: Inference;
  /** 나란히 비교 블록 (T18) */
  compare?: { first: string; replay: string; labels?: [string, string] };
  /** 이 메시지와 함께 갱신되는 무대 */
  scene?: SceneState;
  /** 보조자아 이름 */
  speakerName?: string;
  /** 유저가 이 말과 함께 고른 감정 */
  feelings?: string[];
  /** 이 말에서 새 장(章)이 열린다 — 채팅 흐름에 꽂히는 이야기 구분선 */
  chapter?: { act: string; note: string };
};

export type Inference = {
  reading: string;
  emotions: string[];
  pattern: string;
  keywords: string[];
};

export type Branch = "lines" | "swap" | "future" | "newcard";

/** 🎬 유저가 답할 수 있는 네 갈래 — 매 비트마다 새로 만들어진다 */
export type Direction = {
  /** scene = 구체적 장면 · feeling = 감정/속마음 · turn = 예상 밖 · hold = 지금은 말 안 하기 */
  kind: "scene" | "feeling" | "turn" | "hold";
  label: string;
  text: string;
};

/** 유저가 흘렸지만 아직 안 펼친 말 — 이야기가 자라는 씨앗 */
export type Thread = {
  id: string;
  /** 유저가 쓴 표현 그대로 */
  text: string;
  /** 어느 막에서 나왔는지 */
  from: string;
  pulled?: boolean;
};

export type SessionState = {
  id: string;
  createdAt: number;
  turn: number;
  character: { name: string; profile: string };
  cardId: CardId | null;
  other: { name: string; trigger: string };
  /** 턴 인덱스별 유저 원문 */
  answers: Record<number, string>;
  /** 재도전 분기에서 받은 답 (키는 분기 스텝의 bkey) */
  branchAnswers: Record<string, string>;
  firstResponse: string;
  replayResponse: string;
  coreFeeling: string;
  emotionFlow: string[];
  /** 세션 내내 유저가 고른 감정 (중복 없이 순서대로) */
  feelings: string[];
  messages: Msg[];
  scene: SceneState;
  done: boolean;
  title?: string;
  insights?: string[];
  tomorrow?: string;
  branchesUsed: Branch[];

  /* ── 열린 무대 엔진 (막 기반, 턴 수 무제한) ── */
  /** 지금 막 id — 열린 엔진에서만 쓴다 */
  movement?: string;
  /** 지금 막에서 몇 번째 주고받는 중인지 */
  beats?: number;
  /** 유저가 흘렸지만 아직 안 펼친 말 */
  threads?: Thread[];
};

export type StoryRecord = {
  id: string;
  date: string;
  cardId: CardId;
  flippedTo: string;
  title: string;
  characterName: string;
  emotionFlow: string[];
  /** 세션 내내 유저가 고른 감정 (중복 없이 순서대로) */
  feelings: string[];
  insights: string[];
  tomorrow: string;
  branchesUsed: Branch[];
};
