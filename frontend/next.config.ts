import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 씬 서랍 · 조립대 · 나 노트는 「🎬 내 씬」 하나로 합쳤다
  async redirects() {
    return [
      { source: "/drawer", destination: "/scenes", permanent: false },
      { source: "/drawer/:id", destination: "/scenes/:id", permanent: false },
      { source: "/workbench", destination: "/scenes?f=joined", permanent: false },
      { source: "/workbench/:id", destination: "/scenes/join/:id", permanent: false },
      { source: "/note", destination: "/scenes", permanent: false },
    ];
  },
};

export default nextConfig;
