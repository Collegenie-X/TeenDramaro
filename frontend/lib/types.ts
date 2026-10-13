/**
 * 마음씬 — 데이터 모양.
 * 원천: docs/마음무대_씬무대_유저시나리오_ver2.md 부록 B-1
 *
 * 두 트랙(🎞 상황극 무대 · 🪞 내 무대)이 같은 모양의 ScenePiece를 만든다.
 * 그래서 섞어서 조립하고, 같은 방식으로 고치고, 같은 방식으로 돌아본다.
 */

/** 맛 — 🥛 순한 맛이 기본 무대 */
export type Spice = "mild" | "warm" | "hot";
/** 반 — 🐣 기초반 · 🐥 · 🦅 */
export type Class = "chick" | "teen" | "eagle";
export type Grade = "m1" | "m2" | "m3";

export type Genre =
  | "romance" | "family" | "mystery" | "court" | "comedy" | "youth"   // 메뉴판 위쪽 6
  | "tragedy" | "folk";                                                // 메뉴판 아래쪽

export type Origin = "classic" | "film";

/** §4 연기 실습식 과제 유형 */
export type TaskKind =
  | "persuade" | "ask" | "refuse" | "secret" | "confess"
  | "apologize" | "deliver" | "uncover" | "deadline" | "loop";

/** §12 다이얼 4개 — 두 트랙 공통. 0~4 */
export type Dials = { honesty: number; eyes: number; stubborn: number; play: number };

/** 🎭 등장 인물 생김새 — components/CastArt.tsx가 얼굴을 그린다 */
export type Look = {
  age: "teen" | "adult" | "elder";
  hair: "short" | "long" | "pony" | "bob" | "curly" | "bun";
  hairColor?: string;
  shirt: string;     // 옷 색
  acc?: "glasses" | "earphone" | "cap" | "whistle" | "headband" | "cardigan" | "lanyard" | "apron";
};

/** 🎭 상대 인물의 결 — 연기 재료. 진단·성격 유형이 아니라 이 장면에서 보이는 모습 */
export type Persona = {
  tag: string;       // 어떤 사람인지 한 줄
  speech: string;    // 말투
  body: string[];    // 자꾸 나오는 몸짓 — 지문 재료
  soft: string;      // 이런 말엔 풀린다
  sore: string;      // 이런 말엔 서운해진다
};

export type Character = {
  name: string;
  want: string;      // 원하는 것
  hide: string;      // 숨기는 것
  habit?: string;    // 말버릇
  look?: Look;
  persona?: Persona;
  /** 🎭 여러 명일 때 — 이 인물만의 애드립 재료. 없으면 archetype.pool */
  pool?: string[];
};

/** 👀 지켜보는 사람 — 판을 끌진 않지만, 반응이 장면에 끼어든다 */
export type Watcher = {
  name: string;
  at?: string;          // 어디서 보나
  look?: Look;
  lines: string[];      // 속삭임 · 반응 · 몸짓. {w} = 내 말에서 받은 한 단어
  seen: string;         // 🎬 작가실 — 이 사람 눈에 비친 장면
  /** inner = 속마음이 들린다(그 사람 머릿속 소리) */
  voice?: "aside" | "inner";
};

/** 📜 정해진 턴에 일어나는 일 — 긴 장면의 굴곡 */
export type ArcEvent = {
  at: number;           // 내 몇 번째 말 뒤에
  kind: "event" | "line" | "watch";
  by?: string;
  text: string;
  dir?: string;
  /** queue 모드 — 이 인물이 이제부터 판을 끈다 */
  lead?: boolean;
};

/** 📺 원작 — 유명한 드라마 · 영화 · 애니 · 만화의 그 장면 */
export type WorkRef = {
  kind: "drama" | "film" | "anime" | "manga" | "novel";
  title: string;
  scene: string;        // 원작의 그 장면 — 우리 말로 요약 (대사 인용 없음)
};

/** 최종.md §2 형식 — 장소·인물·고정 사실·열린 것 */
export type Scene = {
  place: string;
  time: string;
  light: string;     // 빛·소리 하나
  me: Character;
  other: Character;
  /** 다 : 1 — 같이 말하는 사람들 */
  others?: Character[];
  /** 👀 주변에서 지켜보는 사람들 */
  watchers?: Watcher[];
  fixed: string[];
  open: string[];
};

export type ActingTask = {
  kind: TaskKind;
  want: string;
  obstacle: string;
  secret?: string;
  timer?: number;    // 초
  body?: string;     // 몸 하나
};

