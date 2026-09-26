/**
 * 오프라인 열린 디렉터 — ANTHROPIC_API_KEY가 없을 때 쓰는 규칙 기반 비트 생성기.
 *
 * AI가 있을 때와 같은 원칙으로 움직인다:
 *   1. 유저가 방금 쓴 말에서 실마리를 잡는다 (스레드 우선)
 *   2. 같은 질문을 두 번 하지 않는다 (used 기록으로 소진)
 *   3. 네 갈래 방향은 진짜로 갈라진다 (장면 / 감정 / 예상 밖 / 지금은 안 할래)
 *
 * 질문 문장을 여러 벌 준비해두고 소진하는 방식이라 AI만큼 맥락에 붙지는 않지만,
 * 턴이 길어져도 같은 문장이 되풀이되지 않는다.
 */

import type { Direction, SessionState } from "./types";
import type { Movement, MovementId } from "./stage";
import { cardById } from "./cards";
import { 은는, 을를, 이가 } from "./josa";

export type OpenBeat = {
  react: string;
  question: string;
  lens: string;
  threads: string[];
  directions: Direction[];
  suggestNext: boolean;
};

const me = (s: SessionState) => s.character.name || "주인공";
const you = (s: SessionState) => s.other.name || "그 사람";
const card = (s: SessionState) => (s.cardId ? cardById(s.cardId) : null);

type Q = { id: string; lens: string; q: (s: SessionState) => string; d: (s: SessionState) => Direction[] };

const dir = (kind: Direction["kind"], label: string, text: string): Direction => ({ kind, label, text });

/* ══════════════════════════════════════════════════════
 * 막별 질문 은행 — 하나씩 소진하며 쓴다
 * ════════════════════════════════════════════════════ */

const CASTING: Q[] = [
  {
    id: "casting.basic", lens: "basic",
    q: (s) => `${은는(me(s))} 몇 살이야? 학교는 다니고 있어?`,
    d: (s) => [
      dir("scene", "비슷한 또래", `나랑 비슷한 나이야. 학교도 다녀.`),
      dir("feeling", "겉과 속이 달라", `겉으론 멀쩡한데 속은 좀 복잡한 애야.`),
      dir("turn", "학교 밖", `학교를 안 다녀. 요즘 집에 있는 시간이 길어.`),
      dir("hold", "아직 안 정할래", `아직 안 정했어. 하면서 정할래.`),
    ],
  },
  {
    id: "casting.surface", lens: "surface",
    q: (s) => `사람들은 ${을를(me(s))} 어떤 애라고 생각해?`,
    d: (s) => [
      dir("scene", "분위기 메이커", `애들은 재밌는 애라고 생각해. 항상 웃고 있으니까.`),
      dir("feeling", "조용한 애", `조용하고 무난한 애. 있는지 없는지 모를 때도 있어.`),
      dir("turn", "정반대로 봐", `다들 나를 완전히 잘못 알고 있어. 사실 정반대야.`),
      dir("hold", "모르겠어", `사람들이 나를 어떻게 보는지 잘 모르겠어.`),
    ],
  },
  {
    id: "casting.hidden", lens: "hidden",
    q: (s) => `${me(s)}한테 아무도 모르는 게 하나 있다면 뭘까?`,
    d: (s) => [
      dir("scene", "혼자 하는 것", `혼자 있을 때만 하는 게 있어. 아무한테도 말 안 했어.`),
      dir("feeling", "숨기는 마음", `사실 되게 지쳐 있어. 근데 티를 안 내.`),
      dir("turn", "좋아하는 게", `남들이 알면 놀랄 만한 걸 좋아해.`),
      dir("hold", "지금은 비밀", `그건 나중에 얘기할래.`),
    ],
  },
  {
    id: "casting.world", lens: "world",
    q: (s) => `${이가(me(s))} 하루 중에 제일 오래 있는 데는 어디야?`,
    d: () => [
      dir("scene", "교실", `교실. 근데 거기가 제일 편하진 않아.`),
      dir("feeling", "내 방", `내 방. 문 닫으면 그제야 숨이 쉬어져.`),
      dir("turn", "밖에서", `집에도 학교에도 안 있고 싶어서 그냥 돌아다녀.`),
      dir("hold", "딱히 없어", `딱히 어디가 좋다는 게 없어.`),
    ],
  },
];

