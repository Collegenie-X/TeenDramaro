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
import { type DepthLevel, type DepthMove, nextDepth } from "./depth";
import { cardById } from "./cards";
import { 은는, 을를, 이가 } from "./josa";

export type OpenBeat = {
  react: string;
  question: string;
  lens: string;
  threads: string[];
  directions: Direction[];
  suggestNext: boolean;
  /**
   * 이 비트가 쓴 은행 질문의 id. 소진 기록은 lens가 아니라 이 id로 한다 —
   * lens가 "free"인 질문이 여러 개 있으므로 lens로 기록하면 소진이 안 되고
   * 같은 질문이 되풀이된다.
   */
  qid?: string;
  /** 이 비트가 겨냥한 단계도의 단 */
  depth: DepthLevel;
  /** 이번에 깊이를 어떻게 움직였는지 */
  depthMove: DepthMove;
  /** 왜 그렇게 움직였는지 — 개발용 추적 */
  depthWhy: string;
};

const me = (s: SessionState) => s.character.name || "주인공";
const you = (s: SessionState) => s.other.name || "그 사람";
const card = (s: SessionState) => (s.cardId ? cardById(s.cardId) : null);

/**
 * 은행 질문 하나.
 * depth는 이 질문이 겨냥한 단계도의 단(L1~L7)이다. localBeat이 목표 깊이에
 * 가장 가까운 질문을 고르므로, 같은 막 안에서도 깊이가 한 칸씩 내려간다.
 */
type Q = {
  id: string;
  lens: string;
  depth: DepthLevel;
  q: (s: SessionState) => string;
  d: (s: SessionState) => Direction[];
};

const dir = (kind: Direction["kind"], label: string, text: string, depth?: number): Direction =>
  ({ kind, label, text, depth });

/* ══════════════════════════════════════════════════════
 * 막별 질문 은행 — 하나씩 소진하며 쓴다
 * ════════════════════════════════════════════════════ */

/**
 * 캐스팅 — 설정을 채우는 자리가 아니라 거리(距離)를 만드는 자리다.
 *
 * 무대에 서는 건 유저가 아니라 유저가 만든 애다. 유저는 무대를 세우고
 * 그 애를 상황에 던지는 사람이다. 그래서 캐릭터는 무난하면 안 된다 —
 * 제일 약한 지점과 제일 센 지점을 둘 다, 극단적으로 받는다.
 * 무난한 캐릭터로는 투사가 걸리지 않고, 무대에서 아무 일도 안 일어난다.
 *
 * 마지막에 상황을 받는다(casting.throw). 유저가 여기 온 이유는
 * "나 요즘 힘들어"가 아니라 "이 애를 여기에 던질래"로 들어온다.
 */
