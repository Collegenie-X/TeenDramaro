"use client";

/**
 * 목소리 계층 — 🎙 말로 입력(STT)과 🔊 디렉터 목소리(TTS).
 *
 * 둘 다 2단 구성이다.
 *   1단: 서버 라우트(Whisper / OpenAI TTS). 품질이 좋다.
 *   2단: 브라우저 내장(Web Speech API / speechSynthesis). 키가 없어도 앱이 멈추지 않는다.
 *
 * 청소년 사용자가 빈 화면이나 먹통 버튼을 보는 일은 없어야 하므로,
 * 어느 단에서 실패하든 조용히 다음 단으로 내려간다.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ══ 🎙 STT ═══════════════════════════════════════════ */

/** 서버 Whisper로 받아쓰기. null이면 서버 STT를 못 쓴다는 뜻(= 내장으로 내려가라) */
async function whisper(blob: Blob): Promise<string | null> {
  const fd = new FormData();
  fd.append("audio", blob, "speech.webm");
  try {
    const r = await fetch("/api/stt", { method: "POST", body: fd });
    if (!r.ok) return null;
    const j = (await r.json()) as { text?: string; unavailable?: boolean };
    if (j.unavailable) return null;
    return j.text ?? "";
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR = (): any =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof window === "undefined" ? null : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;

export type DictationState = "idle" | "recording" | "working";

/**
 * 말로 입력.
 * - Whisper가 살아 있으면: 녹음 → 멈춤 → 통째로 받아쓰기(정확도 우선).
 * - Whisper가 없으면: 브라우저 내장 실시간 인식으로 내려간다(즉시성 우선).
 *
 * onText는 "지금까지의 전체 텍스트"를 받는다. 받아쓰기 모드에서는 한 번,
 * 내장 모드에서는 말하는 동안 여러 번 호출된다.
 */
export function useDictation(onText: (text: string) => void) {
  const [state, setState] = useState<DictationState>("idle");
  const [supported, setSupported] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const baseRef = useRef("");
  const textRef = useRef(onText);
  textRef.current = onText;

  useEffect(() => {
    setSupported(
      Boolean(SR()) ||
        (typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia))
    );
    return () => {
      recRef.current?.stop?.();
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /** 브라우저 내장 실시간 인식 — Whisper를 못 쓸 때의 2단 */
  const startBuiltin = useCallback(() => {
    const Ctor = SR();
    if (!Ctor) { setState("idle"); return false; }
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      textRef.current(baseRef.current + out);
    };
    rec.onend = () => setState("idle");
    rec.onerror = () => setState("idle");
    recRef.current = rec;
    setState("recording");
    rec.start();
    return true;
  }, []);

  const stop = useCallback(() => {
    if (recRef.current) { recRef.current.stop(); recRef.current = null; return; }
    // MediaRecorder는 stop 이벤트에서 받아쓰기를 돌린다
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  }, []);

  const start = useCallback(
    async (current: string) => {
      baseRef.current = current ? current.replace(/\s+$/, " ") : "";
      if (!navigator.mediaDevices?.getUserMedia) { startBuiltin(); return; }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // 마이크 권한 거부 — 내장도 같은 권한을 쓰므로 여기서 끝낸다
        setState("idle");
        return;
      }

      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        mediaRef.current = null;
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        if (!blob.size) { setState("idle"); return; }
        setState("working");
        const text = await whisper(blob);
        if (text === null) {
          // Whisper를 못 쓴다 — 내장으로 내려가서 다시 말하게 한다
          startBuiltin();
          return;
        }
        textRef.current(baseRef.current + text);
        setState("idle");
      };
      mediaRef.current = mr;
      setState("recording");
      mr.start();
    },
    [startBuiltin]
  );

  return { state, supported, start, stop };
}

/* ══ 🔊 TTS ═══════════════════════════════════════════ */

/** 브라우저 내장 음성 — 서버 TTS를 못 쓸 때의 2단 */
function speakBuiltin(text: string, onEnd: () => void) {
  if (typeof speechSynthesis === "undefined") { onEnd(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.98;
  u.onend = onEnd;
  u.onerror = onEnd;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

const VOICE_KEY = "mindstage.voice";

/**
 * 디렉터 목소리.
 * 켜져 있으면 디렉터 대사가 올라올 때마다 읽어준다. 설정은 기기에 기억된다.
 */
export function useSpeaker() {
  const [on, setOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** 재생 요청 순번 — 늦게 도착한 이전 음성이 새 대사를 덮지 않게 한다 */
  const seq = useRef(0);

  useEffect(() => {
    try { setOn(localStorage.getItem(VOICE_KEY) === "1"); } catch { /* 저장 못 해도 동작한다 */ }
  }, []);

  const stop = useCallback(() => {
    seq.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setOn((p) => {
      const nx = !p;
      try { localStorage.setItem(VOICE_KEY, nx ? "1" : "0"); } catch { /* 무시 */ }
      if (!nx) stop();
      return nx;
    });
  }, [stop]);

  const speak = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t) return;
    stop();
    const tick = ++seq.current;
    setSpeaking(true);
    const done = () => { if (tick === seq.current) setSpeaking(false); };

    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (tick !== seq.current) return; // 그 사이 새 대사가 왔다
      if (!r.ok) { speakBuiltin(t, done); return; }

      const url = URL.createObjectURL(await r.blob());
      if (tick !== seq.current) { URL.revokeObjectURL(url); return; }
      const a = new Audio(url);
      a.onended = () => { URL.revokeObjectURL(url); done(); };
      a.onerror = () => { URL.revokeObjectURL(url); done(); };
      audioRef.current = a;
      // 자동재생이 막히면(사용자 제스처 전) 내장 음성으로 내려간다
      await a.play().catch(() => speakBuiltin(t, done));
    } catch {
      if (tick === seq.current) speakBuiltin(t, done);
    }
  }, [stop]);

  return { on, toggle, speak, stop, speaking };
}
