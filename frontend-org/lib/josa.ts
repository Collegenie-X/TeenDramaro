/**
 * 받침 유무에 따라 한국어 조사를 고른다.
 * 캐릭터 이름을 유저가 직접 짓기 때문에 문장마다 조사가 달라진다.
 */
function hasBatchim(word: string): boolean | null {
  const last = word.trim().charCodeAt(word.trim().length - 1);
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return null; // 한글이 아니면 판단 불가
  return (last - 0xac00) % 28 !== 0;
}

export function josa(word: string, withBatchim: string, without: string): string {
  const b = hasBatchim(word);
  return b === null ? without : b ? withBatchim : without;
}

/** 이름 + 조사 */
export const 이가 = (w: string) => `${w}${josa(w, "이", "가")}`;
export const 은는 = (w: string) => `${w}${josa(w, "은", "는")}`;
export const 을를 = (w: string) => `${w}${josa(w, "을", "를")}`;
export const 과와 = (w: string) => `${w}${josa(w, "과", "와")}`;
/** 「하늘이랑」 / 「소라랑」 */
export const 랑 = (w: string) => `${w}${josa(w, "이랑", "랑")}`;
/** 부를 때 — 「지훈아」 / 「소라야」 */
export const 야아 = (w: string) => `${w}${josa(w, "아", "야")}`;
