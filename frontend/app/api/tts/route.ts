import { NextResponse } from "next/server";
import { checkSafety } from "@/lib/safety";

/**
 * 🔊 디렉터 목소리 — 진행자가 말로 받아주면 "쇼"가 된다.
 *
 * 글로만 흐르면 아무리 톤을 잡아도 설문지 느낌이 남는다. 같은 문장도
 * 사람 목소리로 들으면 진행자가 옆에 있는 느낌이 되고, 유저가 더 멀리까지 간다.
 * 키가 없으면 클라이언트가 브라우저 내장 음성(speechSynthesis)으로 되돌아간다.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

/** 한 번에 읽어주는 길이 상한 — 디렉터 대사는 원래 짧다 */
const MAX_CHARS = 600;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ unavailable: true }, { status: 503 });

  let text = "";
  try {
    ({ text = "" } = (await req.json()) as { text?: string });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  text = text.trim().slice(0, MAX_CHARS);
  if (!text) return NextResponse.json({ error: "no text" }, { status: 400 });

  // 안전 필터는 여기서도 앞에 선다 — 위기 신호가 담긴 문장을 소리로 재생하지 않는다
  if (checkSafety(text)) return NextResponse.json({ unavailable: true }, { status: 503 });

  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "sage",
        input: text,
        // 사이코드라마 진행자의 결 — 또래 상담자처럼, 낭독조가 아니라 대화체로
        instructions:
          "한국어. 10대와 마주 앉은 또래 상담자처럼 편하고 따뜻하게. " +
          "낭독하지 말고 말을 걸듯이. 조금 느리게, 문장 사이에 숨을 두세요. " +
          "과장된 감탄이나 아나운서 톤은 쓰지 마세요.",
        response_format: "mp3",
      }),
    });
    if (!r.ok) {
      console.error(`[tts] ${r.status}: ${await r.text()}`);
      return NextResponse.json({ unavailable: true }, { status: 503 });
    }
    return new NextResponse(r.body, {
      headers: {
        "content-type": "audio/mpeg",
        // 같은 대사를 다시 읽을 일은 없다 — 캐시하지 않는다
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("[tts]", err);
    return NextResponse.json({ unavailable: true }, { status: 503 });
  }
}
