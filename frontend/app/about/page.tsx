"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TabBar from "@/components/TabBar";
import {
  HeroArt, StuckArt, StageArt, ActsArt, BranchArt, PromiseArt, SafetyArt, PrivacyArt,
} from "@/components/AboutArt";
import { DAILY_SESSION_LIMIT, SAFETY_MESSAGE } from "@/lib/safety";

type Step = {
  /** 03 흐름 필름 컷(AboutArt의 FRAMES)과 같은 이모지 — 그림과 목록을 이어준다 */
  em: string;
  act: string;
  title: string;
  body: string;
  line?: { who: string; text: string };
  ritual?: boolean;
  /** 이 스텝부터 새 부(部)가 시작된다 — 목록에 구분 띠를 띄운다 */
  part?: { no: string; title: string; goal: string };
};

/** 실제 엔진의 막 구성(lib/stage.ts)을 두 부로 묶어 이야기 순서대로 풀어 쓴 것 */
const STEPS: Step[] = [
  {
    em: "🙋",
    act: "접수",
    title: "오늘 무슨 일로 왔어?",
    body: "점집 가면 보살이 제일 먼저 묻잖아. 여기도 그래. 연애, 친구, 부모, 진로 — 칩 하나 누르거나 네 말로 써. 두 개면 더 급한 거 하나만. 나머진 다음에.",
    line: { who: "디렉터", text: "아, 그거구나. 하나만 더 — 그 애랑 지금 어느 정도야?" },
    part: { no: "1부", title: "내면의 이야기 만들기", goal: "한 장면 안에서 내가 늘 하는 선택을 찾는다" },
  },
  {
    em: "🎭",
    act: "무대 입장",
    title: "네가 아니라, 네가 만든 애가 올라가",
    body: "이름 하나만 줘도 시작돼. 사연이 먼저 들어왔으니까 여기선 짧게 — 그 애의 약한 데랑 센 데 한 쌍이면 충분해.",
    line: { who: "디렉터", text: "이 얘기 무대에 세울 애 이름부터. 진짜 네 이름 말고." },
  },
  {
    em: "🃏",
    act: "카드 뽑기",
    title: "카드는 점 보려고 뽑는 거 아니야",
    body: "말문 여는 소품이야. 카드 보고 떠오르는 게 있으면 그걸로 가고, 아예 딴 얘기가 하고 싶으면 그걸로 가도 돼. 그럼 카드는 그냥 잊어버려.",
    ritual: true,
  },
  {
    em: "📖",
    act: "1막 · 펼치기",
    title: "딱 한 장면만 무대에 올려",
    body: "줄거리 말고 한 컷. 어디, 몇 시, 불은 켜졌는지. 그 애가 보낸 말은 요약하지 말고 그대로. 그리고 — 거기서 네가 만든 애가 실제로 뭘 했는지.",
    line: { who: "디렉터", text: "손이 멈춘 자리. 거기서 수민이 실제로 뭐라고 쳤어?" },
  },
  {
    em: "💭",
    act: "2막 · 안쪽",
    title: "그 선택 밑에 뭐가 있나",
    body: "이번이 처음은 아니지? 몸은 어디가 먼저 반응해? 그 말 누구 목소리야? 「모르겠어」도 답이야. 넘어가도 돼.",
  },
  {
    em: "🤝",
    act: "3막 · 마주침",
    title: "사람이 있는 장면을 세워",
    body: "상대가 나쁜 애라는 뜻은 아니야. 사람이 아니어도 되고 — 단톡방, 성적표, 집 현관도 상대가 될 수 있어. 없으면 없는 대로 가.",
    line: { who: "디렉터", text: "그때 진짜 하고 싶었던 말은 뭐였어?" },
  },
  {
    em: "🪞",
    act: "4막 · 거울",
    title: "네가 한 말만 모아서 다시 읽어줄게",
    body: "없는 말 지어내지 않아. 맞는 데, 아닌 데, 빠진 거 — 네가 고쳐. 그리고 마지막에 한 문장. 이 장면에서 그 애가 늘 하는 선택, 네 말로.",
    line: { who: "너", text: "둘째 줄 오면 손 멈췄다가 「원래 그래」 치고 받아준다." },
    ritual: true,
  },
  {
    em: "⏪",
    act: "5막 · 리플레이",
    title: "같은 자리, 다른 선택 — 그럼 어떻게 되나",
    body: "출구 넷을 깔아. 말로 받기, 자리 뜨기, 비틀기, 그리고 원래 하던 거 — 근데 이번엔 알고. 하나 골라서 돌려보면 상대가 현실적으로 반응해. 사과 서비스 없어. 그러고 물어. 상황은 안 바뀌었는데, 그 애 안에서는 뭐가 달라졌어?",
    line: { who: "너", text: "똑같은 말인데 손이 안 떨려. 내가 고른 거라서." },
    ritual: true,
    part: { no: "2부", title: "나의 선택 바꾸기", goal: "다른 선택을 돌려보고, 원래 문장 옆에 새 문장을 둔다" },
  },
  {
    em: "👏",
    act: "커튼콜",
    title: "두 문장 나란히, 그리고 제목",
    body: "시작할 때 네가 말한 「늘 하는 선택」 옆에 지금 문장을 하나 써. 고치는 거 아니야, 옆에 두는 거야. 인사이트 3줄은 전부 네가 쓴 말에서만. 조언도 처방도 없어.",
    line: { who: "너", text: "둘째 줄 오면 손이 멈춰도 돼. 그다음은 내가 고른다." },
    ritual: true,
  },
];