const CASTING: Q[] = [
  {
    id: "casting.name", lens: "name", depth: 1,
    q: () => `이름부터 하나 지어줘. 진짜 이름 말고.`,
    d: () => [
      dir("scene", "소라", `소라로 할래.`, 1),
      dir("feeling", "나랑 닮은 애", `하늘. 나랑 좀 닮은 애야.`, 1),
      dir("turn", "정반대인 애", `아예 나랑 안 닮은 애로 할래. 이름은 바다.`, 1),
      dir("hold", "네가 정해", `아무 이름이나 네가 정해줘.`, 1),
    ],
  },
  {
    id: "casting.weak", lens: "weak", depth: 1,
    q: (s) => `${me(s)}의 제일 약한 데는 어디야? 무난하게 말고, 진짜 극단적으로 줘봐.`,
    d: (s) => [
      dir("scene", "거절을 못 해", `거절을 아예 못 해. 싫어도 다 알았다고 해.`, 1),
      dir("feeling", "버려질까 봐", `혼자 남는 걸 제일 무서워해. 그래서 다 맞춰줘.`, 2),
      dir("turn", "터지면 크게", `평소엔 조용한데 한번 터지면 아예 관계를 끊어버려.`, 2),
      dir("hold", "천천히", `그건 하다가 정할래.`, 1),
    ],
  },
  {
    id: "casting.strong", lens: "strong", depth: 1,
    q: (s) => `반대로 ${me(s)}의 제일 센 데는? 이것도 세게.`,
    d: (s) => [
      dir("scene", "끝까지 버텀", `한번 마음먹으면 끝까지 버텨. 아무도 못 말려.`, 1),
      dir("feeling", "다 알아챔", `남 기분을 너무 빨리 알아채. 그게 재능이자 병이야.`, 2),
      dir("turn", "센 데가 없어", `센 데가 없는 애야. 그게 이 애 특징이야.`, 2),
      dir("hold", "아직", `강한 건 아직 모르겠어.`, 1),
    ],
  },
  {
    id: "casting.gap", lens: "gap", depth: 2,
    q: (s) => `남들은 ${을를(me(s))} 어떤 애로 알고 있어? 속과 얼마나 달라?`,
    d: (s) => [
      dir("scene", "밝은 애로", `애들은 제일 밝은 애라고 생각해. 완전 반대야.`, 2),
      dir("feeling", "있는지 없는지", `조용해서 있는지 없는지 몰라. 속은 시끄러운데.`, 2),
      dir("turn", "무서운 애로", `애들이 좀 무서워해. 사실 제일 겁이 많은데.`, 2),
      dir("hold", "똑같아", `겉이랑 속이 똑같은 애야.`, 2),
    ],
  },
  {
    id: "casting.throw", lens: "throw", depth: 2,
    q: (s) => `자, 무대는 네가 만들어. 오늘 ${을를(me(s))} 어떤 상황에 던질래?`,
    d: (s) => [
      dir("scene", "그날로", `며칠 전에 실제로 있었던 상황에 던질래.`, 2),
      dir("feeling", "제일 싫은 자리", `이 애가 제일 있고 싶지 않은 자리에 던질래.`, 2),
      dir("turn", "아직 안 온 일", `아직 안 일어난 일인데, 곧 닥칠 상황에 던질래.`, 2),
      dir("hold", "네가 던져", `어디로 던질지 네가 골라줘.`, 1),
    ],
  },
  {
    id: "casting.mine", lens: "mine", depth: 3,
    q: (s) => `${me(s)}의 어디가 너랑 제일 닮았어? 말 안 해도 돼.`,
    d: (s) => [
      dir("scene", "약한 데가", `약한 데는 거의 나야.`, 3),
      dir("feeling", "안 닮은 데가", `센 데는 내가 갖고 싶은 거야. 나는 저렇게 못 해.`, 3),
      dir("turn", "아무 상관 없어", `완전 다른 애야. 나랑 아무 상관 없어.`, 2),
      dir("hold", "그건 패스", `그건 말 안 할래.`, 2),
    ],
  },
];

