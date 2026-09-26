"use client";

import { cardById } from "@/lib/cards";
import type { Branch, SessionState } from "@/lib/types";
import { BRANCH_SCRIPTS } from "@/lib/branches";

const BRANCHES: { id: Branch; icon: string; title: string; desc: string; turns?: number }[] = [
  { id: "lines", icon: "🎬", title: "다른 대사로 리플레이", desc: "같은 장면, 같은 상대. 세 번째 버전으로 가보기", turns: BRANCH_SCRIPTS.lines.steps.length },
  { id: "swap", icon: "🔄", title: "역할 교체", desc: "네가 상대 역, 내가 네 역. 그쪽 자리에서 그날을 다시 겪어보기", turns: BRANCH_SCRIPTS.swap.steps.length },
  { id: "future", icon: "⏳", title: "시간 이동", desc: "1년 뒤로 가서, 그때의 내가 지금의 나에게 한마디 건네기", turns: BRANCH_SCRIPTS.future.steps.length },
  { id: "newcard", icon: "🃏", title: "새 카드 뽑기", desc: "같은 캐릭터, 완전히 다른 상황" },
];

export default function CurtainCall({
  s, onBranch, onSave,
}: {
  s: SessionState;
  onBranch: (b: Branch) => void;
  onSave: () => void;
}) {
  const c = s.cardId ? cardById(s.cardId) : null;
  const flow = s.emotionFlow.length ? s.emotionFlow : ["😶", "😢", "🤔", "😄"];

  return (
    <>
      <div className="report">
        <div className="sect-t" style={{ marginTop: 0 }}>📖 완성된 이야기</div>
        <h2>{s.title ?? "제목 없는 이야기"}</h2>
        <div className="by">
          {s.character.name}의 이야기 · {c ? `${c.emoji} ${c.name} → ${c.flip.emoji} ${c.flip.name}` : ""} ·{" "}
          {new Date(s.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
        </div>

        <div className="sect-t">감정 흐름</div>
        <div className="flowline">
          {flow.map((e, i) => (
            <span key={i}>
              {i > 0 && <span className="arrow"> ▸ </span>}
              {e}
            </span>
          ))}
        </div>

        {(s.feelings?.length ?? 0) > 0 && (
          <>
            <div className="sect-t">네가 이름 붙인 마음</div>
            <div className="chips">
              {s.feelings?.map((f) => <span key={f} className="chip chip-em">{f}</span>)}
            </div>
          </>
        )}

        <div className="sect-t">인사이트 3줄</div>
        <ul style={{ margin: 0, padding: 0 }}>
          {(s.insights ?? []).map((t, i) => <li key={i}>{t}</li>)}
        </ul>

        <div className="sect-t">내일의 한마디</div>
        <div className="tomorrow">{s.tomorrow}</div>
      </div>

      <button className="cta" onClick={onSave}>🗄️ 카드 서랍장에 넣기</button>

      <div className="sect-t">🔄 더 해볼래? · 안 해도 괜찮아</div>
      <div className="branches">
        {BRANCHES.map((b) => {
          const used = s.branchesUsed.includes(b.id);
          return (
            <button key={b.id} className={`branch ${used ? "used" : ""}`} onClick={() => onBranch(b.id)}>
              <b>{b.icon} {b.title}{b.turns ? ` · ${b.turns}턴` : ""}{used ? " · 해봤어" : ""}</b>
              <small>{b.desc}</small>
            </button>
          );
        })}
      </div>

      <p className="note">
        오늘 무대는 여기까지야. 여기서 한 말은 이 기기에만 남아.<br />
        누구에게도 자동으로 공유되지 않아.
      </p>
    </>
  );
}
