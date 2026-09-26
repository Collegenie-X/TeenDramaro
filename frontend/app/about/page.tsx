import Link from "next/link";
import TabBar from "@/components/TabBar";
import { DAILY_SESSION_LIMIT, SAFETY_MESSAGE } from "@/lib/safety";

type Step = {
  act: string;
  title: string;
  body: string;
  line?: { who: string; text: string };
  ritual?: boolean;
};

/** 실제 엔진의 막 구성(lib/stage.ts)을 이야기 순서대로 풀어 쓴 것 */
const STEPS: Step[] = [
  {
    act: "무대 입장",
    title: "네가 아니라, 네가 만든 애가 무대에 서",
    body: "이름 하나만 줘도 시작돼. 더 그리고 싶으면 얼마든지 머물러도 되고. 그 애가 겪는 일이면 조금 멀리서 볼 수 있어.",
    line: { who: "디렉터", text: "무대에 설 캐릭터를 한 명 만들자. 이름을 하나 줘봐." },
  },
  {
    act: "카드 뽑기",
    title: "카드는 해석하려고 뽑는 게 아니야",
    body: "말문을 여는 소품이야. 카드에서 떠오르는 게 있으면 그걸로, 전혀 다른 얘기가 하고 싶으면 그걸로 가도 돼. 그러면 카드는 잊어버려.",
    ritual: true,
  },
  {
    act: "1막 · 펼치기",
    title: "하고 싶은 얘기를 꺼내",
    body: "정해진 주제가 없어. 여기서 제일 오래 머물러. 무슨 일이 있었는지, 어디였는지, 제일 선명하게 남은 한 장면이 뭔지 — 줄거리보다 한 컷이 중요해.",
    line: { who: "디렉터", text: "그 일에서 제일 선명하게 남은 장면이 뭐야? 한 컷만 꺼내봐." },
  },
  {
    act: "2막 · 안쪽",
    title: "사건이 아니라, 사건이 건드린 자리",
    body: "제일 아팠던 지점, 머릿속에 맴돈 말, 그게 누구 목소리였는지. 「모르겠어」도 완결된 답이야. 넘어가도 돼.",
  },
  {
    act: "3막 · 마주침",
    title: "사람이 있는 장면을 세워",
    body: "상대는 악역이 아니야. 사람이 아니어도 돼 — 단톡방, 성적표, 집 현관도 상대가 될 수 있어. 없으면 없는 대로 가.",
    line: { who: "디렉터", text: "그때 진짜 하고 싶었던 말은 뭐였어?" },
  },
  {
    act: "4막 · 거울",
    title: "네 말만으로 다시 읽어줄게",
    body: "네가 쓴 말만 모아서 3인칭으로 되읽어. 새로 지어내지 않아. 맞는 부분, 아닌 부분, 빠진 것 — 네가 고쳐.",
    ritual: true,
  },
  {
    act: "5막 · 리플레이",
    title: "같은 장면, 다른 선택",
    body: "그때 못 한 말을 여기서 해봐. 이게 정답이라고 말하지 않아. 그냥 다른 버전이 가능하다는 걸 몸으로 한 번 통과해 보는 거야.",
    line: { who: "너", text: "나 그 말 들으면 좀 힘들어." },
    ritual: true,
  },
  {
    act: "커튼콜",
    title: "이야기 제목 하나와, 내일의 한마디",
    body: "제목 · 인사이트 3줄 · 내일의 한마디. 전부 네가 실제로 쓴 말에만 근거해. 조언도 처방도 없어. 그리고 다시 해볼 수 있어 — 다른 대사로, 역할을 바꿔서, 1년 뒤로 가서.",
    ritual: true,
  },
];

const WIDEN = [
  { em: "🎬", t: "장면으로", d: "구체적인 사건·한 컷으로 답하는 쪽" },
  { em: "💭", t: "마음으로", d: "감정·속마음으로 답하는 쪽" },
  { em: "🌀", t: "딴 데로", d: "반전, 전혀 다른 사건, 엉뚱한 연결" },
  { em: "🫧", t: "지금은 안 할래", d: "「모르겠어」도 완결된 답" },
];

const HELM = [
  { em: "🧵", t: "이 얘기 더 할래", d: "지나가듯 흘린 말을 다시 펼쳐" },
  { em: "🧭", t: "다른 얘기 할래", d: "지금 흐름을 안 붙잡고 완전히 다른 데서 다시 열어" },
  { em: "▶", t: "다음 장면으로", d: "막을 넘겨. 넘기는 건 항상 너야" },
  { em: "📖", t: "이제 마무리할래", d: "거울 이후엔 언제든 커튼콜로" },
  { em: "🫧", t: "잠깐 멈출래", d: "호흡 안내 후 이어하기 / 나가기" },
];

export default function About() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div>
            <div className="topbar-title">🎭 여기가 어떤 무대야</div>
            <div className="topbar-sub">이야기 한 편이 흘러가는 순서대로</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="hero">
          <span className="badge">HOW IT GOES</span>
          <h1>말하기 전에,<br />무대를 먼저 세워</h1>
          <p>
            「고민이 뭐야?」로 시작하면 입이 안 떨어져.<br />
            그래서 카드가 먼저 말을 꺼내고, 네가 만든 캐릭터가 대신 서.<br />
            너는 작가, 나는 연출자.
          </p>
        </div>

        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>이야기가 흘러가는 순서</div>
          <p className="note" style={{ margin: "0 0 14px" }}>
            막이 여덟 개지만 관문은 아니야. 턴 수 제한도 없어.
            10번 주고받고 끝나도, 100번을 가도 순서는 그대로 유지돼.
          </p>

          <div className="story">
            {STEPS.map((s) => (
              <div key={s.act} className={`story-step${s.ritual ? " ritual" : ""}`}>
                <span className="story-act">{s.act}</span>
                <b>{s.title}</b>
                <p>{s.body}</p>
                {s.line && (
                  <div className="story-line">
                    <i>{s.line.who}</i>「{s.line.text}」
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>막히면 — 질문을 넓히는 것들</div>
          <p className="note" style={{ margin: "0 0 12px" }}>
            흐름이 「어디까지 깊어지는가」라면, 이건 「한 질문을 어떻게 넓히는가」야.
            질문마다 네 갈래가 같이 떠. 좁히는 객관식이 아니라, 갈 수 있는 방향을 보여주는 거야.
            눌러도 입력창에 채워지기만 하니까 고쳐서 보내도 되고, 그냥 네 말로 써도 돼.
          </p>
          {WIDEN.map((w) => (
            <div key={w.t} className="row-item" style={{ marginBottom: 7 }}>
              <span className="lg">{w.em}</span>
              <div style={{ flex: 1 }}>
                <b>{w.t}</b>
                <small>{w.d}</small>
              </div>
            </div>
          ))}

          <div className="sect-t">흐름은 네가 쥐어</div>
          {HELM.map((h) => (
            <div key={h.t} className="row-item" style={{ marginBottom: 7 }}>
              <span className="lg">{h.em}</span>
              <div style={{ flex: 1 }}>
                <b>{h.t}</b>
                <small>{h.d}</small>
              </div>
            </div>
          ))}
          <p className="note" style={{ marginTop: 10 }}>
            💗 감정 단어는 네가 고른 그대로 써. 다른 말로 바꿔 부르지 않아.
          </p>
        </div>

        <div className="report">
          <div className="sect-t" style={{ marginTop: 0 }}>하는 것</div>
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

        <Link href="/play" className="cta cta-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          무대 올리기
        </Link>

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
