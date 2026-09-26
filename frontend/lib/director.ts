import { cardById } from "./cards";
import type { Inference, SessionState } from "./types";
import { josa, 은는, 을를, 이가 } from "./josa";

/**
 * 오프라인 디렉터 — ANTHROPIC_API_KEY가 없을 때 쓰는 규칙 기반 추론 엔진.
 * AI 없이도 프로토타입이 끝까지 돌아가야 하므로, 단정하지 않고 "혹시 이런 느낌?"
 * 톤을 유지한다.
 */

type Lex = { emotion: string; pattern: string; words: string[] };

const LEX: Lex[] = [
  { emotion: "고립감", pattern: "사람들 사이에 있는데도 혼자인 느낌", words: ["아무도", "혼자", "몰라", "외로", "따", "끼지", "빠지"] },
  { emotion: "가면 쓰기", pattern: "겉으로 드러내는 나와 안에 있는 나를 따로 관리하는 습관", words: ["밝", "웃", "괜찮은 척", "척", "장난", "분위기", "메이커"] },
  { emotion: "슬픔", pattern: "참다가 혼자 있을 때 흘려보내는 방식", words: ["울", "눈물", "슬프", "속상"] },
  { emotion: "자기의심", pattern: "관계의 문제를 자기 탓으로 돌려서 설명하는 패턴", words: ["나만", "내가 이상", "내 탓", "못나", "부족", "역시"] },
  { emotion: "눈치·긴장", pattern: "상대 기분을 먼저 읽고 자기 말을 뒤로 미루는 패턴", words: ["눈치", "조심", "부담", "미안", "괜히", "불편"] },
  { emotion: "억울함", pattern: "설명할 기회가 없었다고 느끼는 상태", words: ["억울", "불공평", "왜 나", "짜증", "화"] },
  { emotion: "압박감", pattern: "선택이 내 것이 아니었다고 느끼는 상태", words: ["엄마", "아빠", "성적", "공부", "학원", "진로", "해야"] },
  { emotion: "불안", pattern: "무슨 일이 생길지 몰라 미리 대비하는 상태", words: ["불안", "무서", "걱정", "떨리", "어떡", "모르겠"] },
  { emotion: "포기", pattern: "말해도 달라지지 않는다고 결론 내린 상태", words: ["말해봤자", "어차피", "포기", "됐어", "의미 없"] },
  { emotion: "기대", pattern: "아직 놓지 않은 바람이 남아 있는 상태", words: ["하고 싶", "되고 싶", "바라", "기대", "꿈"] },
];

const STOP = new Set([
  "그리고", "근데", "그래서", "진짜", "너무", "완전", "약간", "좀", "그냥", "나는", "내가", "저는",
  "것", "거", "같아", "같은", "있어", "없어", "해서", "하고", "하는", "되는", "이런", "저런", "그런",
]);
/** 조사를 털어내서 보여줄 만한 낱말만 남긴다 */
const JOSA = /(은|는|이|가|을|를|에서|에게|에|도|만|으로|로|의|과|와|랑|이랑|한테|까지|부터|보다)$/;

function keywordsOf(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)) {
    if (raw.length < 2) continue;
    const w = raw.length > 2 ? raw.replace(JOSA, "") : raw;
    if (w.length < 2 || STOP.has(w) || STOP.has(raw)) continue;
    if (!out.includes(w)) out.push(w);
    if (out.length === 4) break;
  }
  return out;
}

function hits(text: string): Lex[] {
  const found = LEX.filter((l) => l.words.some((w) => text.includes(w)));
  return found.length ? found.slice(0, 3) : [LEX[7]];
}