const OPEN: Q[] = [
  {
    id: "open.what", lens: "what", depth: 2,
    q: (s) => `${me(s)}한테 요즘 무슨 일이 있었어?`,
    d: (s) => [
      dir("scene", "그날 일", `며칠 전에 있었던 일이 계속 생각나.`),
      dir("feeling", "사건보다 분위기", `무슨 사건이 있었다기보다, 요즘 계속 기분이 가라앉아 있어.`),
      dir("turn", "좋은 일도", `사실 나쁜 일만 있었던 건 아닌데, 그게 더 이상해.`),
      dir("hold", "말로 안 돼", `뭔가 있긴 한데 말로 정리가 안 돼.`),
    ],
  },
  {
    id: "open.scene", lens: "scene", depth: 2,
    q: () => `그게 언제였어? 어디였고, 누가 있었어?`,
    d: () => [
      dir("scene", "학교에서", `학교에서였어. 애들 다 있는 데서.`),
      dir("feeling", "혼자였어", `그때 나 혼자였어. 그게 제일 컸어.`),
      dir("turn", "집에서", `집이었어. 밖에서 있었던 일보다 집이 더 힘들어.`),
      dir("hold", "잘 기억 안 나", `언제였는지 잘 기억이 안 나. 여러 번이라서.`),
    ],
  },
  {
    id: "open.moment", lens: "moment", depth: 2,
    q: () => `그 일에서 제일 선명하게 남은 장면이 뭐야? 한 컷만 꺼내봐.`,
    d: () => [
      dir("scene", "누가 한 말", `누가 했던 말 한마디가 계속 남아 있어.`),
      dir("feeling", "표정", `그때 누가 지은 표정이 안 잊혀.`),
      dir("turn", "엉뚱한 게", `이상하게 그때 창밖 풍경이 제일 선명해.`),
      dir("hold", "흐릿해", `전체적으로 다 흐릿해. 느낌만 남아 있어.`),
    ],
  },
  {
    id: "open.body", lens: "body", depth: 3,
    q: () => `그 순간에 몸은 어땠어? 목이 막혔어, 가슴이 눌렸어, 아니면 아무 느낌 없었어?`,
    d: () => [
      dir("scene", "몸이 굳었어", `몸이 딱 굳었어. 움직여지지가 않았어.`),
      dir("feeling", "가슴이", `가슴이 꽉 눌리는 느낌이었어.`),
      dir("turn", "아무렇지 않았어", `이상하게 아무렇지도 않았어. 그게 더 무서워.`),
      dir("hold", "기억 안 나", `몸이 어땠는지는 기억 안 나.`),
    ],
  },
  {
    id: "open.after", lens: "after", depth: 2,
    q: () => `그 일 끝나고 나서 뭐 했어?`,
    d: () => [
      dir("scene", "그냥 지나갔어", `아무 일 없던 것처럼 그냥 다음 수업 갔어.`),
      dir("feeling", "혼자 있었어", `집에 와서 한참 가만히 있었어.`),
      dir("turn", "딴 걸 했어", `일부러 다른 거에 정신 팔았어. 안 생각하려고.`),
      dir("hold", "모르겠어", `뭐 했는지 기억이 안 나.`),
    ],
  },
  {
    id: "open.before", lens: "before", depth: 2,
    q: () => `그게 처음이었어? 아니면 전에도 비슷한 적 있었어?`,
    d: () => [
      dir("scene", "전에도", `전에도 있었어. 한두 번이 아니야.`),
      dir("feeling", "처음이야", `이번이 처음이야. 그래서 더 당황했어.`),
      dir("turn", "옛날부터", `사실 되게 어릴 때부터 그랬던 것 같아.`),
      dir("hold", "생각 안 해봤어", `그건 생각 안 해봤어.`),
    ],
  },
  {
    id: "open.other", lens: "other", depth: 2,
    q: () => `그 자리에 다른 사람도 있었어? 걔들은 어땠어?`,
    d: () => [
      dir("scene", "다들 있었어", `애들 다 있었어. 근데 아무도 아무 말 안 했어.`),
      dir("feeling", "한 명은", `한 명은 알아챈 것 같았는데, 그냥 넘어갔어.`),
      dir("turn", "아무도 없었어", `아무도 없었어. 그래서 아무도 모르는 일이야.`),
      dir("hold", "신경 못 썼어", `다른 사람까지는 신경 못 썼어.`),
    ],
  },
  {
    id: "open.elsewhere", lens: "elsewhere", depth: 2,
    q: () => `이 얘기 말고, 오늘 마음에 걸리는 다른 것도 있어?`,
    d: () => [
      dir("scene", "다른 일", `사실 이거 말고 다른 일도 있어.`),
      dir("feeling", "이게 제일 커", `아니, 지금은 이게 제일 커.`),
      dir("turn", "전혀 다른 얘기", `전혀 다른 얘긴데 요즘 이것 때문에 더 힘들어.`),
      dir("hold", "이거면 돼", `오늘은 이 얘기만 할래.`),
    ],
  },
  {
    id: "open.feelname", lens: "free", depth: 4,
    q: () => `그 장면에 지금 이름을 붙인다면, 무슨 기분의 장면이야?`,
    d: () => [
      dir("scene", "혼자인 장면", `혼자 남겨진 장면이야.`, 4),
      dir("feeling", "부끄러운 장면", `창피했던 장면이야. 그게 제일 커.`, 4),
      dir("turn", "아무 기분 아냐", `별 기분 아닌데 왜 남아 있는지 모르겠어.`, 4),
      dir("hold", "안 붙일래", `이름은 안 붙이고 싶어.`, 3),
    ],
  },
];

