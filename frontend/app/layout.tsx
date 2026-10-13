import type { Metadata, Viewport } from "next";
import "./globals.css";

const DESCRIPTION = "씬 하나씩 모아서, 내 안의 무대를 짓는다 — 상황극 무대 × 내 무대 × 내 씬";

/** 탭 제목: 홈은 「마음씬 · MindScene」, 나머지는 「소개 · 마음씬」 처럼 — 각 폴더 layout.tsx 가 앞부분만 정함 */
export const metadata: Metadata = {
  title: { default: "마음씬 · MindScene", template: "%s · 마음씬" },
  description: DESCRIPTION,
  applicationName: "마음씬",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "마음씬" },
  icons: { icon: [{ url: "/mindscene-mark.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }] },
  openGraph: { title: "마음씬 · MindScene", description: DESCRIPTION, siteName: "마음씬", locale: "ko_KR", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c0915",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-frame">
          <div className="app-viewport">{children}</div>
        </div>
      </body>
    </html>
  );
}