/** 🔍 추론 블록 — 규칙 기반 */
export function localInference(text: string, s: SessionState, mode: "inference" | "deepen" | "correct"): Inference {
  const h = hits(text);
  // 유저가 직접 고른 감정이 있으면 그 말을 그대로 쓴다. 바꿔 부르지 않는다.
  const owned = (s.feelings ?? []).slice(-3);
  const name = s.character.name || "이 캐릭터";
  const card = s.cardId ? cardById(s.cardId) : null;

  const lead =
    mode === "correct"
      ? `고쳐준 말로 다시 읽어보면, ${은는(name)}`
      : mode === "deepen"
        ? `조금 더 안쪽을 보면, ${은는(name)}`
        : `네가 쓴 말에서 내가 읽은 건 — ${은는(name)}`;

  const joined = h.map((x) => x.emotion).reduce((acc, cur, i) =>
    i === 0 ? cur : `${acc}${josa(acc, "과", "와")} ${cur}`);
  const named = owned.length
    ? owned.reduce((a, c, i) => (i === 0 ? c : `${a}${josa(a, "과", "와")} ${c}`))
    : joined;
  const reading = [
    owned.length
      ? `네가 고른 말 그대로 갈게 — ${은는(s.character.name || "이 캐릭터")} 지금 ${named}.`
      : `${lead} ${named}${josa(named, "을", "를")} 같이 들고 있는 것 같아.`,
    `${h[0].pattern}. 혹시 이런 느낌이야?`,
    card ? `${card.emoji} ${card.name} 카드가 뽑힌 게 이상하지 않네.` : "",
    "아니면 바로 아니라고 해줘. 네 이야기니까 네 말이 기준이야.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    reading,
    emotions: [...new Set([...owned, ...h.map((x) => x.emotion)])].slice(0, 4),
    pattern: h[0].pattern,
    keywords: keywordsOf(text),
  };
}

/** 🎭 보조자아 응답 — 리플레이(T18) */
export function localOtherReaction(replay: string, s: SessionState): string {
  const soft = /[ㅋㅎ~!]|같이|갈래|나도|쏠게|좋아/.test(replay);
  const blunt = /싫|하지마|그만|짜증|왜|화/.test(replay);
  const name = s.character.name || "너";
  if (blunt) return `어...? 어, 미안. 그런 줄 몰랐어. (잠깐 멈춤) 진짜로 몰랐어, ${name}야.`;
  if (soft) return `아 진짜? 완전 좋지! 왜 그동안 말 안 했어 ㅋㅋ 다음부터 그냥 말해.`;
  return `...어, 그래. (살짝 놀란 얼굴) 그렇게 말해줘서 좀 편하네.`;
}

