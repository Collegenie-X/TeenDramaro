/** ✏️ 바뀐 것만 — 판본 사이 달라진 낱말만 형광펜. 빨간색(틀림)은 안 쓴다 */
export type Seg = { t: string; kind: "same" | "add" | "del" };

export function wordDiff(before: string, after: string): Seg[] {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Seg[] = [];
  let i = 0, j = 0;
  const push = (t: string, kind: Seg["kind"]) => {
    const last = out.at(-1);
    if (last && last.kind === kind) last.t += t;
    else out.push({ t, kind });
  };
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push(a[i], "same"); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push(a[i++], "del");
    else push(b[j++], "add");
  }
  while (i < a.length) push(a[i++], "del");
  while (j < b.length) push(b[j++], "add");
  return out;
}
