/** 한국어 조사 · 단어 받기 — 상대 인물과 진행자가 「내 말의 한 단어」를 받아 돌려줄 때 쓴다 */

const lastCode = (w: string) => {
  const c = w.trim().charCodeAt(w.trim().length - 1) - 0xac00;
  return c >= 0 && c <= 11171 ? c % 28 : -1;   // -1 = 한글 아님
};
export const hasBatchim = (w: string) => lastCode(w) > 0;

const PAIRS: Record<string, [string, string]> = {
  // 키: 템플릿에 쓴 꼴 → [받침 없을 때, 받침 있을 때]
  "라": ["라", "이라"], "이라": ["라", "이라"],
  "는": ["는", "은"], "은": ["는", "은"],
  "가": ["가", "이"], "이": ["가", "이"],
  "를": ["를", "을"], "을": ["를", "을"],
  "면": ["면", "이면"], "이면": ["면", "이면"],
  "로": ["로", "으로"], "으로": ["로", "으로"],
};

export function josa(w: string, form: string): string {
  const pair = PAIRS[form];
  if (!pair) return w + form;
  const code = lastCode(w);
  if (form === "로" || form === "으로") return w + (code <= 0 || code === 8 ? "로" : "으로");   // ㄹ 받침은 「로」
  return w + (code > 0 ? pair[1] : pair[0]);
}

/** {w}라니 · {w}는 · {alias}가 … 처럼 자리 뒤 조사를 받침에 맞춘다 */
export function fillJosa(tpl: string, vars: Record<string, string | undefined>): string {
  return tpl.replace(/\{(\w+)\}(이라|라|은|는|이면|면|으로|로|을|를|이|가)?/g, (_, k: string, j?: string) => {
    const v = vars[k] ?? "";
    return j ? josa(v, j) : v;
  });
}

const JOSA_TAIL = /(으로는|에서는|에게는|한테는|이라고|라고|이랑|에서|에게|한테|까지|부터|으로|처럼|보다|이나|은|는|이|가|을|를|에|의|도|만|로|와|과|요|랑)$/;
const STOP = new Set([
  "그냥", "근데", "그래서", "진짜", "아니", "내가", "너가", "네가", "우리", "그거", "이거", "저거",
  "뭐야", "왜냐", "있어", "없어", "했어", "하는", "그래", "그럼", "근데", "아니야", "몰라", "알아",
  "그게", "이게", "저게", "그런", "이런", "너무", "완전", "그리고", "하고", "있는", "없는",
  "나도", "너도", "나는", "너는", "나를", "너를", "저도", "사실", "솔직히", "제일", "오늘",
]);

const VERBISH = /(해|했|어|아|지|걸|야|다|요|게|까|네|고|는|던|을|은|래|면|죠)$/;

/** 내 말에서 받아칠 한 단어 — 조사 떼고, 군말 빼고, 제일 긴 것 */
export function pickWord(text: string): string {
  const tokens = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (t.length > 2 ? t.replace(JOSA_TAIL, "") : t))
    .filter((t) => t.length >= 2 && !STOP.has(t));
  if (!tokens.length) return text.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 6) || "그거";
  // 동사·형용사 꼴(봤어 · 시작해 · 웃는 · 봤을걸)보다 명사를 받는다 — 「시작해에서」 같은 말이 안 나오게
  const nouns = tokens.filter((t) => !VERBISH.test(t));
  const pool = nouns.length ? nouns : tokens;
  return pool.reduce((a, b) => (b.length >= a.length ? b : a));
}

export type Tone = "question" | "joke" | "refuse" | "apology" | "silent" | "plain";

export function toneOf(text: string): Tone {
  const t = text.trim();
  if (!t || /^[.…\s]+$/.test(t) || t.length <= 2) return "silent";
  if (/ㅋㅋ|ㅎㅎ|농담|장난/.test(t)) return "joke";
  if (/미안|죄송|잘못했/.test(t)) return "apology";
  if (/싫어|아니야|안 해|안해|못 해|못해|안 가|됐어/.test(t)) return "refuse";
  if (/[?？]$|왜|뭐|어떻게|누가|언제|어디/.test(t)) return "question";
  return "plain";
}

export const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
