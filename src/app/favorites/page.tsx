"use client";
import FavoritesList from "@/components/FavoriteList";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FavoritePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          console.log("User Id fetched:", data.userId);
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
    return <div className="p-8">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">お気に入り</h1>
            <p className="text-gray-400 mt-1">お気に入りに追加した楽曲一覧</p>
          </div>
        </div>

        {/* お気に入り一覧 */}
        {userId ? (
          <FavoritesList userId={userId} onTrackSelect={handleTrackSelect} />
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-400">ユーザー情報を取得できませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}
