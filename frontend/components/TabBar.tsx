"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildInsights, NOTE_MIN_PIECES } from "@/lib/insight";
import { loadMarks, loadPieces, loadRevisions, loadWorks, useStore } from "@/lib/store";

/** 탭은 셋 — 씬을 만드는 곳(홈) · 내 씬이 다 모인 곳 · 소개 */
const TABS = [
  { href: "/", icon: "🏠", label: "홈" },
  { href: "/scenes", icon: "🎬", label: "내 씬" },
  { href: "/about", icon: "✨", label: "소개" },
];

/** 「보이는 것」 새 줄 수 — 아직 맞아/아닌데/잘 모르겠어를 안 누른 줄 */
export function useNewInsightCount() {
  const [n] = useStore(() => {
    const pieces = loadPieces();
    if (pieces.length < NOTE_MIN_PIECES) return 0;
    const marks = loadMarks();
    return buildInsights(pieces, loadRevisions(), loadWorks()).filter((i) => !marks[i.key]).length;
  }, 0);
  return n;
}

export default function TabBar() {
  const path = usePathname();
  const fresh = useNewInsightCount();
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`tab ${on ? "on" : ""}`}>
            <i>{t.icon}</i>
            {t.label}
            {t.href === "/scenes" && fresh > 0 && <span className="dot">{fresh}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