/** 🪞 거울 기법 3인칭 서술 (T14) */
export function localMirror(s: SessionState): string {
  const n = s.character.name || "그 아이";
  const card = s.cardId ? cardById(s.cardId) : null;
  const other = s.other.name || "그 사람";
  return [
    `${은는(n)} 사람이 많은 곳에서 제일 잘 웃는 아이였다.`,
    `${s.answers[4] ? `"${trim(s.answers[4])}" — 그게 ${이가(n)} 말한 하루였다.` : ""}`,
    `${이가(other)} 지나갈 때 ${은는(n)} ${s.firstResponse ? `"${trim(s.firstResponse)}"라고 했다.` : "아무 말도 하지 않았다."}`,
    `그리고 속으로는 ${s.coreFeeling ? `"${trim(s.coreFeeling)}"라고 말하고 있었다.` : "다른 말을 하고 있었다."}`,
    card ? `${card.emoji} ${card.name}. ${이가(n)} 들고 있던 건 무거운 게 아니라, 오래 들고 있던 것이었다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** 📖 커튼콜 */
export function localCurtain(s: SessionState): { title: string; insights: string[]; tomorrow: string } {
  const card = s.cardId ? cardById(s.cardId) : null;
  const n = s.character.name || "주인공";
  return {
    title: card ? `${card.flip.name} 앞의 한 발짝` : `${n}의 한 발짝`,
    insights: [
      s.coreFeeling ? `${이가(n)} 속으로 한 말: "${trim(s.coreFeeling)}"` : `${은는(n)} 말하지 않은 말을 오래 들고 있었어.`,
      s.firstResponse && s.replayResponse
        ? `1차에는 "${trim(s.firstResponse)}", 리플레이에는 "${trim(s.replayResponse)}". 상황은 같았는데 선택은 달랐어.`
        : `같은 장면에서도 선택은 하나가 아니었어.`,
      card
        ? `${card.emoji} ${은는(card.name)} 약점이 아니라, 지금까지 너를 지켜온 방식이었어.`
        : "그 카드는 약점이 아니라, 지금까지 너를 지켜온 방식이었어.",
    ],
    tomorrow: card ? card.flip.reading : "오늘 한 말 한 줄이면 충분해. 내일은 그 한 줄부터.",
  };
}

const trim = (t: string) => (t.length > 40 ? t.slice(0, 40) + "…" : t);

/** 🎬 선택지 칩 — 규칙 기반. AI가 없을 때 주요 턴에 최소한의 갈래를 제공한다. */
export function localChoices(s: SessionState): { react: string; choices: { label: string; text: string }[] } {
  const card = s.cardId ? cardById(s.cardId) : null;
  const o = s.other.name || "걔";
  const byTurn: Record<number, { label: string; text: string }[]> = {
    2: [
      { label: "나랑 비슷하게", text: "나랑 비슷한 나이야. 학교도 다녀." },
      { label: "완전 다르게", text: "나랑 완전 달라. 성격도 반대야." },
      { label: "학교 밖의 아이", text: "학교를 안 다니고 있어. 요즘 집에 있는 시간이 길어." },
      { label: "아직 비밀", text: "자세한 건 나중에 정할래. 일단 이대로 가자." },
    ],
    4: [
      { label: "학교에서", text: `학교에서 있었던 일이야. ${card ? card.keyword + " 같은 느낌이었어." : ""}`.trim() },
      { label: "집에서", text: "집에서 있었던 일이야. 겉으론 아무 일도 아닌 것처럼 지나갔어." },
      { label: "말보다 분위기", text: "무슨 사건이 있었다기보다, 분위기가 계속 이상했어." },
      { label: "아직 말하기 어려워", text: "구체적으로 말하긴 어려운데, 그날 이후로 좀 달라졌어." },
    ],
    7: [
      { label: "오래된 일이야", text: "사실 이번이 처음이 아니야. 전에도 비슷한 적이 있었어." },
      { label: "몸이 먼저 알았어", text: "이유는 모르겠는데 몸이 먼저 반응했어. 가슴이 답답했어." },
      { label: "누가 한 말 때문", text: "누가 했던 말이 계속 머릿속에 남아 있어서 그런 것 같아." },
      { label: "모르겠어", text: "모르겠어. 그냥 그렇게 됐어." },
    ],
    8: [
      { label: "친한 애", text: "겉으로는 제일 친한 애야. 그래서 더 복잡해." },
      { label: "어른", text: "또래가 아니라 어른이야." },
      { label: "사람이 아니야", text: "사람이 아니라 단톡방이야. 알림 뜰 때마다 마음이 내려앉아." },
      { label: "없어", text: "없어. 지금은 사람 얘기는 안 하고 싶어." },
    ],
    11: [
      { label: "아무 말 못 했어", text: "아무 말도 안 했어. 그냥 웃고 넘겼어." },
      { label: "딴청 부렸어", text: "못 들은 척 폰만 봤어." },
      { label: "괜찮은 척했어", text: "괜찮다고 했어. 사실 안 괜찮았는데." },
      { label: "받아쳤어", text: "짜증을 냈어. 그리고 바로 후회했어." },
    ],
    12: [
      { label: "왜 나만", text: "'왜 나한테만 이래' 하는 말이 맴돌았어." },
      { label: "내 탓인가", text: "'내가 뭘 잘못했나' 하는 생각이 계속 돌았어." },
      { label: "아무 생각 없음", text: "머리가 하얘져서 아무 생각도 안 났어." },
      { label: "말하고 싶었어", text: `사실 ${o}한테 하고 싶은 말이 있었는데 삼켰어.` },
    ],
    17: [
      { label: "솔직하게", text: "사실 나 그 말 들으면 좀 힘들어, 라고 말해볼래." },
      { label: "가볍게 던지기", text: "야, 나도 껴줘~ 하고 가볍게 던져볼래." },
      { label: "이번에도 침묵", text: "이번에도 아무 말 안 할래. 대신 자리를 뜰 거야." },
      { label: "물어보기", text: `${o}한테 먼저 물어볼래. 너 나한테 왜 그러는 거야, 하고.` },
    ],
  };
  const choices = byTurn[s.turn] ?? [];
  return { react: "", choices };
}