const OPEN: Q[] = [
  {
    id: "open.what", lens: "what",
    q: (s) => `${me(s)}한테 요즘 무슨 일이 있었어?`,
    d: (s) => [
      dir("scene", "그날 일", `며칠 전에 있었던 일이 계속 생각나.`),
      dir("feeling", "사건보다 분위기", `무슨 사건이 있었다기보다, 요즘 계속 기분이 가라앉아 있어.`),
      dir("turn", "좋은 일도", `사실 나쁜 일만 있었던 건 아닌데, 그게 더 이상해.`),
      dir("hold", "말로 안 돼", `뭔가 있긴 한데 말로 정리가 안 돼.`),
    ],
  },
  {
    id: "open.scene", lens: "scene",
    q: () => `그게 언제였어? 어디였고, 누가 있었어?`,
    d: () => [
      dir("scene", "학교에서", `학교에서였어. 애들 다 있는 데서.`),
      dir("feeling", "혼자였어", `그때 나 혼자였어. 그게 제일 컸어.`),
      dir("turn", "집에서", `집이었어. 밖에서 있었던 일보다 집이 더 힘들어.`),
      dir("hold", "잘 기억 안 나", `언제였는지 잘 기억이 안 나. 여러 번이라서.`),
    ],
  },
  {
    id: "open.moment", lens: "moment",
    q: () => `그 일에서 제일 선명하게 남은 장면이 뭐야? 한 컷만 꺼내봐.`,
    d: () => [
      dir("scene", "누가 한 말", `누가 했던 말 한마디가 계속 남아 있어.`),
      dir("feeling", "표정", `그때 누가 지은 표정이 안 잊혀.`),
      dir("turn", "엉뚱한 게", `이상하게 그때 창밖 풍경이 제일 선명해.`),
      dir("hold", "흐릿해", `전체적으로 다 흐릿해. 느낌만 남아 있어.`),
    ],
  },
  {
    id: "open.body", lens: "body",
    q: () => `그 순간에 몸은 어땠어? 목이 막혔어, 가슴이 눌렸어, 아니면 아무 느낌 없었어?`,
    d: () => [
      dir("scene", "몸이 굳었어", `몸이 딱 굳었어. 움직여지지가 않았어.`),
      dir("feeling", "가슴이", `가슴이 꽉 눌리는 느낌이었어.`),
      dir("turn", "아무렇지 않았어", `이상하게 아무렇지도 않았어. 그게 더 무서워.`),
      dir("hold", "기억 안 나", `몸이 어땠는지는 기억 안 나.`),
    ],
  },
  {
    id: "open.after", lens: "after",
    q: () => `그 일 끝나고 나서 뭐 했어?`,
    d: () => [
      dir("scene", "그냥 지나갔어", `아무 일 없던 것처럼 그냥 다음 수업 갔어.`),
      dir("feeling", "혼자 있었어", `집에 와서 한참 가만히 있었어.`),
      dir("turn", "딴 걸 했어", `일부러 다른 거에 정신 팔았어. 안 생각하려고.`),
      dir("hold", "모르겠어", `뭐 했는지 기억이 안 나.`),
    ],
  },
  {
    id: "open.before", lens: "before",
    q: () => `그게 처음이었어? 아니면 전에도 비슷한 적 있었어?`,
    d: () => [
      dir("scene", "전에도", `전에도 있었어. 한두 번이 아니야.`),
      dir("feeling", "처음이야", `이번이 처음이야. 그래서 더 당황했어.`),
      dir("turn", "옛날부터", `사실 되게 어릴 때부터 그랬던 것 같아.`),
      dir("hold", "생각 안 해봤어", `그건 생각 안 해봤어.`),
    ],
  },
  {
    id: "open.other", lens: "other",
    q: () => `그 자리에 다른 사람도 있었어? 걔들은 어땠어?`,
    d: () => [
      dir("scene", "다들 있었어", `애들 다 있었어. 근데 아무도 아무 말 안 했어.`),
      dir("feeling", "한 명은", `한 명은 알아챈 것 같았는데, 그냥 넘어갔어.`),
      dir("turn", "아무도 없었어", `아무도 없었어. 그래서 아무도 모르는 일이야.`),
      dir("hold", "신경 못 썼어", `다른 사람까지는 신경 못 썼어.`),
    ],
  },
  {
    id: "open.elsewhere", lens: "elsewhere",
    q: () => `이 얘기 말고, 오늘 마음에 걸리는 다른 것도 있어?`,
    d: () => [
      dir("scene", "다른 일", `사실 이거 말고 다른 일도 있어.`),
      dir("feeling", "이게 제일 커", `아니, 지금은 이게 제일 커.`),
      dir("turn", "전혀 다른 얘기", `전혀 다른 얘긴데 요즘 이것 때문에 더 힘들어.`),
      dir("hold", "이거면 돼", `오늘은 이 얘기만 할래.`),
    ],
  },
];