const DEEPEN: Q[] = [
  {
    id: "deepen.core", lens: "core", depth: 4,
    q: () => `그 일에서 제일 아팠던 데가 어디야? 사건 자체야, 아니면 다른 거야?`,
    d: () => [
      dir("scene", "그 말이", `누가 한 말 자체가 아팠어.`),
      dir("feeling", "혼자라는 게", `그 일보다 아무도 몰랐다는 게 더 아팠어.`),
      dir("turn", "내 반응이", `사실 그 일보다 내가 아무 말 못 한 게 더 싫어.`),
      dir("hold", "모르겠어", `어디가 제일 아팠는지 모르겠어.`),
    ],
  },
  {
    id: "deepen.voice", lens: "voice", depth: 6,
    q: () => `그때 머릿속에서 맴돈 말이 있어? 그게 누구 목소리로 들려?`,
    d: () => [
      dir("scene", "내 목소리", `'왜 나만 이래' — 내 목소리였어.`),
      dir("feeling", "누가 하던 말", `예전에 누가 했던 말이 그대로 들려.`),
      dir("turn", "아무 소리 없음", `아무 말도 안 들렸어. 그냥 하얬어.`),
      dir("hold", "말 안 할래", `그건 지금 말하기 싫어.`),
    ],
  },
  {
    id: "deepen.first", lens: "first", depth: 6,
    q: () => `이 느낌, 언제부터 알고 있었어?`,
    d: () => [
      dir("scene", "올해부터", `올해 들어서 심해졌어.`),
      dir("feeling", "오래됐어", `꽤 오래됐어. 익숙해질 정도로.`),
      dir("turn", "어릴 때부터", `초등학교 때도 비슷한 게 있었던 것 같아.`),
      dir("hold", "모르겠어", `언제부터인지 모르겠어.`),
    ],
  },
  {
    id: "deepen.fear", lens: "fear", depth: 5,
    q: (s) => `${이가(me(s))} 제일 무서워하는 게 뭘 것 같아? 일어날까 봐 겁나는 거.`,
    d: () => [
      dir("scene", "또 그럴까 봐", `또 똑같은 일이 생길까 봐.`),
      dir("feeling", "들킬까 봐", `내가 이런 상태라는 걸 들킬까 봐.`),
      dir("turn", "안 변할까 봐", `무서운 건 사건이 아니라 이게 영영 안 변할까 봐야.`),
      dir("hold", "생각 안 할래", `그건 생각하고 싶지 않아.`),
    ],
  },
  {
    id: "deepen.want", lens: "want", depth: 7,
    q: () => `그 순간에 진짜로 원했던 건 뭐였어?`,
    d: () => [
      dir("scene", "누가 물어봐주길", `누가 괜찮냐고 한 번만 물어봐줬으면 했어.`),
      dir("feeling", "사라지고 싶었어", `그냥 그 자리에서 사라지고 싶었어.`),
      dir("turn", "아무것도", `아무것도 안 원했어. 그게 문제인 것 같아.`),
      dir("hold", "모르겠어", `뭘 원했는지 모르겠어.`),
    ],
  },
  {
    id: "deepen.cost", lens: "cost", depth: 7,
    q: (s) => `그렇게 버티느라 ${이가(me(s))} 포기한 게 있을까?`,
    d: () => [
      dir("scene", "사람", `친했던 애들이랑 멀어졌어.`),
      dir("feeling", "표현", `하고 싶은 말을 안 하는 게 습관이 됐어.`),
      dir("turn", "좋아하던 거", `원래 좋아하던 게 있었는데 이제 재미가 없어.`),
      dir("hold", "잘 모르겠어", `포기한 게 있는지 잘 모르겠어.`),
    ],
  },
  {
    id: "deepen.exception", lens: "exception", depth: 5,
    q: () => `그렇지 않았던 때도 있었어? 조금이라도 편했던 순간.`,
    d: () => [
      dir("scene", "한 번 있었어", `딱 한 번, 괜찮았던 날이 있었어.`),
      dir("feeling", "누구랑 있을 때", `어떤 애랑 있을 때는 좀 나아.`),
      dir("turn", "혼자일 때", `이상하게 혼자 있을 때가 제일 편해.`),
      dir("hold", "없었어", `그런 때는 없었던 것 같아.`),
    ],
  },

  /* ── 여기부터 감정 심층 — 단계도 L3~L7을 한 칸씩 채우는 질문들 ── */

  {
    id: "deepen.bodynow", lens: "free", depth: 3,
    q: () => `지금 이 얘기 하면서도 몸이 반응해? 어디가 먼저 반응하는지 알겠어?`,
    d: () => [
      dir("scene", "지금도 눌려", `지금도 가슴이 눌리는 느낌이야.`, 3),
      dir("feeling", "숨이 얕아", `말하다 보니까 숨이 얕아졌어.`, 3),
      dir("turn", "오히려 풀려", `이상하게 말하니까 좀 풀리는 느낌이야.`, 3),
      dir("hold", "아무 느낌", `지금은 아무 느낌 없어.`, 2),
    ],
  },
  {
    id: "deepen.locate", lens: "free", depth: 3,
    q: () => `그 느낌은 무거워, 뜨거워, 아니면 차가워?`,
    d: () => [
      dir("scene", "무거워", `무거워. 위에서 누르는 것 같아.`, 3),
      dir("feeling", "뜨거워", `뜨거워. 확 올라오는 느낌이야.`, 3),
      dir("turn", "차가워", `차가워. 텅 비어 있는 느낌에 가까워.`, 3),
      dir("hold", "표현이 안 돼", `뭐라고 표현해야 할지 모르겠어.`, 2),
    ],
  },
  {
    id: "deepen.nameit", lens: "core", depth: 4,
    q: () => `그 느낌을 한 단어로만 말한다면? 정확하지 않아도 돼. 제일 가까운 걸로.`,
    d: () => [
      dir("scene", "억울함", `억울함. 그게 제일 가까워.`, 4),
      dir("feeling", "창피함", `창피한 거였던 것 같아.`, 4),
      dir("turn", "둘 다 아니야", `화도 슬픔도 아니야. 그냥 텅 빈 느낌.`, 4),
      dir("hold", "한 단어로 안 돼", `한 단어로는 안 될 것 같아.`, 3),
    ],
  },
  {
    id: "deepen.mix", lens: "core", depth: 4,
    q: () => `그 안에 두 가지가 섞여 있을 수도 있어. 그럴까?`,
    d: () => [
      dir("scene", "화랑 슬픔", `화나는 거랑 슬픈 게 같이 있어.`, 4),
      dir("feeling", "미안함도", `싫으면서 동시에 미안해. 그게 제일 헷갈려.`, 4),
      dir("turn", "안도도 있어", `이상하게 조금 편해진 것도 있어. 그게 죄책감 나.`, 5),
      dir("hold", "하나인 것 같아", `하나인 것 같아. 그냥 그거 하나야.`, 4),
    ],
  },
  {
    id: "deepen.under", lens: "free", depth: 5,
    q: () => `그 밑에 다른 게 깔려 있을까? 화 밑에 서운함 같은 거.`,
    d: () => [
      dir("scene", "서운함", `화난 것처럼 보였는데 사실 서운했던 것 같아.`, 5),
      dir("feeling", "무서움", `밑에는 무서움이 있었던 것 같아.`, 5),
      dir("turn", "아무것도 없어", `밑에는 아무것도 없어. 그게 다야.`, 5),
      dir("hold", "거기까진 못 봐", `거기까지는 못 보겠어.`, 4),
    ],
  },
  {
    id: "deepen.armor", lens: "free", depth: 5,
    q: () => `그 기분이 뭔가를 지켜주고 있었을 수도 있어. 뭘 지켜주고 있었을까?`,
    d: () => [
      dir("scene", "안 다치게", `더 안 다치게 막아주고 있었던 것 같아.`, 5),
      dir("feeling", "안 들키게", `내가 흔들리는 걸 안 들키게 해줬어.`, 5),
      dir("turn", "아무것도 안 지켜", `아무것도 안 지켜줬어. 그냥 나만 힘들었어.`, 5),
      dir("hold", "모르겠어", `그건 생각해본 적 없어.`, 4),
    ],
  },
  {
    id: "deepen.youngest", lens: "first", depth: 6,
    q: () => `이 기분을 제일 어렸을 때 느낀 게 언제야? 떠오르는 장면이 있어?`,
    d: () => [
      dir("scene", "초등학교 때", `초등학교 때 비슷한 일이 있었어.`, 6),
      dir("feeling", "집에서", `집에서 그런 기분을 자주 느꼈어.`, 6),
      dir("turn", "더 어릴 때", `기억도 안 날 만큼 어릴 때부터 있었던 것 같아.`, 6),
      dir("hold", "떠오르는 게 없어", `떠오르는 게 없어.`, 5),
    ],
  },
  {
    id: "deepen.unsaid", lens: "want", depth: 7,
    q: () => `그때 못 한 말이 있다면 뭐야? 아무한테도 못 한 말.`,
    d: () => [
      dir("scene", "그 사람한테", `"왜 나한테 그랬어" 라고 묻고 싶었어.`, 7),
      dir("feeling", "나한테", `나한테 "괜찮다"고 말해주고 싶었어.`, 7),
      dir("turn", "아무 말도", `말이 아니라 그냥 사라지고 싶었어.`, 7),
      dir("hold", "지금은 안 할래", `그 말은 지금은 안 할래.`, 5),
    ],
  },
];

