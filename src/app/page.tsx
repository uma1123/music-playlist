"use client";

import { ImSpotify } from "react-icons/im";
import useSpotifyAuth from "../hooks/useSpotifyAuth";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useEffect } from "react";

export default function Home() {
  // 認証状態などを取得
  const { isAuthenticated, login, isLoading } = useSpotifyAuth();

  // useEffectは必ずトップレベルで呼ぶ
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (!res.ok) throw new Error("認証情報取得に失敗");
          const user = await res.json();
          const uid = user?.id || user?.userId || user?.spotifyId;
          if (uid) {
            sessionStorage.setItem("userId", uid);
            console.log("UserId set in sessionStorage:", uid);
          } else {
            console.warn("User IDがレスポンスに含まれていません:", user);
          }
        } catch (err) {
          console.error("Error fetching user ID:", err);
        }
      })();
    }
  }, [isAuthenticated]);

  // ローディング中は読み込み画面を表示
  if (isLoading) {
    return <div className="p-8">認証状態を確認中...</div>;
  }

  // 未認証の場合はログイン画面
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen text-white">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-[#1e1e2f] to-[#121220] mb-6">
                <ImSpotify className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-black">
                Music Playlist with Spotify
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Spotifyアカウントでログインしてください
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={login}
                className="w-full bg-gradient-to-b from-[#1e1e2f] to-[#121220] hover:to-[#1e1e1f] text-white"
              >
                ログイン
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 認証済みの場合の画面表示
  return (
    <div className="bg-slate-900/90 min-h-screen flex flex-col">
      {/* 固定ヘッダー + 検索バー */}
      <div className="top-0 z-30 bg-slate-900/90 ">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Header />
          <div className="mt-4">
            <SearchBar />
          </div>
        </div>
      </div>
    </div>
  );
}
