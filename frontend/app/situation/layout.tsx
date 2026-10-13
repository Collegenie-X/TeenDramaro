import type { Metadata } from "next";

export const metadata: Metadata = { title: "상황극 고르기" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