const MEET: Q[] = [
  {
    id: "meet.who", lens: "who", depth: 2,
    q: (s) => `${me(s)} 주변에, 마주치면 마음이 복잡해지는 사람 있어? 이름을 지어줘.`,
    d: () => [
      dir("scene", "친한 애", `겉으로는 제일 친한 애야. 그래서 더 복잡해.`),
      dir("feeling", "어른", `또래가 아니라 어른이야.`),
      dir("turn", "사람이 아니야", `사람이 아니라 단톡방이야. 알림 뜰 때마다 마음이 내려앉아.`),
      dir("hold", "없어", `없어. 사람 얘기는 안 하고 싶어.`),
    ],
  },
  {
    id: "meet.line", lens: "line", depth: 2,
    q: (s) => `${이가(you(s))} 뭐라고 할 때 제일 힘들어? 그 말 그대로 적어줘.`,
    d: (s) => [
      dir("scene", "그 한마디", `"너는 괜찮잖아" 이 말이 제일 힘들어.`),
      dir("feeling", "말이 아니라", `말이 아니라 그냥 쳐다보는 눈빛이 힘들어.`),
      dir("turn", "아무 말 안 해", `아무 말도 안 하는 게 제일 힘들어.`),
      dir("hold", "옮기기 어려워", `그 말 그대로 옮기기는 좀 어려워.`),
    ],
  },
  {
    id: "meet.react", lens: "react", depth: 2,
    q: (s) => `그때 ${은는(me(s))} 뭐라고 해? 아니면 아무 말 안 해?`,
    d: () => [
      dir("scene", "웃고 넘겼어", `그냥 웃으면서 넘겼어.`),
      dir("feeling", "괜찮은 척", `괜찮다고 했어. 사실 안 괜찮았는데.`),
      dir("turn", "받아쳤어", `짜증을 냈어. 그리고 바로 후회했어.`),
      dir("hold", "아무것도", `아무것도 안 했어. 그냥 가만히 있었어.`),
    ],
  },
  {
    id: "meet.inner", lens: "inner", depth: 5,
    q: () => `겉으로 한 거랑 속으로 한 말이 달랐어? 속에서는 뭐라고 했어?`,
    d: () => [
      dir("scene", "하고 싶던 말", `사실 하고 싶은 말이 있었는데 삼켰어.`),
      dir("feeling", "'왜 나만'", `'왜 나한테만 이래' 하는 말이 맴돌았어.`),
      dir("turn", "똑같았어", `겉이랑 속이 똑같았어. 진짜 아무 생각 없었어.`),
      dir("hold", "말 안 할래", `속으로 한 말은 말하기 싫어.`),
    ],
  },
  {
    id: "meet.history", lens: "history", depth: 2,
    q: (s) => `${랑안전(you(s))} 원래는 어떤 사이였어?`,
    d: () => [
      dir("scene", "원래 친했어", `원래 제일 친했어. 그래서 더 이상해.`),
      dir("feeling", "늘 어려웠어", `처음부터 좀 어려운 사이였어.`),
      dir("turn", "어느 날부터", `어느 날 갑자기 달라졌어. 이유는 몰라.`),
      dir("hold", "잘 몰라", `무슨 사이인지 나도 잘 모르겠어.`),
    ],
  },
  {
    id: "meet.guess", lens: "guess", depth: 3,
    q: (s) => `${은는(you(s))} 그때 무슨 생각이었을 것 같아?`,
    d: () => [
      dir("scene", "별생각 없었을 듯", `별생각 없었을 것 같아. 그냥 하던 대로.`),
      dir("feeling", "알면서", `알면서 그랬을 것 같아.`),
      dir("turn", "걔도 힘들었을지도", `사실 걔도 뭔가 힘들었을 수도 있어.`),
      dir("hold", "모르겠어", `걔 생각까지는 모르겠어.`),
    ],
  },
  {
    id: "meet.wish", lens: "wish", depth: 5,
    q: (s) => `${you(s)}한테 진짜로 하고 싶었던 말이 있어?`,
    d: () => [
      dir("scene", "직접 하고 싶은 말", `"나도 좀 껴줘" 라고 말하고 싶었어.`),
      dir("feeling", "물어보고 싶은 것", `나한테 왜 그러는지 물어보고 싶었어.`),
      dir("turn", "아무 말도", `아무 말도 하고 싶지 않아. 그냥 멀어지고 싶어.`),
      dir("hold", "지금은 안 할래", `그 말은 지금은 안 할래.`),
    ],
  },
  {
    id: "meet.stand", lens: "free", depth: 2,
    q: (s) => `그 장면에서 둘이 어디 서 있어? ${은는(me(s))} 어디고, 그 사람은 어디야?`,
    d: () => [
      dir("scene", "마주 보고", `마주 보고 서 있어. 거리가 꽤 가까워.`, 2),
      dir("feeling", "등지고", `나는 등지고 있어. 얼굴을 안 보고 싶어서.`, 2),
      dir("turn", "둘러싸여", `걔 혼자가 아니야. 애들 여러 명이 같이 있어.`, 2),
      dir("hold", "기억 안 나", `어디 있었는지는 기억 안 나.`, 2),
    ],
  },
  {
    id: "meet.face", lens: "free", depth: 3,
    q: (s) => `${은는(you(s))} 그때 어떤 표정이야? 몸은 어디를 향하고 있어?`,
    d: () => [
      dir("scene", "웃고 있어", `웃고 있어. 근데 그 웃음이 제일 싫었어.`, 3),
      dir("feeling", "안 봐", `나를 안 봐. 딴 데 보면서 말해.`, 3),
      dir("turn", "아무 표정 없어", `아무 표정도 없어. 그게 더 무서워.`, 3),
      dir("hold", "못 봤어", `표정까지는 못 봤어.`, 2),
    ],
  },
];

