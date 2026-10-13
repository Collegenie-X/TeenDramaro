"use client";
import { useEffect, useState } from "react";

/** 쿼리스트링 — useSearchParams 대신(정적 빌드에서 Suspense 없이 쓰려고) 마운트 뒤에 읽는다 */
export function useQuery(): [Record<string, string>, boolean] {
  const [q, setQ] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setQ(Object.fromEntries(new URLSearchParams(window.location.search)));
    setReady(true);
  }, []);
  return [q, ready];
}

/** 작품 조립 중에 「빈 씬 세우기」로 왔으면 그 작품 id를 끝까지 들고 간다 */
export const withWork = (href: string, work?: string) =>
  work ? href + (href.includes("?") ? "&" : "?") + "work=" + encodeURIComponent(work) : href;
