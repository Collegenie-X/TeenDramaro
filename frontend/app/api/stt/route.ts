import { NextResponse } from "next/server";

/**
 * 🎙 Whisper STT — 말로 하는 입력.
 *
 * 글로 쓰는 게 부담인 유저가 적지 않다. 말로 하면 훨씬 많이, 훨씬 솔직하게 나온다.
 * 브라우저 내장 Web Speech API는 10대 구어체·줄임말 인식률이 떨어져서,
 * 키가 있으면 Whisper로 받고 없으면 클라이언트가 내장 엔진으로 되돌아간다.
 *
 * 오디오는 저장하지 않는다 — 받아서 텍스트로 바꾸고 바로 버린다.
 */
export const runtime = "nodejs";
/** 음성은 길어질 수 있다 — 기본 타임아웃으로는 모자란다 */
export const maxDuration = 60;

/** 한 번에 받는 오디오 상한 (약 2분 분량) */
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  // 키가 없으면 클라이언트가 브라우저 내장 STT로 되돌아간다
  if (!key) return NextResponse.json({ unavailable: true }, { status: 503 });

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    if (f instanceof File) audio = f;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!audio || audio.size === 0) return NextResponse.json({ error: "no audio" }, { status: 400 });
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });

  const body = new FormData();
  body.append("file", audio, audio.name || "speech.webm");
  body.append("model", "whisper-1");
  body.append("language", "ko");
  // 10대 구어체·줄임말이 "정상적인 문장"으로 교정되지 않게 결을 잡아준다
  body.append(
    "prompt",
    "한국 10대가 자기 이야기를 편하게 말하는 녹음입니다. 반말, 줄임말, 말 끊김, " +
      "「음…」 「그니까」 같은 말을 그대로 받아 적으세요. 문어체로 고치지 마세요."
  );

  try {
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
      body,
    });
    if (!r.ok) {
      console.error(`[stt] ${r.status}: ${await r.text()}`);
      return NextResponse.json({ unavailable: true }, { status: 503 });
    }
    const j = (await r.json()) as { text?: string };
    return NextResponse.json({ text: (j.text ?? "").trim() });
  } catch (err) {
    console.error("[stt]", err);
    return NextResponse.json({ unavailable: true }, { status: 503 });
  }
}
