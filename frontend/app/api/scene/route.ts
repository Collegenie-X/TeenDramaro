import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SYSTEM, type AiKind } from "@/lib/prompts";
import { checkSafety } from "@/lib/safety";

export const runtime = "nodejs";

type Body = {
  kind: AiKind;
  /** 사용자가 방금 쓴 말 — 안전 필터는 이걸 먼저 본다 */
  input: string;
  /** 장면 맥락 (인물 · 다이얼 · 최근 비트 등). 실명은 들어오지 않는다 — 가명만 */
  context: Record<string, unknown>;
};

/**
 * 키가 없거나 실패하면 { offline: true } — 클라이언트가 내장 엔진(lib/improv.ts · lib/inner.ts)으로 같은 모양을 만든다.
 * 청소년 사용자가 빈 화면을 보면 안 되므로 항상 폴백한다.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { kind, input = "", context = {} } = body;
  if (!(kind in SYSTEM)) return NextResponse.json({ error: "unknown kind" }, { status: 400 });

  // 안전 필터는 AI보다 앞에 있고, 해제할 수 없다.
  const hit = checkSafety(input);
  if (hit) return NextResponse.json({ safety: hit.level });

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ offline: true });

  try {
    const client = new Anthropic();
    // 대사 한 줄짜리 응답 — 지연이 중요하므로 effort는 low.
    // 안전 분류기가 거절하면 서버 쪽 폴백 모델이 이어받는다(fallbacks: "default").
    const params = {
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM[kind],
      messages: [
        {
          role: "user",
          content: `[장면]\n${JSON.stringify(context, null, 1)}\n\n[사용자가 방금 쓴 말]\n${input || "(없음)"}`,
        },
      ],
    } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming;

    const res = await client.beta.messages.create(params, { timeout: 15_000 });
    if (res.stop_reason === "refusal") return NextResponse.json({ offline: true });

    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const json = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());

    // AI가 쓴 말도 한 번 더 거른다
    const out = String(json.line ?? json.text ?? "");
    if (!out || checkSafety(out)) return NextResponse.json({ offline: true });
    return NextResponse.json({ source: "ai", ...json });
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`[scene] API ${err.status}: ${err.message}`);
    else console.error("[scene]", err);
    return NextResponse.json({ offline: true });
  }
}