const MIRROR: Q[] = [
  {
    id: "mirror.fix", lens: "fix", depth: 4,
    q: () => `이 이야기 어때? 맞는 부분, 아닌 부분 말해줘.`,
    d: () => [
      dir("scene", "대체로 맞아", `대체로 맞아. 근데 한 군데가 좀 달라.`),
      dir("feeling", "느낌이 달라", `사건은 맞는데 느낌이 좀 달라.`),
      dir("turn", "완전 달라", `읽어보니까 내 얘기 같지 않아.`),
      dir("hold", "모르겠어", `맞는지 아닌지 모르겠어.`),
    ],
  },
  {
    id: "mirror.missing", lens: "missing", depth: 4,
    q: () => `이 이야기에서 빠진 게 있어?`,
    d: () => [
      dir("scene", "빠진 장면", `중요한 장면이 하나 빠졌어.`),
      dir("feeling", "빠진 마음", `그때 진짜 기분이 안 들어갔어.`),
      dir("turn", "사람이 빠졌어", `이 얘기에 나오지 않은 사람이 한 명 더 있어.`),
      dir("hold", "다 들어갔어", `다 들어간 것 같아.`),
    ],
  },
  {
    id: "mirror.title", lens: "title", depth: 4,
    q: () => `이 이야기에 제목을 붙인다면 뭐라고 할래?`,
    d: () => [
      dir("scene", "장면으로", `"복도에서" 같은 걸로 하고 싶어.`),
      dir("feeling", "마음으로", `"아무도 몰랐다" 같은 제목.`),
      dir("turn", "반대로", `일부러 정반대 제목을 붙이고 싶어.`),
      dir("hold", "안 붙일래", `제목은 안 붙일래.`),
    ],
  },
  {
    id: "mirror.outside", lens: "free", depth: 5,
    q: (s) => `밖에서 보니까 ${이가(me(s))} 어때 보여? 남 얘기처럼 들으면 뭐가 달라?`,
    d: () => [
      dir("scene", "안됐어 보여", `밖에서 보니까 좀 안됐어 보여.`, 5),
      dir("feeling", "덜 잘못한 것 같아", `내 잘못이 아닌 것 같기도 해.`, 5),
      dir("turn", "더 화나", `밖에서 보면 오히려 더 화나.`, 5),
      dir("hold", "똑같아", `밖에서 봐도 똑같아.`, 4),
    ],
  },
  {
    id: "mirror.younger", lens: "free", depth: 6,
    q: (s) => `이 이야기 속 ${이가(me(s))} 너보다 어린 애였다면, 뭐라고 해주고 싶어?`,
    d: () => [
      dir("scene", "괜찮다고", `"네 잘못 아니야" 라고 해주고 싶어.`, 6),
      dir("feeling", "안아주고", `아무 말 안 하고 그냥 옆에 있어주고 싶어.`, 6),
      dir("turn", "화내고 싶어", `왜 가만히 있었냐고 화내고 싶어. 그것도 좀 미안해.`, 6),
      dir("hold", "할 말 없어", `해줄 말이 없어.`, 5),
    ],
  },
];

