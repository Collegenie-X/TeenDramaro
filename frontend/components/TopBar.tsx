"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar({
  title, sub, back, right, children,
}: {
  title: string;
  sub?: string;
  /** 문자열이면 그 경로로, true면 브라우저 뒤로 */
  back?: string | true;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="topbar">
      <div className="topbar-row">
        {back === true && <button className="topbar-back" onClick={() => router.back()} aria-label="뒤로">‹</button>}
        {typeof back === "string" && <Link className="topbar-back" href={back} aria-label="뒤로">‹</Link>}
        <div className="topbar-info">
          <div className="topbar-title">{title}</div>
          {sub && <div className="topbar-sub">{sub}</div>}
        </div>
        {right && <div className="topbar-right">{right}</div>}
      </div>
      {children}
    </header>
  );
}