const WIDEN = [
  { em: "🎬", t: "장면으로", d: "그때 뭐가 있었는지, 한 컷으로 답하는 쪽" },
  { em: "💭", t: "마음으로", d: "기분이나 속마음으로 답하는 쪽" },
  { em: "🌀", t: "딴 데로", d: "반전, 전혀 다른 일, 엉뚱한 연결" },
  { em: "🫧", t: "지금은 패스", d: "「모르겠어」도 그냥 답이야" },
];

const HELM = [
  { em: "🧵", t: "이 얘기 더 할래", d: "지나가듯 흘린 말 다시 펼치기" },
  { em: "🧭", t: "다른 얘기 할래", d: "지금 흐름 안 붙잡고 딴 데서 다시 열기" },
  { em: "▶", t: "다음 장면으로", d: "막 넘기기. 넘기는 건 항상 너야" },
  { em: "📖", t: "이제 마무리할래", d: "거울 지나면 아무 때나 커튼콜로" },
  { em: "🫧", t: "잠깐 멈출래", d: "숨 고르고 이어하기 / 나가기" },
];

const INDEX = ["질문", "무대", "흐름", "조종간", "약속", "안전", "기록"];

function Stage({
  no,
  label,
  title,
  on,
  children,
}: {
  no: string;
  label: string;
  title: React.ReactNode;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`ab-stage${on ? " on" : ""}`} id={`stage-${no}`}>
      <div className="rv">
        <div className="ab-no">{no}</div>
        <span className="ab-label">STAGE {no} · {label}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  /** 지금 읽고 있는 스테이지. -1은 아직 히어로 */
  const [active, setActive] = useState(-1);

  /*
   * 스크롤 등장 + 지금 읽는 스테이지 추적.
   * JS가 돌기 전엔 전부 보이는 상태(SSR)이고, 첫 페인트 전에 화면 아래쪽만
   * 감췄다가 스크롤로 올라오면 다시 켠다. IntersectionObserver는 탭이 가려져
   * 있거나 HMR 뒤에 콜백이 안 오는 경우가 있어서, 매 스크롤마다 위치를 직접
   * 재는 쪽이 확실하다.
   */
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const stages = Array.from(root.querySelectorAll<HTMLElement>(".ab-stage"));
    let pending = Array.from(root.querySelectorAll<HTMLElement>(".rv"));

    const check = () => {
      const box = root.getBoundingClientRect();

      const limit = box.bottom - 28;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > limit) return true;
        el.classList.add("in");
        return false;
      });

      // 인덱스 바 바로 아래를 지난 마지막 스테이지가 "지금 읽는" 것
      const mark = box.top + 96;
      let cur = -1;
      stages.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= mark) cur = i;
      });
      setActive(cur);
    };

    root.classList.add("rv-ready");
    check();

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; check(); });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      root.classList.remove("rv-ready");
    };
  }, []);

  /** 활성 칩이 인덱스 바 밖으로 나가 있으면 가운데로 끌어온다 */
  useEffect(() => {
    const bar = indexRef.current;
    if (!bar || active < 0) return;
    const chip = bar.children[active] as HTMLElement | undefined;
    if (!chip) return;
    bar.scrollTo({
      left: Math.max(0, chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2),
      behavior: "smooth",
    });
  }, [active]);

  const goto = (i: number) => {
    const root = scrollRef.current;
    const el = root?.querySelectorAll<HTMLElement>(".ab-stage")[i];
    if (!root || !el) return;
    const top =
      root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - 52;
    root.scrollTo({ top, behavior: "smooth" });
  };

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

      <div className="scroll ab-scroll" ref={scrollRef}>
        {/* ── 히어로 ─────────────────────────────── */}
        <div className="ab-hero">
          <span className="badge">TEENDRAMARO · 마음무대</span>
          <h1>내 얘기를 무대에 올리고,<br />다른 선택을 해보는 곳</h1>
          <p>
            「무슨 일로 왔어?」부터 시작해.<br />
            네가 만든 캐릭터가 대신 올라가서<br />
            늘 하던 선택을 찾고, 다르게 해보면 어떻게 되는지 봐.
          </p>
        </div>
        <HeroArt />
        <div className="ab-down">
          아래로 쭉 내려봐<i>↓</i>
        </div>
        <nav className="ab-index" ref={indexRef} aria-label="스테이지 바로가기">
          {INDEX.map((t, i) => (
            <button
              key={t}
              className={active === i ? "on" : ""}
              onClick={() => goto(i)}
              aria-current={active === i ? "true" : undefined}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>{t}
            </button>
          ))}
        </nav>

        {/* ── 01 질문 ────────────────────────────── */}
        <Stage no="01" label="질문" on={active === 0} title={<>내 얘기 하는 게<br />왜 이렇게 어렵지</>}>
          <p className="rv">
            제일 하고 싶은 말일수록 제일 안 나와. 얼굴 보고 말하기도 그렇고,
            톡에 썼다가 지운 것도 한두 번이 아니고. <em>「편하게 말해봐」가 제일 안 편하잖아.</em>
            {" "}문제는 네가 아니라, 질문이 너무 정면이라는 거야.
          </p>
          <div className="rv"><StuckArt /></div>
          <div className="ab-visual rv" style={{ marginTop: 10 }}>
            <div>
              <div className="speaker">어른들</div>
              <div className="bubble b-director">고민이 뭐야? 편하게 얘기해봐.</div>
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <div className="bubble b-user">
                <span className="typing"><i /><i /><i /></span>
              </div>
            </div>
            <div className="scene-cap">…그리고 여기서 3분 날아감</div>
          </div>
        </Stage>

        {/* ── 02 무대 ────────────────────────────── */}
        <Stage no="02" label="무대" on={active === 1} title={<>그래서 정면 말고,<br />무대를 하나 세웠어</>}>
          <p className="rv">
            네가 직접 말하는 게 아니라, <em>네가 만든 캐릭터가 겪는 일</em>로 꺼내는
            거야. 걔 얘기면 한 발 떨어져서 볼 수 있잖아. 카드도 점 보는 게 아니라
            말문 여는 소품이고, 흐름은 연출 맡은 내가 잡아줄게.
          </p>
          <div className="rv"><StageArt /></div>
          <div className="ab-roles rv" style={{ marginTop: 10 }}>
            <div className="ab-role">
              <span className="em">✍️</span>
              <b>너 = 작가</b>
              <small>얘기를 쓰는 사람</small>
            </div>
            <div className="ab-role">
              <span className="em">🎭</span>
              <b>캐릭터 = 배우</b>
              <small>대신 올라가는 애</small>
            </div>
            <div className="ab-role">
              <span className="em">🎬</span>
              <b>AI = 연출</b>
              <small>장면 잡아주는 역</small>
            </div>
          </div>
          <div className="reveal rv" style={{ marginTop: 4 }}>
            <div className="card-face" style={{ animation: "none" }}>
              <span className="em">🌙</span>
              <span className="nm">달</span>
              <span className="kw">불안 · 예감 · 안개</span>
            </div>
            <div className="scene-cap">카드 보고 떠오르는 게 있으면 그걸로, 없으면 그냥 잊어버려도 돼</div>
          </div>
        </Stage>

        {/* ── 03 흐름 ────────────────────────────── */}
        <Stage no="03" label="흐름" on={active === 2} title={<>한 판은<br />두 부로 흘러가</>}>
          <p className="rv">
            <em>1부는 이야기 만들기</em> — 한 장면 안에서 그 애가 늘 하는 선택을 찾아.
            <em> 2부는 선택 바꾸기</em> — 같은 자리에서 다른 걸 해보고, 안에서 뭐가 달라지는지 봐.
            몇 턴 안에 끝내라는 건 없어. 10번을 가도 100번을 가도 순서는 그대로야.
          </p>
          <div className="rv" style={{ marginBottom: 14 }}><ActsArt /></div>
          <div className="story">
            {STEPS.map((s) => (
              <div key={s.act}>
                {s.part && (
                  <div className="story-part rv">
                    <b>{s.part.no} · {s.part.title}</b>
                    <small>{s.part.goal}</small>
                  </div>
                )}
              <div className={`story-step rv${s.ritual ? " ritual" : ""}`}>
                <span className="story-em" aria-hidden="true">{s.em}</span>
                <span className="story-act">{s.act}</span>
                <b>{s.title}</b>
                <p>{s.body}</p>
                {s.line && (
                  <div className="story-line">
                    <i>{s.line.who}</i>「{s.line.text}」
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>
        </Stage>

        {/* ── 04 조종간 ──────────────────────────── */}
        <Stage no="04" label="조종간" on={active === 3} title={<>흐름은 계속<br />네가 쥐고 있어</>}>
          <p className="rv">
            막히면 질문이 네 갈래로 갈라져. <em>정답 고르는 객관식이 아니라</em> 갈 수
            있는 방향을 보여주는 거야. 눌러도 입력창에 채워지기만 하니까 고쳐서
            보내도 되고, 그냥 네 말로 써도 돼.
          </p>
          <div className="rv" style={{ marginBottom: 12 }}><BranchArt /></div>
          <div className="rv" style={{ display: "grid", gap: 7 }}>
            {WIDEN.map((w) => (
              <div key={w.t} className="row-item">
                <span className="lg">{w.em}</span>
                <div style={{ flex: 1 }}>
                  <b>{w.t}</b>
                  <small>{w.d}</small>
                </div>
              </div>
            ))}
          </div>
          <p className="rv" style={{ margin: "16px 0 14px" }}>
            그리고 언제 넘길지, 언제 멈출지도 전부 네 맘이야.
          </p>
          <div className="rv" style={{ display: "grid", gap: 7 }}>
            {HELM.map((h) => (
              <div key={h.t} className="row-item">
                <span className="lg">{h.em}</span>
                <div style={{ flex: 1 }}>
                  <b>{h.t}</b>
                  <small>{h.d}</small>
                </div>
              </div>
            ))}
          </div>
          <p className="note rv" style={{ marginTop: 10 }}>
            💗 감정 단어는 네가 고른 그대로 써. 딴 말로 바꿔 부르지 않아.
          </p>
        </Stage>

        {/* ── 05 약속 ────────────────────────────── */}
        <Stage no="05" label="약속" on={active === 4} title={<>하는 거랑,<br />안 하는 거</>}>
          <p className="rv">
            무대 올리기 전에 이것만 걸고 갈게. <em>여기서 뭘 하고, 뭘 안 하는지</em>.
          </p>
          <div className="rv" style={{ marginBottom: 12 }}><PromiseArt /></div>
          <div className="ab-vs rv">
            <div className="cmp-col">
              <h4>여기서 하는 거</h4>
              <ul style={{ margin: 0, padding: 0 }}>
                <li>네가 만든 캐릭터로 네 상황을 한 발 떨어져서 보기</li>
                <li>늘 하던 선택을 찾고, 다른 선택을 돌려보기</li>
                <li>원래 하던 선택도 틀렸다고 안 해 — 「알고 하는 것」도 선택이야</li>
              </ul>
            </div>
            <div className="cmp-col replay">
              <h4>안 하는 거</h4>
              <ul style={{ margin: 0, padding: 0 }}>
                <li>진단 안 해. 병명도 검사 결과도 없어</li>
                <li>「이렇게 해야 해」라고 안 해</li>
                <li>네 얘기 누구한테도 자동으로 안 보내</li>
              </ul>
            </div>
          </div>
          <p className="note rv" style={{ marginTop: 12 }}>
            AI 연출은 상담쌤이 아니야. 사람이 필요할 땐 사람한테 가는 게 맞아.
          </p>
        </Stage>

        {/* ── 06 안전 ────────────────────────────── */}
        <Stage no="06" label="안전" on={active === 5} title={<>많이 힘든 말 나오면,<br />무대부터 멈춰</>}>
          <p className="rv">
            네가 쓴 말에 위험한 신호가 보이면 얘기를 이어가는 대신 <em>무대를 멈추고</em>,
            진짜 들어줄 수 있는 데를 알려줘. 지금 바로 눌러서 걸어도 되고.
          </p>
          <div className="rv" style={{ marginBottom: 12 }}><SafetyArt /></div>
          <div className="rv">
            {SAFETY_MESSAGE.crisis.lines.map((l) => (
              <a key={l.label} className="tel" href={`tel:${l.value.replace(/[^0-9]/g, "")}`}>
                <span>{l.label}</span><b>{l.value}</b>
              </a>
            ))}
            <p className="note" style={{ marginTop: 8 }}>
              공짜고, 이름 안 밝혀도 돼. 24시간이야.
            </p>
          </div>
        </Stage>

        {/* ── 07 기록 ────────────────────────────── */}
        <Stage no="07" label="기록" on={active === 6} title={<>네 얘기는 이 폰<br />밖으로 안 나가</>}>
          <p className="rv">
            무대에서 오간 말이랑 커튼콜 기록은 전부 <em>이 기기 브라우저 안에만</em> 남아.
            서버에 안 쌓고, 누구한테도 자동으로 안 보내.
          </p>
          <div className="rv" style={{ marginBottom: 12 }}><PrivacyArt /></div>
          <div className="rv" style={{ display: "grid", gap: 7 }}>
            <div className="row-item">
              <span className="lg">📱</span>
              <div style={{ flex: 1 }}>
                <b>이 브라우저 안에만</b>
                <small>카드 서랍장도 이 기기에서만 열려</small>
              </div>
            </div>
            <div className="row-item">
              <span className="lg">🗑️</span>
              <div style={{ flex: 1 }}>
                <b>지우면 같이 사라져</b>
                <small>브라우저 데이터 지우면 기록도 같이 없어져</small>
              </div>
            </div>
            <div className="row-item">
              <span className="lg">⏱️</span>
              <div style={{ flex: 1 }}>
                <b>한 판에 25분쯤</b>
                <small>하루 {DAILY_SESSION_LIMIT}번까지 — 오래 붙잡아두지 않는 것도 약속이야</small>
              </div>
            </div>
          </div>
        </Stage>

        {/* ── 아웃트로 ───────────────────────────── */}
        <div className="ab-outro rv">
          <h2>같은 자리에서,<br />다른 선택을 한 번 해봐</h2>
          <p>
            오늘 <em>사연 하나, 캐릭터 한 명, 카드 한 장</em>이면 시작돼.<br />
            상대는 안 바뀌어도, 네 안에서 뭔가는 바뀌어.
          </p>
          <Link href="/play" className="cta cta-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            무대 올리기
          </Link>
          <Link href="/drawer" className="cta" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 8 }}>
            내 카드 서랍장 보기
          </Link>
        </div>
      </div>

      <TabBar />
    </>
  );
}
