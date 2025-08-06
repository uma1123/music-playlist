"use client";
import { PlayHistory } from "@/types/spotify";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, Play } from "lucide-react";

//履歴リストコンポーネントの定義
interface HistoryListProps {
  userId: string;
  onTrackSelect?: (trackId: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ userId, onTrackSelect }) => {
  const [history, setHistory] = useState<PlayHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/play-history?userId=${userId}`);
        const data = await response.json();
        console.log("Fetched history:", data);
        setHistory(data.playHistory || data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">再生履歴がありません</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onTrackSelect?.(item.song.spotifyId)}
        >
          <div className="relative w-12 h-12 mr-3 rounded overflow-hidden">
            {item.song.imageUrl ? (
              <Image
                src={item.song.imageUrl}
                alt={item.song.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {item.song.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">{item.song.artist}</p>
            {item.song.album && (
              <p className="text-xs text-gray-400 truncate">
                {item.song.album}
              </p>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-400 ml-2">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatDate(item.playedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