/** 🎞 상황극 원형 */
export type Archetype = {
  id: string;
  genre: Genre;
  origin: Origin;
  classicTitle?: string;     // 🏛만. 🎬은 앱에 노출하는 제목 없음
  typeName: string;          // 원형 이름 — 「발코니 고백」
  skeleton: string;          // 상황의 뼈대
  adaptTitle: string;        // 🥛 중학생 자리로 옮긴 제목
  spice: Spice;
  minutes: number;
  /** 💬 결정적 자리까지 내 말 수 — 짧게 4 · 중간 6~8 · 길게 10~12 · 아주 길게 14~16 */
  turns?: number;
  /** ensemble = 여럿이 번갈아 · queue = 한 명씩 차례로 등장 (arc의 lead로 바뀐다) */
  mode?: "ensemble" | "queue";
  arc?: ArcEvent[];
  work?: WorkRef;
  scene: Scene;
  task: ActingTask;
  opener: { line: string; dir?: string; by?: string };
  /** 상대 인물의 애드립 재료. {w} = 내 말에서 받은 한 단어 */
  pool: string[];
  /** 🟡 새 사실 — 판 중간에 드러난다 */
  facts: string[];
  twists: string[];          // ⚡ 돌발
  pivot: string;             // 🌟 결정적 자리 질문
  reveal: { original?: string; gloss: string; after: string };
  /** 사용자가 🪞 장면을 상황극으로 옮겨 만든 카드 */
  custom?: { fromPieceId: string };
};

export type Who = "me" | "other" | "director" | "pd" | "system" | "watch";

export type TechId =
  | "scene" | "freeze" | "double" | "soliloquy" | "reversal"
  | "chair" | "distance" | "mirror" | "retake" | "future";

export type Beat = {
  id: string;
  who: Who;
  text: string;
  dir?: string;          // 지문 (기울임)
  by?: string;           // 🎭 여러 명일 때 — 누가 말했나 (other · watch)
  fact?: boolean;        // 🟡 새 사실
  tech?: TechId;         // 🪞 이 비트에서 쓴 기법
  asOther?: boolean;     // 🔄 자리 바꾸기 중 — 내가 상대로 말함
  direction?: boolean;   // 지문만 (내가 쓴 몸짓)
};

export type LastCut = { line: string; direction: string };

export type PdLog = { at: string; what: string; before?: string; after?: string };

export type Take = {
  n: number;
  beats: Beat[];
  lastCut: LastCut;
  dials: Dials;
  branches: string[];    // 🌟 나였다면? 가지들
  pdLog: PdLog[];
  reason?: string;       // 다시 찍은 이유 칩
  createdAt: string;
};

export type SceneSource =
  | { track: "situation"; archetypeId: string; origin: Origin | "custom" }
  | { track: "inner"; avatar: boolean; cardId?: string; fromArchetypeId?: string };

export type Curtain = { title: string; lines: string[]; tomorrow: string };

/** 🧩 씬 조각 — 두 트랙 공통 */
export type ScenePiece = {
  id: string;
  title: string;
  source: SceneSource;
  scene: Scene;
  task?: ActingTask;
  pivot: string;
  takes: Take[];          // 지우지 않음
  facts: string[];        // 이 씬에서 드러난 🟡 새 사실
  techniques: TechId[];   // 🪞 쓴 기법
  curtain?: Curtain;
  spice: Spice;
  cls: Class;
  /** 위기 신호가 있던 장면 — 다리를 놓지 않는다 */
  sealed?: boolean;
  /** 🧪 동작 시나리오로 만든 씬 — 시나리오 id. 「시나리오 기록 지우기」가 이것만 지운다 */
  demo?: string;
  createdAt: string;
  updatedAt: string;
};

export type Frame = "story" | "three" | "then-now-if" | "serial" | "free";

export type Slot = { pieceId: string; takeN: number; seam?: string; carryFacts: string[] };

export type Work = {
  id: string;
  title: string;
  frame: Frame;
  slots: Slot[];
  caption?: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

/** ✏️ 고친 기록 — 덮어쓰지 않는다 */
export type RevisionField =
  | "take" | "line" | "lastCut" | "dials"
  | "order" | "slotAdd" | "slotRemove" | "slotTake" | "seam" | "caption" | "title";

export type Revision = {
  id: string;
  at: string;
  target: { pieceId?: string; workId?: string; field: RevisionField; label: string };
  before: string;
  after: string;
  reason?: { chip?: string; note?: string };
};

export type EvidenceKind = "lastCut" | "revision" | "taskChoice" | "beatLength" | "castReuse" | "reason";

/** 🔍 나 노트 한 줄 — 근거는 사용자 말·고침뿐 */
export type Insight = {
  key: string;            // 같은 근거면 같은 key → 「아닌데」면 다시 안 나옴
  text: string;
  evidence: { kind: EvidenceKind; refs: string[]; quotes: string[] }[];
  goto?: { label: string; href: string };
};

export type InsightMark = { mark: "yes" | "no" | "unsure"; note?: string; at: string };

export type Profile = { grade: Grade; cls: Class; showAll: boolean };
