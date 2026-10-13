"use client";

import { getPiece, getWork, logRevision, loadProfile, now, saveWork, savePiece, uid } from "./store";
import type { ScenePiece } from "./types";

/**
 * 저장 버튼은 없다(§21) — 씬이 끝나면 이걸 불러 자동으로 서랍에 넣는다.
 * 조립대에서 「빈 씬 세우기」로 왔으면(work) 그 작품 끝 슬롯에 바로 놓는다.
 * 돌아갈 곳을 돌려준다.
 */
export function finishPiece(p: ScenePiece, work?: string): string {
  const isNew = !getPiece(p.id);
  savePiece(p);
  if (work) {
    const w = getWork(work);
    if (w && !w.slots.some((s) => s.pieceId === p.id)) {
      saveWork({ ...w, slots: [...w.slots, { pieceId: p.id, takeN: p.takes.at(-1)!.n, carryFacts: [] }] });
      logRevision({ target: { workId: w.id, field: "slotAdd", label: `S#${w.slots.length + 1} 빈 씬 세우기` }, before: "", after: p.title });
      return `/scenes/join/${w.id}`;
    }
  }
  return isNew ? `/scenes/${p.id}?new=1` : `/scenes/${p.id}`;
}

export function blankPiece(partial: Omit<ScenePiece, "id" | "createdAt" | "updatedAt" | "cls">): ScenePiece {
  return { ...partial, id: uid("p"), cls: loadProfile().cls, createdAt: now(), updatedAt: now() };
}
