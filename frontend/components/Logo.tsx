"use client";

import { useId } from "react";

type Props = {
  /** mark = 아이콘만, full = 아이콘 + 워드마크 */
  variant?: "mark" | "full";
  size?: number;
  className?: string;
};

/** TeenDramaro 로고 — 무대 커튼 + 타로 카드 + T 모노그램 */
export default function Logo({ variant = "mark", size = 28, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bg = `tdbg-${uid}`;
  const spot = `tdsp-${uid}`;
  const gold = `tdgd-${uid}`;
  const full = variant === "full";

  return (
    <svg
      viewBox={full ? "0 0 420 128" : "0 0 128 128"}
      width={full ? (size * 420) / 128 : size}
      height={size}
      className={className}
      role="img"
      aria-label="TeenDramaro"
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f1636" />
          <stop offset="100%" stopColor="#0b0714" />
        </linearGradient>
        <radialGradient id={spot} cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3d79a" />
          <stop offset="100%" stopColor="#c9a15c" />
        </linearGradient>
      </defs>

      <rect width="128" height="128" rx="30" fill={`url(#${bg})`} />
      <rect width="128" height="128" rx="30" fill={`url(#${spot})`} />

      {/* 무대 커튼 */}
      <path d="M18 18 h20 q-9 46 2 92 h-22 z" fill="#6d1a35" />
      <path d="M110 18 h-20 q9 46 -2 92 h22 z" fill="#6d1a35" />
      <path d="M18 18 h20 q-9 46 2 92 h-8 q-11 -46 -2 -92 z" fill="#4a1026" opacity="0.7" />
      <path d="M110 18 h-20 q9 46 -2 92 h8 q11 -46 2 -92 z" fill="#4a1026" opacity="0.7" />

      {/* 뒤에 겹친 카드 */}
      <g transform="rotate(-13 64 70)" opacity="0.55">
        <rect x="44" y="34" width="40" height="60" rx="7" fill="#2e2247" stroke={`url(#${gold})`} strokeWidth="2" />
      </g>
      <g transform="rotate(13 64 70)" opacity="0.55">
        <rect x="44" y="34" width="40" height="60" rx="7" fill="#2e2247" stroke={`url(#${gold})`} strokeWidth="2" />
      </g>

      {/* 앞 카드 + T 모노그램 */}
      <rect x="44" y="32" width="40" height="62" rx="8" fill="#17102a" stroke={`url(#${gold})`} strokeWidth="2.5" />
      <path d="M53 47 h22 M64 47 v32" stroke={`url(#${gold})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="64" cy="86" r="3" fill={`url(#${gold})`} />
      <ellipse cx="64" cy="104" rx="34" ry="5" fill="#ffe9b8" opacity="0.16" />

      {full && (
        <g fontFamily="'Apple SD Gothic Neo','Pretendard','Noto Sans KR',system-ui,sans-serif">
          <text x="150" y="66" fontSize="34" fontWeight="700" letterSpacing="-0.5" fill="#f4eefb">
            Teen<tspan fill={`url(#${gold})`}>Dramaro</tspan>
          </text>
          <text x="152" y="90" fontSize="14" letterSpacing="3.2" fill="#b6a9c9">
            마음무대 · MIND STAGE
          </text>
        </g>
      )}
    </svg>
  );
}
