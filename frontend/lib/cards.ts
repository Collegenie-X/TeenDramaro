export type CardId =
  | "tower" | "moon" | "sun" | "justice" | "mirror" | "chain"
  | "wave" | "door" | "mask" | "seed" | "web" | "star";

export type TarotCard = {
  id: CardId;
  name: string;
  emoji: string;
  keyword: string;
  /** 카드가 연결되는 청소년 상황 */
  situations: string[];
  /** 카드 기반 힌트 (힌트 유형 3) */
  cardHint: string;
  /** T19 카드 뒤집기 — 반전 해석 */
  flip: { emoji: string; name: string; reading: string };
  /** 카드 고유 색 (그라디언트 시작/끝) */
  hue: [string, string];
};

/** 기획서 §4 — 청소년 맞춤 12장 */
export const CARDS: TarotCard[] = [
  {
    id: "tower", name: "탑", emoji: "🗼", keyword: "갑작스런 변화",
    situations: ["이사", "전학", "부모 이혼", "절교"],
    cardHint: "예고도 없이 뭔가 무너진 순간이 있었어? 그때 제일 먼저 뭐가 사라졌어?",
    flip: { emoji: "🧱", name: "주춧돌", reading: "무너진 건 전부가 아니라 위층이었어. 바닥은 아직 네 발밑에 있어." },
    hue: ["#3b2f5e", "#6d5a9c"],
  },
  {
    id: "moon", name: "달", emoji: "🌙", keyword: "불안·혼란",
    situations: ["정체성 고민", "모호한 관계"],
    cardHint: "이름 붙이기 어려운 기분이 있어? 좋은지 나쁜지도 모르겠는 그런 거.",
    flip: { emoji: "🌗", name: "반달", reading: "안 보이던 반쪽은 없어진 게 아니라 아직 빛이 안 닿은 거야." },
    hue: ["#232a4d", "#5b6aa8"],
  },
  {
    id: "sun", name: "태양", emoji: "☀️", keyword: "자신감·기쁨",
    situations: ["성취", "인정받은 순간"],
    cardHint: "누가 너를 제대로 봐준 순간이 있었어? 아주 작은 거라도.",
    flip: { emoji: "🌅", name: "새벽", reading: "환할 때만 네가 너인 건 아니야. 어스름 속의 너도 똑같이 너야." },
    hue: ["#7a4a12", "#d69a3c"],
  },
  {
    id: "justice", name: "정의", emoji: "⚖️", keyword: "공정·불공정",
    situations: ["팀플 무임승차", "차별 경험"],
    cardHint: "억울했는데 말 못 한 일이 있어? 누가 봐도 이상한데 나만 조용했던 순간.",
    flip: { emoji: "🕊️", name: "내려놓음", reading: "저울을 계속 들고 있는 팔이 제일 먼저 아파. 오늘은 잠깐 내려놔도 돼." },
    hue: ["#20403a", "#4f8a78"],
  },
  {
    id: "mirror", name: "거울", emoji: "🪞", keyword: "자기 인식",
    situations: ["\"나는 누구인가\" 정체성"],
    cardHint: "남들이 말하는 너랑 네가 아는 너가 다른 부분이 있어?",
    flip: { emoji: "🖼️", name: "창문", reading: "계속 비춰보던 게 거울이 아니라 창문이었을 수도 있어. 건너편에 누가 있었어." },
    hue: ["#2d3340", "#7c879c"],
  },
  {
    id: "chain", name: "사슬", emoji: "🔗", keyword: "속박·압박",
    situations: ["진로 강요", "학업 스트레스"],
    cardHint: "하고 싶어서가 아니라 해야 해서 하는 게 있어? 누가 걸어둔 거야?",
    flip: { emoji: "🔓", name: "느슨해진 고리", reading: "사슬은 그대로인데 한 칸이 헐거워졌어. 한 칸이면 손은 빠져." },
    hue: ["#3a2a2a", "#8a6a5a"],
  },
  {
    id: "wave", name: "파도", emoji: "🌊", keyword: "감정 폭발",
    situations: ["분노 조절", "울음 터짐"],
    cardHint: "참다가 한 번에 터진 적 있어? 터진 게 진짜 이유였을까?",
    flip: { emoji: "🏖️", name: "물러난 자리", reading: "파도가 지나간 모래에 선이 남았어. 어디까지 차올랐는지 이제 너는 알아." },
    hue: ["#123344", "#3a8fa8"],
  },
  {
    id: "door", name: "문", emoji: "🚪", keyword: "선택·기로",
    situations: ["진로", "관계 지속 여부"],
    cardHint: "둘 중에 못 고르고 있는 게 있어? 안 고르는 것도 지금은 하나의 선택이야.",
    flip: { emoji: "🗝️", name: "열쇠", reading: "문이 잠겨 있던 게 아니라 아직 밀어보지 않았던 거야." },
    hue: ["#402f22", "#9c7a4e"],
  },
  {
    id: "mask", name: "가면", emoji: "🎭", keyword: "숨기는 나",
    situations: ["겉과 속 다름", "거짓 웃음"],
    cardHint: "겉으로 보이는 나랑 안에 있는 내가 다른 순간이 있었어?",
    flip: { emoji: "🌟", name: "맨얼굴", reading: "가면은 널 숨기려고 쓴 게 아니라 지키려고 쓴 거였어. 이제 한쪽은 내려도 돼." },
    hue: ["#31204a", "#8a5cb8"],
  },
  {
    id: "seed", name: "씨앗", emoji: "🌱", keyword: "새로운 시작",
    situations: ["새 학기", "새 관계", "재도전"],
    cardHint: "다시 해보고 싶은데 못 하고 있는 게 있어? 뭐가 제일 무서워?",
    flip: { emoji: "🌳", name: "뿌리", reading: "아무것도 안 자란 것처럼 보이던 시간에 밑으로 자라고 있었어." },
    hue: ["#1f3a24", "#4f9455"],
  },
  {
    id: "web", name: "거미줄", emoji: "🕸️", keyword: "복잡한 관계",
    situations: ["삼각관계", "단톡방 갈등"],
    cardHint: "누구 편도 들 수 없는 상황에 끼인 적 있어? 그때 너는 어디 서 있었어?",
    flip: { emoji: "✂️", name: "끊어진 줄", reading: "전부 풀 필요는 없었어. 한 줄만 끊어도 숨은 쉬어져." },
    hue: ["#2a2a33", "#6f6f86"],
  },
  {
    id: "star", name: "별", emoji: "⭐", keyword: "희망·꿈",
    situations: ["미래 상상", "소망 표현"],
    cardHint: "아무도 안 물어봤지만 혼자 상상해본 미래가 있어?",
    flip: { emoji: "🧭", name: "나침반", reading: "별은 닿는 게 아니라 방향을 주는 거야. 이미 너는 그쪽을 보고 있었어." },
    hue: ["#1c2b4a", "#5d7fc4"],
  },
];

export const cardById = (id: CardId): TarotCard =>
  CARDS.find((c) => c.id === id) ?? CARDS[0];

/** 기획서 §11 — 특별 카드 해금 */
export type SpecialCard = { emoji: string; name: string; condition: string };
export const SPECIAL_CARDS: SpecialCard[] = [
  { emoji: "🦋", name: "나비", condition: "리플레이 3회 완료" },
  { emoji: "🔥", name: "불꽃", condition: "감정 변화 폭 큰 세션" },
  { emoji: "🌈", name: "무지개", condition: "역할 교체 2회 완료" },
];
