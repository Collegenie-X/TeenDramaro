import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음무대 · MindStage",
  description: "타로 카드 × 사이코드라마 × AI 디렉터 — 가상의 나로 내 이야기를 연출하는 무대",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "마음무대" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0714",
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
