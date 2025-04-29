import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // appDir: true,  // App Routerを使っている場合、このオプションが必要です
  },
  images: {
    domains: ["i.scdn.co"], // ← Spotify画像用ドメインを追加
  },
};

export default nextConfig;
