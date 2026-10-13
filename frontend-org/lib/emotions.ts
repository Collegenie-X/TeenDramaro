/**
 * 감정 팔레트 — 유저가 "지금 마음"에 이름을 붙일 때 쓴다.
 *
 * 이야기 자체는 주관식이 기본이다(기획서 §3.1). 이 팔레트는 이야기를 고르는
 * 객관식이 아니라, 이미 느끼고 있는 걸 부를 이름을 빌려주는 용도다.
 * 그래서 고르지 않아도 되고, 여러 개 골라도 되고, 직접 써도 된다.
 */
export type FeelingGroup = {
  id: string;
  label: string;
  emoji: string;
  /** 칩 색 (배경, 테두리, 글자) */
  tone: [string, string, string];
  items: string[];
};

export const FEELINGS: FeelingGroup[] = [
  {
    id: "sad", label: "가라앉는", emoji: "🌧️", tone: ["#1b2436", "#33465f", "#bcd0e6"],
    items: ["서운해", "외로워", "허전해", "울컥해", "슬퍼", "그립다"],
  },
  {
    id: "angry", label: "끓어오르는", emoji: "🔥", tone: ["#33191a", "#5d2a2c", "#f0bcbc"],
    items: ["짜증나", "억울해", "화나", "분해", "지긋지긋해"],
  },
  {
    id: "anx", label: "조마조마한", emoji: "🌊", tone: ["#162b33", "#2b4e5c", "#b3dbe8"],
    items: ["불안해", "무서워", "긴장돼", "눈치 보여", "들킬까 봐"],
  },
  {
    id: "shame", label: "작아지는", emoji: "🫥", tone: ["#2a2036", "#463459", "#d5c4ea"],
    items: ["부끄러워", "창피해", "초라해", "내 탓 같아", "숨고 싶어"],
  },
  {
    id: "numb", label: "멀어지는", emoji: "🌫️", tone: ["#25262b", "#3f4149", "#c7c9d1"],
    items: ["아무렇지 않아", "멍해", "지쳤어", "모르겠어", "귀찮아"],
  },
  {
    id: "warm", label: "풀리는", emoji: "🌤️", tone: ["#2b2616", "#4e452a", "#ecd9a8"],
    items: ["후련해", "편해", "고마워", "기뻐", "괜찮아진 것 같아"],
  },
];

export const ALL_FEELINGS = FEELINGS.flatMap((g) => g.items);

export const groupOf = (feeling: string): FeelingGroup | undefined =>
  FEELINGS.find((g) => g.items.includes(feeling));

/** 감정 흐름 차트용 이모지 */
export const feelingEmoji = (feeling: string): string =>
  groupOf(feeling)?.emoji ?? "💭";
