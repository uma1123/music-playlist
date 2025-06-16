"use client";
import { ReactNode } from "react";
import useSpotifyAuth from "../hooks/useSpotifyAuth";
import { SpotifyPlayerProvider } from "../context/SpotifyPlayerProvider";

//アプリ全体のproviderラッパー
export default function Providers({ children }: { children: ReactNode }) {
  //認証済みならアクセストークンを取得
  const { accessToken } = useSpotifyAuth();
  //アクセストークンがなければ、そのまま子要素を返す(プレイヤー機能なし)
  if (!accessToken) return <>{children}</>;
  //アクセストークンがあれば、SpotifyPlayerProviderでラップ
  return (
    <SpotifyPlayerProvider accessToken={accessToken}>
      {children}
    </SpotifyPlayerProvider>
  );
}
