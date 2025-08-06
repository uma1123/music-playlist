"use client";
import { useRouter } from "next/navigation";
import HistoryList from "@/components/HistoryList";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export default function HistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          console.log("User ID fetched:", data.userId);
          setUserId(data.userId);
        } else {
          console.error("User ID not found or error fetching session");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  const handleTrackSelect = (trackId: string) => {
    router.push(`/track/${trackId}`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col text-white">
      {/* 固定ヘッダー */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Header />
          <h1 className="text-3xl font-bold mt-4">再生履歴</h1>
          <p className="text-gray-400 mt-1">最近再生した楽曲一覧</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        {userId ? (
          <HistoryList userId={userId} onTrackSelect={handleTrackSelect} />
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-400">ユーザー情報を取得できませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}
