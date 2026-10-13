"use client";

import type { Scene } from "@/lib/types";

/** S#. 장소 / 시간 / 빛·소리 하나 — 상황 카드와 씬 서랍이 같이 쓴다 */
export default function SceneHeader({ n, scene, compact, noCast }: { n?: number; scene: Scene; compact?: boolean; noCast?: boolean }) {
  return (
    <div>
      <div className="slug">S#{n ?? ""}. {scene.place} / {scene.time} / {scene.light}</div>
      {!compact && (
        <dl className="kv">
          {!noCast && <>
          <dt>🎭 나</dt>
          <dd><b>{scene.me.name}</b> — 원하는 것: {scene.me.want}<br /><span className="muted">숨기는 것: {scene.me.hide}</span></dd>
          <dt>상대</dt>
          <dd><b>{scene.other.name}</b> — 원하는 것: {scene.other.want}{scene.other.habit && <><br /><span className="muted">말버릇: 「{scene.other.habit}」</span></>}</dd>
          </>}
          <dt>고정 사실</dt>
          <dd><ul className="list">{scene.fixed.map((f) => <li key={f}>{f}</li>)}</ul></dd>
          <dt>열린 것</dt>
          <dd><ul className="list">{scene.open.map((f) => <li key={f}>{f}</li>)}</ul></dd>
        </dl>
      )}
    </div>
  );
}