const REPLAY: Q[] = [
  {
    id: "replay.line", lens: "line", depth: 3,
    q: (s) => `이번엔 ${은는(me(s))} 뭐라고 할래?`,
    d: () => [
      dir("scene", "솔직하게", `"나 그 말 들으면 좀 힘들어" 라고 말할래.`),
      dir("feeling", "가볍게", `"야, 나도 껴줘~" 하고 가볍게 던질래.`),
      dir("turn", "자리를 뜰래", `이번에도 아무 말 안 하고, 대신 그냥 자리를 뜰래.`),
      dir("hold", "똑같이 할래", `그냥 그때랑 똑같이 할래. 그게 나야.`),
    ],
  },
  {
    id: "replay.body", lens: "body", depth: 3,
    q: () => `그 말을 한다고 상상하면 몸이 어때?`,
    d: () => [
      dir("scene", "두근거려", `심장이 엄청 빨리 뛰어.`),
      dir("feeling", "무서워", `무서워. 말하고 나면 뭔가 망가질 것 같아.`),
      dir("turn", "시원해", `생각보다 좀 시원해.`),
      dir("hold", "아무 느낌", `아무 느낌 없어.`),
    ],
  },
  {
    id: "replay.cost", lens: "cost", depth: 5,
    q: () => `그 말을 하면 뭐가 달라질 것 같아? 그리고 뭐가 제일 무서워?`,
    d: () => [
      dir("scene", "관계가 달라져", `걔랑 사이가 달라질 것 같아.`),
      dir("feeling", "안 변할까 봐", `말했는데 아무것도 안 변할까 봐 무서워.`),
      dir("turn", "의외로 괜찮을지도", `의외로 별일 아닐 수도 있어.`),
      dir("hold", "모르겠어", `모르겠어. 해봐야 알 것 같아.`),
    ],
  },
  {
    id: "replay.again", lens: "again", depth: 3,
    q: () => `또 다른 버전으로도 해볼래? 이번엔 아예 다르게.`,
    d: () => [
      dir("scene", "터뜨리기", `이번엔 참지 않고 다 말해버릴래.`),
      dir("feeling", "조용히", `조용히 딱 한 마디만 할래.`),
      dir("turn", "먼저 묻기", `내가 먼저 물어볼래. 너 왜 그러냐고.`),
      dir("hold", "그만할래", `이제 충분해. 그만할래.`),
    ],
  },
  {
    id: "replay.after", lens: "free", depth: 6,
    q: () => `그 말을 하고 나면, 그다음 장면은 어떻게 돼? 상상해볼래?`,
    d: () => [
      dir("scene", "걔가 놀라", `걔가 좀 놀랄 것 같아. 그리고 아무 말 못 할 거야.`, 6),
      dir("feeling", "내가 후회해", `말하고 나서 내가 바로 후회할 것 같아.`, 6),
      dir("turn", "아무 일 없어", `아무 일도 안 일어날 것 같아. 그게 제일 무서워.`, 6),
      dir("hold", "상상 안 돼", `거기까지는 상상이 안 돼.`, 5),
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
 *
 * 고르는 순서:
 *   1. 단계도로 이번 비트의 목표 깊이를 계산한다 (유저 답이 열렸나 닫혔나)
 *   2 아직 안 쓴 질문 중 목표 깊이에 가장 가까운 것을 고른다
 *      → 같은 막 안에서도 사실 → 장면 → 몸 → 감정 → 그 아래로 내려간다
 *   3. 은행이 마르면 유저가 흘린 실마리로 이어간다
 *   4. 그것도 없으면 핸들을 유저에게 넘긴다
 *
 * 앞에서부터 순서대로 뽑지 않는 이유: 은행 순서가 곧 대화의 깊이 순서가 되면
 * 누가 해도 같은 이야기가 나온다. 깊이는 유저의 답이 정한다.
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

  /* 1. 이번 비트의 깊이 — 유저가 방금 쓴 말이 정한다 */
  const cur = (s.depth as DepthLevel) ?? m.depthStart;
  const cue = nextDepth(cur, lastUser, m.depthBand, s.depthBeats ?? 0);
  const tail = { depth: cue.level, depthMove: cue.move, depthWhy: cue.why };

  const bank = BANK[m.id] ?? [];
  let fresh = bank.filter((q) => !used.includes(q.id));

  /* 무대 입장 특례 — 아직 이름이 없으면 이름 질문을 남겨두고, 있으면 빼버린다 */
  if (m.id === "casting") {
    fresh = s.character.name
      ? fresh.filter((q) => q.lens !== "name")
      // 이름은 첫 비트에 묻는다. 그 뒤로는 다른 각도가 먼저다.
      : beats === 0
        ? fresh.filter((q) => q.lens === "name").concat(fresh.filter((q) => q.lens !== "name"))
        : fresh;
  }

  if (fresh.length) {
    // 목표 깊이에 가장 가까운 질문. 동거리면 비트 수로 흔들어 매번 다른 각도로.
    const scored = fresh
      .map((q, i) => ({ q, gap: Math.abs(q.depth - cue.level), i }))
      .sort((a, b) => a.gap - b.gap || ((a.i + beats) % fresh.length) - ((b.i + beats) % fresh.length));
    const pick = scored[0].q;
    return {
      react,
      question: pick.q(s),
      lens: pick.lens,
      qid: pick.id,
      threads,
      directions: pick.d(s),
      suggestNext: beats >= m.suggestAfter,
      ...tail,
      depth: pick.depth,
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
      ...tail,
    };
  }

  // 은행도 스레드도 없으면 — 유저에게 핸들을 완전히 넘긴다
  return {
    react,
    question: "여기서 더 하고 싶은 얘기 있어? 아무 데서나 시작해도 돼.",
    lens: "free",
    threads,
    directions: [
      dir("scene", "다른 장면", "다른 일이 하나 더 떠올랐어.", 2),
      dir("feeling", "지금 기분", "지금 이 얘기 하면서 드는 기분이 있어.", 4),
      dir("turn", "딴 얘기", "완전 다른 얘기 해도 돼?", 1),
      dir("hold", "여기까지", "오늘은 여기까지 할래.", 1),
    ],
    suggestNext: true,
    ...tail,
  };
}
