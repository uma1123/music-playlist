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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">再生履歴がありません</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-700"
          onClick={() => onTrackSelect?.(item.song.spotifyId)}
        >
          <div className="flex-shrink-0">
            {item.song.imageUrl ? (
              <Image
                src={item.song.imageUrl}
                alt={item.song.title}
                width={64}
                height={64}
                className="w-16 h-16 rounded-md object-cover"
                unoptimized={true}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-600 rounded-md flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">
              {item.song.title}
            </h3>
            <p className="text-sm text-gray-400 truncate">{item.song.artist}</p>
            <p className="text-xs text-gray-500 mt-1">
              追加日: {formatDate(item.playedAt)}
            </p>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Clock size={14} />
            <span>{formatDuration(item.song.duration)}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrackSelect?.(item.song.spotifyId);
            }}
            className="p-2 bg-green-600 hover:bg-green-500 rounded-full transition-colors"
            title="再生"
          >
            <Play size={16} fill="white" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;