const DEEPEN: Q[] = [
  {
    id: "deepen.core", lens: "core",
    q: () => `그 일에서 제일 아팠던 데가 어디야? 사건 자체야, 아니면 다른 거야?`,
    d: () => [
      dir("scene", "그 말이", `누가 한 말 자체가 아팠어.`),
      dir("feeling", "혼자라는 게", `그 일보다 아무도 몰랐다는 게 더 아팠어.`),
      dir("turn", "내 반응이", `사실 그 일보다 내가 아무 말 못 한 게 더 싫어.`),
      dir("hold", "모르겠어", `어디가 제일 아팠는지 모르겠어.`),
    ],
  },
  {
    id: "deepen.voice", lens: "voice",
    q: () => `그때 머릿속에서 맴돈 말이 있어? 그게 누구 목소리로 들려?`,
    d: () => [
      dir("scene", "내 목소리", `'왜 나만 이래' — 내 목소리였어.`),
      dir("feeling", "누가 하던 말", `예전에 누가 했던 말이 그대로 들려.`),
      dir("turn", "아무 소리 없음", `아무 말도 안 들렸어. 그냥 하얬어.`),
      dir("hold", "말 안 할래", `그건 지금 말하기 싫어.`),
    ],
  },
  {
    id: "deepen.first", lens: "first",
    q: () => `이 느낌, 언제부터 알고 있었어?`,
    d: () => [
      dir("scene", "올해부터", `올해 들어서 심해졌어.`),
      dir("feeling", "오래됐어", `꽤 오래됐어. 익숙해질 정도로.`),
      dir("turn", "어릴 때부터", `초등학교 때도 비슷한 게 있었던 것 같아.`),
      dir("hold", "모르겠어", `언제부터인지 모르겠어.`),
    ],
  },
  {
    id: "deepen.fear", lens: "fear",
    q: (s) => `${이가(me(s))} 제일 무서워하는 게 뭘 것 같아? 일어날까 봐 겁나는 거.`,
    d: () => [
      dir("scene", "또 그럴까 봐", `또 똑같은 일이 생길까 봐.`),
      dir("feeling", "들킬까 봐", `내가 이런 상태라는 걸 들킬까 봐.`),
      dir("turn", "안 변할까 봐", `무서운 건 사건이 아니라 이게 영영 안 변할까 봐야.`),
      dir("hold", "생각 안 할래", `그건 생각하고 싶지 않아.`),
    ],
  },
  {
    id: "deepen.want", lens: "want",
    q: () => `그 순간에 진짜로 원했던 건 뭐였어?`,
    d: () => [
      dir("scene", "누가 물어봐주길", `누가 괜찮냐고 한 번만 물어봐줬으면 했어.`),
      dir("feeling", "사라지고 싶었어", `그냥 그 자리에서 사라지고 싶었어.`),
      dir("turn", "아무것도", `아무것도 안 원했어. 그게 문제인 것 같아.`),
      dir("hold", "모르겠어", `뭘 원했는지 모르겠어.`),
    ],
  },
  {
    id: "deepen.cost", lens: "cost",
    q: (s) => `그렇게 버티느라 ${이가(me(s))} 포기한 게 있을까?`,
    d: () => [
      dir("scene", "사람", `친했던 애들이랑 멀어졌어.`),
      dir("feeling", "표현", `하고 싶은 말을 안 하는 게 습관이 됐어.`),
      dir("turn", "좋아하던 거", `원래 좋아하던 게 있었는데 이제 재미가 없어.`),
      dir("hold", "잘 모르겠어", `포기한 게 있는지 잘 모르겠어.`),
    ],
  },
  {
    id: "deepen.exception", lens: "exception",
    q: () => `그렇지 않았던 때도 있었어? 조금이라도 편했던 순간.`,
    d: () => [
      dir("scene", "한 번 있었어", `딱 한 번, 괜찮았던 날이 있었어.`),
      dir("feeling", "누구랑 있을 때", `어떤 애랑 있을 때는 좀 나아.`),
      dir("turn", "혼자일 때", `이상하게 혼자 있을 때가 제일 편해.`),
      dir("hold", "없었어", `그런 때는 없었던 것 같아.`),
    ],
  },
];

