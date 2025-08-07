"use client";

import { useEffect, useState } from "react";
import { Heart, Play, Clock } from "lucide-react";
import Image from "next/image";
import { Favorite } from "@/types/spotify";

interface FavoritesListProps {
  userId: string;
  onTrackSelect?: (trackId: string) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({
  userId,
  onTrackSelect,
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch(`/api/favorite?userId=${userId}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Favorites API response:", data); // デバッグ用

          // APIレスポンスの構造を確認して適切に設定
          if (data && Array.isArray(data.favorites)) {
            setFavorites(data.favorites);
          } else if (data && Array.isArray(data)) {
            // もしdataが直接配列の場合
            setFavorites(data);
          } else {
            console.warn("Unexpected favorites data structure:", data);
            setFavorites([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", response.status, errorData);
          setError("お気に入りの取得に失敗しました");
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setError("エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleRemoveFavorite = async (favorite: Favorite) => {
    try {
      const trackData = {
        id: favorite.song.spotifyId,
        name: favorite.song.title,
        artists: [{ name: favorite.song.artist }],
        album: {
          name: favorite.song.album || "",
          images: favorite.song.imageUrl
            ? [{ url: favorite.song.imageUrl }]
            : [],
        },
        duration_ms: (favorite.song.duration || 0) * 1000,
      };

      const response = await fetch("/api/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          track: trackData,
          action: "remove",
        }),
      });

      if (response.ok) {
        // favorite.idではなくfavorite.song.idで削除する場合は以下を使用
        setFavorites(favorites.filter((fav) => fav.id !== favorite.id));
      } else {
        console.error("Failed to remove favorite");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  // favoritesが未定義やnullの場合の安全チェックを追加
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // favoritesが未定義、null、または空配列の場合の安全チェック
  if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-400 overflow-y-auto">
        <Heart size={48} className="mb-4" />
        <p className="text-lg">お気に入りの楽曲がありません</p>
        <p className="text-sm">
          楽曲を再生してハートマークをクリックしてみましょう
        </p>
      </div>
    );
  }

  return (
    <div className="h-full max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-700"
          >
            {/* アルバムアート */}
            <div className="flex-shrink-0">
              {favorite.song.imageUrl ? (
                <Image
                  src={favorite.song.imageUrl}
                  alt={favorite.song.album || "Album"}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-md object-cover"
                  style={{ objectFit: "cover" }}
                  unoptimized={true} // 外部画像の場合はtrueに設定
                />
              ) : (
                <div className="w-16 h-16 bg-gray-600 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>

            {/* 楽曲情報 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">
                {favorite.song.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {favorite.song.artist}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                追加日: {formatDate(favorite.createdAt)}
              </p>
            </div>

            {/* 再生時間 */}
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Clock size={14} />
              <span>{formatDuration(favorite.song.duration)}</span>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTrackSelect?.(favorite.song.spotifyId)}
                className="p-2 bg-green-600 hover:bg-green-500 rounded-full transition-colors"
                title="再生"
              >
                <Play size={16} fill="white" />
              </button>
              <button
                onClick={() => handleRemoveFavorite(favorite)}
                className="p-2 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
                title="お気に入りから削除"
              >
                <Heart size={16} fill="white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesList;
