/** 감정 그룹 아이콘 — 시스템 이모지 대신 쓰는 커스텀 SVG. 색은 currentColor. */
export default function EmoIcon({ id, size = 22 }: { id: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "sad": // 비구름
      return (
        <svg {...p}>
          <path d="M7 15a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 8.5a3.5 3.5 0 0 1 .5 6.5H7Z" fill="currentColor" fillOpacity=".18" />
          <path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" />
        </svg>
      );
    case "angry": // 불꽃
      return (
        <svg {...p}>
          <path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.2 1.2.8 2 1.5 2.5C11.5 8.5 11 5.5 12 3Z" fill="currentColor" fillOpacity=".25" />
          <path d="M12 21a6 6 0 0 1-6-6c0-2 1-3.5 2-4.5" />
        </svg>
      );
    case "anx": // 파도
      return (
        <svg {...p}>
          <path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
          <path d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" strokeOpacity=".7" />
          <path d="M3 20c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" strokeOpacity=".4" />
        </svg>
      );
    case "shame": // 작아지는 얼굴 (점선 원)
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" strokeDasharray="3 2.5" />
          <circle cx="9.5" cy="11" r=".9" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="11" r=".9" fill="currentColor" stroke="none" />
          <path d="M9.5 15.5c1.5-1 3.5-1 5 0" />
        </svg>
      );
    case "numb": // 안개
      return (
        <svg {...p}>
          <path d="M4 9h12M6 13h14M4 17h10" />
          <path d="M18 9h2M8 17h0" strokeOpacity=".5" />
        </svg>
      );
    case "warm": // 구름 사이 해
      return (
        <svg {...p}>
          <circle cx="15" cy="9" r="3.5" fill="currentColor" fillOpacity=".3" />
          <path d="M15 2.5v1.5M20.5 9H19M19.6 4.4l-1 1M10.4 4.4l1 1" />
          <path d="M6 19a3.5 3.5 0 0 1-.3-7 4.5 4.5 0 0 1 8.6 1.2A2.9 2.9 0 0 1 14.5 19H6Z" fill="currentColor" fillOpacity=".15" />
        </svg>
      );
    default:
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
