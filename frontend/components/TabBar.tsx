"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "🎭", label: "무대" },
  { href: "/drawer", icon: "🗄️", label: "카드 서랍장" },
  { href: "/about", icon: "🛡️", label: "안전·안내" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={`tab ${path === t.href ? "on" : ""}`}>
          <i>{t.icon}</i>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
