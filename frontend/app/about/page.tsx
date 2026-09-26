import TabBar from "@/components/TabBar";
import { DAILY_SESSION_LIMIT, SAFETY_MESSAGE } from "@/lib/safety";

export default function About() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">🛡️ 안전 · 안내</div>
            <div className="topbar-sub">여기가 뭘 하고, 뭘 안 하는 곳인지</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>마음무대가 하는 것</div>
          <ul style={{ margin: 0, padding: 0 }}>
            <li>네가 만든 가상 캐릭터로 네 상황을 3인칭으로 보기</li>
            <li>그때 못 한 말을 안전하게 연습해 보기</li>
            <li>감정에 이름을 붙여보기 — 틀리면 네가 고치기</li>
          </ul>
          <div className="sect-t">하지 않는 것</div>
          <ul style={{ margin: 0, padding: 0 }}>
            <li>진단하지 않아. 병명도, 검사 결과도 없어</li>
            <li>처방하거나 「이렇게 해야 해」라고 하지 않아</li>
            <li>네 이야기를 누구에게도 자동으로 보내지 않아</li>
          </ul>
        </div>

        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>지금 힘들면 여기로</div>
          {SAFETY_MESSAGE.crisis.lines.map((l) => (
            <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}>
              <span>{l.label}</span><b>{l.value}</b>
            </a>
          ))}
          <p className="note" style={{ marginTop: 10 }}>
            무료고, 이름을 말하지 않아도 돼. 24시간이야.
          </p>
        </div>

        <p className="note">
          한 세션은 약 25분, 하루 {DAILY_SESSION_LIMIT}회까지 열 수 있어.<br />
          모든 기록은 이 기기의 브라우저 저장소에만 남아. 앱을 지우면 같이 사라져.<br />
          AI 디렉터는 상담 선생님이 아니야. 사람이 필요할 땐 사람에게 가는 게 맞아.
        </p>
      </div>

      <TabBar />
    </>
  );
}
