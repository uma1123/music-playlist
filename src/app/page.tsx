"use client";
import { ImSpotify } from "react-icons/im";
import useSpotifyAuth from "../hooks/useSpotifyAuth"; // ←追加
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";

export default function Home() {
  //認証状態等を取得
  const { isAuthenticated, login, isLoading } = useSpotifyAuth();

  if (isLoading) {
    return <div className="p-8">認証状態を確認中...</div>;
  }

  //未認証の場合
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
  } else {
    //認証済みの場合
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-100">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-center mb-8 mt-10">
            Music PlayList
          </h1>
          <SearchBar />
        </div>
      </div>
    );
  }
}