const MEET: Q[] = [
  {
    id: "meet.who", lens: "who",
    q: (s) => `${me(s)} 주변에, 마주치면 마음이 복잡해지는 사람 있어? 이름을 지어줘.`,
    d: () => [
      dir("scene", "친한 애", `겉으로는 제일 친한 애야. 그래서 더 복잡해.`),
      dir("feeling", "어른", `또래가 아니라 어른이야.`),
      dir("turn", "사람이 아니야", `사람이 아니라 단톡방이야. 알림 뜰 때마다 마음이 내려앉아.`),
      dir("hold", "없어", `없어. 사람 얘기는 안 하고 싶어.`),
    ],
  },
  {
    id: "meet.line", lens: "line",
    q: (s) => `${이가(you(s))} 뭐라고 할 때 제일 힘들어? 그 말 그대로 적어줘.`,
    d: (s) => [
      dir("scene", "그 한마디", `"너는 괜찮잖아" 이 말이 제일 힘들어.`),
      dir("feeling", "말이 아니라", `말이 아니라 그냥 쳐다보는 눈빛이 힘들어.`),
      dir("turn", "아무 말 안 해", `아무 말도 안 하는 게 제일 힘들어.`),
      dir("hold", "옮기기 어려워", `그 말 그대로 옮기기는 좀 어려워.`),
    ],
  },
  {
    id: "meet.react", lens: "react",
    q: (s) => `그때 ${은는(me(s))} 뭐라고 해? 아니면 아무 말 안 해?`,
    d: () => [
      dir("scene", "웃고 넘겼어", `그냥 웃으면서 넘겼어.`),
      dir("feeling", "괜찮은 척", `괜찮다고 했어. 사실 안 괜찮았는데.`),
      dir("turn", "받아쳤어", `짜증을 냈어. 그리고 바로 후회했어.`),
      dir("hold", "아무것도", `아무것도 안 했어. 그냥 가만히 있었어.`),
    ],
  },
  {
    id: "meet.inner", lens: "inner",
    q: () => `겉으로 한 거랑 속으로 한 말이 달랐어? 속에서는 뭐라고 했어?`,
    d: () => [
      dir("scene", "하고 싶던 말", `사실 하고 싶은 말이 있었는데 삼켰어.`),
      dir("feeling", "'왜 나만'", `'왜 나한테만 이래' 하는 말이 맴돌았어.`),
      dir("turn", "똑같았어", `겉이랑 속이 똑같았어. 진짜 아무 생각 없었어.`),
      dir("hold", "말 안 할래", `속으로 한 말은 말하기 싫어.`),
    ],
  },
  {
    id: "meet.history", lens: "history",
    q: (s) => `${랑안전(you(s))} 원래는 어떤 사이였어?`,
    d: () => [
      dir("scene", "원래 친했어", `원래 제일 친했어. 그래서 더 이상해.`),
      dir("feeling", "늘 어려웠어", `처음부터 좀 어려운 사이였어.`),
      dir("turn", "어느 날부터", `어느 날 갑자기 달라졌어. 이유는 몰라.`),
      dir("hold", "잘 몰라", `무슨 사이인지 나도 잘 모르겠어.`),
    ],
  },
  {
    id: "meet.guess", lens: "guess",
    q: (s) => `${은는(you(s))} 그때 무슨 생각이었을 것 같아?`,
    d: () => [
      dir("scene", "별생각 없었을 듯", `별생각 없었을 것 같아. 그냥 하던 대로.`),
      dir("feeling", "알면서", `알면서 그랬을 것 같아.`),
      dir("turn", "걔도 힘들었을지도", `사실 걔도 뭔가 힘들었을 수도 있어.`),
      dir("hold", "모르겠어", `걔 생각까지는 모르겠어.`),
    ],
  },
  {
    id: "meet.wish", lens: "wish",
    q: (s) => `${you(s)}한테 진짜로 하고 싶었던 말이 있어?`,
    d: () => [
      dir("scene", "직접 하고 싶은 말", `"나도 좀 껴줘" 라고 말하고 싶었어.`),
      dir("feeling", "물어보고 싶은 것", `나한테 왜 그러는지 물어보고 싶었어.`),
      dir("turn", "아무 말도", `아무 말도 하고 싶지 않아. 그냥 멀어지고 싶어.`),
      dir("hold", "지금은 안 할래", `그 말은 지금은 안 할래.`),
    ],
  },
];

