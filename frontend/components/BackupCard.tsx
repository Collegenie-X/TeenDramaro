"use client";

import { useRef, useState } from "react";
import Sheet from "./Sheet";
import { exportBackup, importBackup, wipeAll } from "@/lib/store";

/** 내 기록 — localStorage를 JSON 파일 하나로 내보내고 가져온다 */
export default function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [wipe, setWipe] = useState(0);

  function download() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mindscene-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("내려받았어. 이 파일엔 네 씬과 고친 기록이 다 들어 있어 — 아무한테나 보내지 마.");
  }
  async function upload(f: File) {
    const r = importBackup(await f.text());
    setMsg(r.ok ? `가져왔어 — 씬 ${r.counts.pieces} · 이어 붙인 씬 ${r.counts.works} · 고친 기록 ${r.counts.revisions}. 지금 기록은 안 지웠어.` : r.error);
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 14 }}>💾 내 기록</h3>
      <p>기록은 이 기기의 브라우저에만 있어. 기기를 바꾸거나 정리하기 전에 JSON 파일로 챙겨 둬.</p>
      <div className="grid2" style={{ marginTop: 10 }}>
        <button className="btn btn-sm" onClick={download}>⬇ JSON 내보내기</button>
        <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>⬆ JSON 가져오기</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      {msg && <p style={{ color: "var(--note)" }}>{msg}</p>}
      <button className="btn btn-danger btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => setWipe(1)}>모두 지우기</button>
      {wipe > 0 && (
        <Sheet onClose={() => setWipe(0)} label="모두 지우기">
          <h3>이 기기의 마음씬 기록을 다 지울까?</h3>
          <p>씬 · 이어 붙인 씬 · 고친 기록 · 「보이는 것」 표시가 전부 지워져. <b>되살리기는 없어.</b> 필요하면 먼저 JSON으로 내보내.</p>
          <div className="grid2">
            <button className="btn" onClick={() => setWipe(0)}>그냥 둘래</button>
            {wipe === 1
              ? <button className="btn btn-danger" onClick={() => setWipe(2)}>지울래</button>
              : <button className="btn btn-danger" onClick={() => { wipeAll(); setWipe(0); setMsg("다 지웠어."); }}>진짜 다 지우기</button>}
          </div>
        </Sheet>
      )}
    </div>
  );
}
