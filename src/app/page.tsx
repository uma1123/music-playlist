"use client";

import { ImSpotify } from "react-icons/im";
import useSpotifyAuth from "../hooks/useSpotifyAuth";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, login, isLoading } = useSpotifyAuth();

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

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col text-white">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 mb-6">
                <ImSpotify className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Music Playlist with Spotify
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Spotifyアカウントでログインしてください
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={login}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3"
              >
                <ImSpotify className="w-5 h-5 mr-2" />
                Spotifyでログイン
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col text-white">
      {/* 固定ヘッダー */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Header />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        <SearchBar />
      </div>
    </div>
  );
}