const MIRROR: Q[] = [
  {
    id: "mirror.fix", lens: "fix",
    q: () => `이 이야기 어때? 맞는 부분, 아닌 부분 말해줘.`,
    d: () => [
      dir("scene", "대체로 맞아", `대체로 맞아. 근데 한 군데가 좀 달라.`),
      dir("feeling", "느낌이 달라", `사건은 맞는데 느낌이 좀 달라.`),
      dir("turn", "완전 달라", `읽어보니까 내 얘기 같지 않아.`),
      dir("hold", "모르겠어", `맞는지 아닌지 모르겠어.`),
    ],
  },
  {
    id: "mirror.missing", lens: "missing",
    q: () => `이 이야기에서 빠진 게 있어?`,
    d: () => [
      dir("scene", "빠진 장면", `중요한 장면이 하나 빠졌어.`),
      dir("feeling", "빠진 마음", `그때 진짜 기분이 안 들어갔어.`),
      dir("turn", "사람이 빠졌어", `이 얘기에 나오지 않은 사람이 한 명 더 있어.`),
      dir("hold", "다 들어갔어", `다 들어간 것 같아.`),
    ],
  },
  {
    id: "mirror.title", lens: "title",
    q: () => `이 이야기에 제목을 붙인다면 뭐라고 할래?`,
    d: () => [
      dir("scene", "장면으로", `"복도에서" 같은 걸로 하고 싶어.`),
      dir("feeling", "마음으로", `"아무도 몰랐다" 같은 제목.`),
      dir("turn", "반대로", `일부러 정반대 제목을 붙이고 싶어.`),
      dir("hold", "안 붙일래", `제목은 안 붙일래.`),
    ],
  },
];

