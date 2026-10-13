declare global { var NAMES: string[]; }
import { STEPS } from "../lib/flow.ts";
import { BRANCH_SCRIPTS } from "../lib/branches.ts";
import { localCurtain, localInference, localMirror } from "../lib/director.ts";
import type { SessionState } from "../lib/types.ts";

const mk = (name: string, other: string): SessionState => ({
  id: "t", createdAt: Date.now(), turn: 20,
  character: { name, profile: "중3 남자" },
  cardId: "web",
  other: { name: other, trigger: "야 우리끼리 먼저 정했어~" },
  answers: { 4: "단톡방에서 나만 답이 없어", 7: "내가 말하면 분위기가 식어", 15: "서운했어" },
  branchAnswers: { "swap.day": "평범한 날", "swap.see": "시큰둥해 보였어", "swap.say": "왜 그래?", "swap.back": "같이 정하고 싶었어", "future.where": "고1 교실", "future.letter": "별거 아니었어", "lines.say": "나도 껴줘" },
  firstResponse: "읽고 넘김", replayResponse: "나도 같이 정하고 싶었어",
  coreFeeling: "나 빼고 다 정해놓고 통보네",
  emotionFlow: [], feelings: [], messages: [], done: true, branchesUsed: [],
  scene: { backdrop: "stage", light: 4, mood: "warm", mask: 0, chain: 0, other: false, card: "face" },
});

const batchim = (w: string) => (w.charCodeAt(w.length - 1) - 0xac00) % 28 !== 0;

/** 이름 뒤에 붙으면 안 되는 조사 목록을 이름에서 직접 만든다 */
function wrongFor(name: string): string[] {
  return batchim(name)
    ? ["가", "는", "를", "야", "와 ", "랑"]        // 받침 있음 → 이/은/을/아/과/이랑 이 맞다
    : ["이 ", "은 ", "을 ", "아.", "과 ", "이랑"]; // 받침 없음 → 가/는/를/야/와/랑 이 맞다
}

function scan(label: string, texts: string[]) {
  let bad = 0;
  for (const t of texts) {
    if (!t) continue;
    for (const name of NAMES) {
      for (const w of wrongFor(name)) {
        if (t.includes(name + w)) { console.log(`❌ ${label}: "${t}"`); bad++; }
      }
    }
  }
  return bad;
}

for (const [name, other] of [["하늘", "지훈"], ["소라", "유나"], ["별", "민준"]] as const) {
  globalThis.NAMES = [name, other];
  const s = mk(name, other);
  const out: string[] = [];
  for (const st of STEPS) {
    out.push(...st.lines(s));
    if (st.otherLine) out.push(st.otherLine(s));
    if (typeof st.placeholder === "function") out.push(st.placeholder(s));
    if (st.hints) out.push(...st.hints(s));
    if (st.compare) { const c = st.compare(s); out.push(...(c.labels ?? [])); }
    if (st.speaker) out.push(st.speaker(s));
    if (st.aiNote) out.push(st.aiNote(s));
    out.push(st.scene(s).caption ?? "");
  }
  for (const k of Object.keys(BRANCH_SCRIPTS) as (keyof typeof BRANCH_SCRIPTS)[]) {
    for (const st of BRANCH_SCRIPTS[k].steps) {
      out.push(...st.lines(s));
      if (st.otherLine) out.push(st.otherLine(s));
      if (typeof st.placeholder === "function") out.push(st.placeholder(s));
      else if (st.placeholder) out.push(st.placeholder);
      if (st.hints) out.push(...st.hints(s));
      if (st.compare) { const c = st.compare(s); out.push(...(c.labels ?? [])); }
      if (st.speaker) out.push(st.speaker(s));
      if (st.aiNote) out.push(st.aiNote(s));
      out.push(st.scene(s).caption ?? "");
    }
  }
  out.push(localInference("아무도 몰라 나만 이러는 건가", s, "inference").reading);
  out.push(localMirror(s));
  const c = localCurtain(s);
  out.push(c.title, ...c.insights, c.tomorrow);
  const bad = scan(`${name}/${other}`, out);
  console.log(`${bad ? "❌" : "✅"} ${name}/${other}: ${out.length}개 문장, 조사 오류 ${bad}건`);
}

// 대표 문장 출력
const s = mk("하늘", "지훈");
console.log("\n--- 받침 이름 샘플 ---");
console.log(STEPS.find(x => x.turn === 2)!.lines(s)[1]);
console.log(STEPS.find(x => x.turn === 11)!.lines(s)[0]);
console.log(BRANCH_SCRIPTS.swap.steps[4].lines(s)[2]);
console.log(BRANCH_SCRIPTS.future.steps[3].lines(s)[1]);
console.log(localMirror(s).split("\n")[0]);
