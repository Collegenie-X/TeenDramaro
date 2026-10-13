"use client";

import type { StoryRecord } from "./types";
import { DAILY_SESSION_LIMIT } from "./safety";

const K_STORIES = "mindstage.stories";
const K_COUNT = "mindstage.daily";

const safeGet = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* 프라이빗 모드 등 */ }
};

export function loadStories(): StoryRecord[] {
  const raw = safeGet(K_STORIES);
  if (!raw) return [];
  try { return JSON.parse(raw) as StoryRecord[]; } catch { return []; }
}

export function saveStory(s: StoryRecord) {
  const all = loadStories();
  safeSet(K_STORIES, JSON.stringify([s, ...all.filter((x) => x.id !== s.id)].slice(0, 60)));
}

const today = () => new Date().toISOString().slice(0, 10);

/** 기획서 §9 — 일일 세션 3회 제한 */
export function sessionsToday(): number {
  const raw = safeGet(K_COUNT);
  if (!raw) return 0;
  try {
    const d = JSON.parse(raw) as { date: string; n: number };
    return d.date === today() ? d.n : 0;
  } catch { return 0; }
}

export function bumpSessionCount() {
  safeSet(K_COUNT, JSON.stringify({ date: today(), n: sessionsToday() + 1 }));
}

export const dailyLimitReached = () => sessionsToday() >= DAILY_SESSION_LIMIT;

/** 테스트용 — 오늘 쓴 횟수를 0으로 되돌린다. 데모/테스트 화면에서만 부른다. */
export function resetSessionCount() {
  try { localStorage.removeItem(K_COUNT); } catch { /* 프라이빗 모드 등 */ }
}