const REPLAY: Q[] = [
  {
    id: "replay.line", lens: "line",
    q: (s) => `이번엔 ${은는(me(s))} 뭐라고 할래?`,
    d: () => [
      dir("scene", "솔직하게", `"나 그 말 들으면 좀 힘들어" 라고 말할래.`),
      dir("feeling", "가볍게", `"야, 나도 껴줘~" 하고 가볍게 던질래.`),
      dir("turn", "자리를 뜰래", `이번에도 아무 말 안 하고, 대신 그냥 자리를 뜰래.`),
      dir("hold", "똑같이 할래", `그냥 그때랑 똑같이 할래. 그게 나야.`),
    ],
  },
  {
    id: "replay.body", lens: "body",
    q: () => `그 말을 한다고 상상하면 몸이 어때?`,
    d: () => [
      dir("scene", "두근거려", `심장이 엄청 빨리 뛰어.`),
      dir("feeling", "무서워", `무서워. 말하고 나면 뭔가 망가질 것 같아.`),
      dir("turn", "시원해", `생각보다 좀 시원해.`),
      dir("hold", "아무 느낌", `아무 느낌 없어.`),
    ],
  },
  {
    id: "replay.cost", lens: "cost",
    q: () => `그 말을 하면 뭐가 달라질 것 같아? 그리고 뭐가 제일 무서워?`,
    d: () => [
      dir("scene", "관계가 달라져", `걔랑 사이가 달라질 것 같아.`),
      dir("feeling", "안 변할까 봐", `말했는데 아무것도 안 변할까 봐 무서워.`),
      dir("turn", "의외로 괜찮을지도", `의외로 별일 아닐 수도 있어.`),
      dir("hold", "모르겠어", `모르겠어. 해봐야 알 것 같아.`),
    ],
  },
  {
    id: "replay.again", lens: "again",
    q: () => `또 다른 버전으로도 해볼래? 이번엔 아예 다르게.`,
    d: () => [
      dir("scene", "터뜨리기", `이번엔 참지 않고 다 말해버릴래.`),
      dir("feeling", "조용히", `조용히 딱 한 마디만 할래.`),
      dir("turn", "먼저 묻기", `내가 먼저 물어볼래. 너 왜 그러냐고.`),
      dir("hold", "그만할래", `이제 충분해. 그만할래.`),
    ],
  },
];

