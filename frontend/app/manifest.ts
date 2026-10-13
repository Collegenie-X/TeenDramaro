import type { MetadataRoute } from "next";

/** 홈 화면에 추가했을 때의 이름 · 아이콘 · 색 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마음씬 · MindScene",
    short_name: "마음씬",
    description: "씬 하나씩 모아서, 내 안의 무대를 짓는다",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0915",
    theme_color: "#0c0915",
    icons: [
      { src: "/mindscene-mark.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
