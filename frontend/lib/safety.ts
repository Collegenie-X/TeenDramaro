/** 기획서 §9 — 위기 감지. 해제 불가. */
const SELF_HARM = ["자살", "죽고싶", "죽고 싶", "자해", "손목", "없어지고 싶", "사라지고 싶", "뛰어내리", "약 먹고", "살기 싫"];
const ABUSE = ["때려", "맞았", "폭행", "학대", "성추행", "성폭", "협박", "돈 뜯", "갈취"];

export type SafetyHit = { level: "crisis" | "abuse"; matched: string } | null;

export function checkSafety(text: string): SafetyHit {
  const t = text.replace(/\s/g, "");
  for (const k of SELF_HARM) if (t.includes(k.replace(/\s/g, ""))) return { level: "crisis", matched: k };
  for (const k of ABUSE) if (t.includes(k.replace(/\s/g, ""))) return { level: "abuse", matched: k };
  return null;
}

export const SAFETY_MESSAGE: Record<"crisis" | "abuse", { title: string; body: string; lines: { label: string; value: string }[] }> = {
  crisis: {
    title: "잠깐 무대를 멈출게",
    body:
      "지금 네가 쓴 말이 마음에 걸려. 연출자로서가 아니라 그냥, 걱정돼서 멈췄어.\n" +
      "나는 상담 선생님이 아니야. 그래서 진짜 들어줄 수 있는 곳을 알려줄게. 지금 바로 전화해도 돼. 무료고, 이름 말 안 해도 돼.",
    lines: [
      { label: "자살예방 상담전화", value: "109" },
      { label: "청소년 상담 1388", value: "1388 (전화·문자)" },
      { label: "정신건강 상담", value: "1577-0199" },
    ],
  },
  abuse: {
    title: "이건 너 혼자 감당할 일이 아니야",
    body:
      "네가 쓴 상황은 네 잘못이 아니야. 그리고 이야기 연습만으로 끝낼 일도 아니야.\n" +
      "어른 한 명한테 알리는 게 필요해. 누구에게 말할지 모르겠으면 아래로 연락해도 돼.",
    lines: [
      { label: "청소년 상담 1388", value: "1388 (전화·문자)" },
      { label: "학교폭력 신고", value: "117" },
      { label: "아동학대 신고", value: "112" },
    ],
  },
};

/** 세션 제한 — 25분 / 1일 3회 */
export const SESSION_LIMIT_MS = 25 * 60 * 1000;
export const DAILY_SESSION_LIMIT = 3;