/** josa 헬퍼가 없는 조합을 위한 작은 보정 */
function 랑안전(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  const hasJong = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${name}${hasJong ? "이랑" : "랑"}`;
}

const BANK: Record<MovementId, Q[]> = {
  casting: CASTING,
  draw: [],
  open: OPEN,
  deepen: DEEPEN,
  meet: MEET,
  mirror: MIRROR,
  replay: REPLAY,
  curtain: [],
};

/** 막 오프닝이 이미 던진 질문(openingLens)에 붙는 방향 칩 */
export function openingDirections(m: Movement, s: SessionState): Direction[] {
  if (!m.openingLens) return [];
  const q = (BANK[m.id] ?? []).find((x) => x.lens === m.openingLens);
  return q ? q.d(s) : [];
}

/* ══════════════════════════════════════════════════════
 * 스레드 — 유저가 방금 쓴 말에서 아직 안 펼친 조각을 뽑는다
 * ════════════════════════════════════════════════════ */

const THREAD_STOP = /^(그리고|근데|그래서|진짜|너무|완전|약간|그냥|나는|내가|우리|자기|이런|저런|그런|것도|건데|같아|같은|있어|없어|했어|해서|하고|하는|되는|말이|거야|거든)$/;
/** 조종 문구 — 이야기 재료가 아니므로 스레드로 잡지 않는다 */
const CONTROL = /(다음 장면|다른 얘기|더 할래|마무리할래|여기까지 할래|그만할래)/;

/** 유저 문장에서 "더 물어볼 만한" 조각을 뽑는다 */
export function pullThreads(text: string): string[] {
  if (CONTROL.test(text)) return [];
  const out: string[] = [];
  // 따옴표로 감싼 말은 통째로 한 조각
  for (const m of text.matchAll(/["'“”‘’「」](.{2,30}?)["'“”‘’「」]/g)) {
    out.push(m[1].trim());
  }
  // 구·절 단위로 쪼개서 의미 있는 덩어리만
  for (const raw of text.split(/[.,!?~\n·]|그리고|근데|그래서/)) {
    const t = raw.trim();
    if (t.length < 4 || t.length > 28) continue;
    if (THREAD_STOP.test(t)) continue;
    if (out.some((x) => x.includes(t) || t.includes(x))) continue;
    out.push(t);
    if (out.length >= 4) break;
  }
  return out.slice(0, 3);
}

/** 스레드를 여는 질문 문형 — 돌려쓴다 */
const THREAD_Q = [
  (t: string) => `"${t}" — 그거 조금 더 말해줄래?`,
  (t: string) => `아까 "${t}"라고 했잖아. 그때 어땠어?`,
  (t: string) => `"${t}", 그게 무슨 얘기야?`,
  (t: string) => `"${t}" 이 부분이 걸려. 거기서부터 가볼까?`,
  (t: string) => `"${t}" — 이 말이 제일 크게 들렸어. 여기 더 있어?`,
];

const threadDirs = (t: string): Direction[] => [
  dir("scene", "그때 일", `${t} — 그거 그때 이런 일이 있었어.`),
  dir("feeling", "그때 마음", `${t} 그럴 때 마음이 좀 복잡해.`),
  dir("turn", "사실은", `사실 그거는 다른 얘기랑 얽혀 있어.`),
  dir("hold", "그건 넘길래", `그 얘기는 지금 말고.`),
];

/* ══════════════════════════════════════════════════════
 * 비트 생성
 * ════════════════════════════════════════════════════ */

const REACTS = [
  (w: string) => `"${w}" — 그렇게 썼구나.`,
  (w: string) => `${w}. 그 말 그대로 들을게.`,
  () => `응, 여기까지 들었어.`,
  (w: string) => `"${w}" 이 말이 남네.`,
  () => `그랬구나.`,
];

/**
 * 규칙 기반 열린 비트.
 * used에 이미 쓴 질문 id가 들어 있고, 소진되면 스레드 질문으로 넘어간다.
 */
export function localBeat(
  m: Movement,
  s: SessionState,
  beats: number,
  lastUser: string,
  used: string[]
): OpenBeat {
  const threads = lastUser ? pullThreads(lastUser) : [];
  const openThreads = (s.threads ?? []).filter((t) => !t.pulled);

  const react = lastUser
    ? REACTS[beats % REACTS.length](lastUser.slice(0, 18))
    : "";

  const bank = BANK[m.id] ?? [];
  const fresh = bank.filter((q) => !used.includes(q.id));

  // 은행이 남아 있으면 은행에서, 다 썼으면 유저가 흘린 실마리로 이어간다
  if (fresh.length) {
    // 앞에서부터가 아니라 비트 수에 따라 옮겨가며 골라서 매번 다른 각도로
    const pick = fresh[beats % fresh.length];
    return {
      react,
      question: pick.q(s),
      lens: pick.lens,
      threads,
      directions: pick.d(s),
      suggestNext: beats >= m.suggestAfter,
    };
  }

  if (openThreads.length) {
    const t = openThreads[beats % openThreads.length];
    return {
      react,
      question: THREAD_Q[beats % THREAD_Q.length](t.text),
      lens: "free",
      threads,
      directions: threadDirs(t.text),
      suggestNext: beats >= m.suggestAfter,
    };
  }

  // 은행도 스레드도 없으면 — 유저에게 핸들을 완전히 넘긴다
  return {
    react,
    question: "여기서 더 하고 싶은 얘기 있어? 아무 데서나 시작해도 돼.",
    lens: "free",
    threads,
    directions: [
      dir("scene", "다른 장면", "다른 일이 하나 더 떠올랐어."),
      dir("feeling", "지금 기분", "지금 이 얘기 하면서 드는 기분이 있어."),
      dir("turn", "딴 얘기", "완전 다른 얘기 해도 돼?"),
      dir("hold", "여기까지", "오늘은 여기까지 할래."),
    ],
    suggestNext: true,
  };
}
