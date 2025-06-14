"use client";
import useSpotifyAuth from "../hooks/useSpotifyAuth"; // ←追加
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const { isAuthenticated, login, isLoading } = useSpotifyAuth(); // ←追加

  if (isLoading) {
    return <div className="p-8">認証状態を確認中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Spotifyでログインしてください</p>
        <button
          onClick={login}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Spotifyでログイン
        </button>
      </div>
    );
  }

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
