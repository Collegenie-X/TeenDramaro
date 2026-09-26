import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { DIRECTOR_SYSTEM, contextBlock, TASK } from "@/lib/prompts";
import { localChoices, localCurtain, localInference, localMirror, localOtherReaction } from "@/lib/director";
import { checkSafety } from "@/lib/safety";
import type { SessionState } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  kind: keyof typeof TASK;
  input: string;
  session: SessionState;
  /** 재도전 분기에서 "지금 누가 누구를 보고 있는지" 알려주는 시점 메모 */
  note?: string;
};

/** API 키가 없거나 호출이 실패하면 내장 규칙 엔진으로 같은 모양의 결과를 만든다. */
function offline(kind: string, input: string, s: SessionState) {
  switch (kind) {
    case "inference":
    case "deepen":
    case "correct":
      return { source: "offline", ...localInference(input, s, kind as "inference") };
    case "mirror":
      return { source: "offline", text: localMirror(s) };
    case "roleplay":
      return { source: "offline", text: s.other.trigger || "야, 우리 먼저 갈게~" };
    case "compare":
      return {
        source: "offline",
        otherLine: localOtherReaction(input, s),
        text: "처음엔 아무 말도 안 나왔고, 두 번째엔 한마디가 나왔어. 상황은 똑같았는데 말이지. 어느 쪽이 맞다는 건 아니야 — 네가 둘 다 할 수 있다는 게 중요한 거야.",
      };
    case "curtain":
      return { source: "offline", ...localCurtain(s) };
    case "choices":
      return { source: "offline", ...localChoices(s) };
    case "beat":
    case "pivot":
      // 비트 생성은 클라이언트의 규칙 엔진(lib/openbeat.ts)이 대신한다.
      // 서버에는 막·비트 수·소진 기록이 없으므로 여기서는 표시만 돌려준다.
      return { source: "offline", offline: true };
    default:
      return { source: "offline", hints: [] as string[] };
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { kind, input = "", session, note } = body;
  if (!TASK[kind]) return NextResponse.json({ error: "unknown kind" }, { status: 400 });

  // 안전 필터는 AI보다 앞에 있고, 해제할 수 없다.
  const hit = checkSafety(input);
  if (hit) return NextResponse.json({ safety: hit.level });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(offline(kind, input, session));
  }

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: DIRECTOR_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            contextBlock(session),
            note ? `\n[지금 무대 상황]\n${note}` : "",
            `\n[유저가 방금 쓴 말]\n${input || "(없음)"}`,
            `\n${TASK[kind]}`,
          ].join("\n"),
        },
      ],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const json = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
    return NextResponse.json({ source: "ai", ...json });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[director] API ${err.status}: ${err.message}`);
    } else {
      console.error("[director]", err);
    }
    // 청소년 사용자가 빈 화면을 보면 안 되므로 항상 폴백한다.
    return NextResponse.json(offline(kind, input, session));
  }
}
