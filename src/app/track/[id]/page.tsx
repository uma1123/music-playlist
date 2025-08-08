"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Track } from "../../../types/spotify";
import Player from "../../../components/Player";
import useSpotifyAuth from "../../../hooks/useSpotifyAuth";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";
import { ArrowLeft } from "lucide-react";

export default function TrackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { accessToken } = useSpotifyAuth();
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const router = useRouter();
  const {
    currentTrackList,
    setCurrentTrackList,
    setCurrentTrackIndex,
    lastSearchQuery,
  } = useSpotifyPlayerContext();

  useEffect(() => {
    if (!accessToken || !id) return;

    // コンテキストから曲リストを取得
    if (currentTrackList.length > 0) {
      const trackIndex = currentTrackList.findIndex(
        (track) => track.uri.split(":")[2] === id
      );
      if (trackIndex !== -1) {
        setTrackList(currentTrackList);
        setInitialIndex(trackIndex);
        setCurrentTrackIndex(trackIndex);
        return;
      }
    }

    // セッションストレージからフォールバック
    const ids = JSON.parse(sessionStorage.getItem("lastTrackIds") || "[]");
    const idx = Number(sessionStorage.getItem("lastTrackIndex") || "0");

    if (ids.length > 0 && ids.includes(id)) {
      Promise.all(
        ids.map((tid: string) =>
          fetch(`/api/track?id=${tid}`).then((res) => res.json())
        )
      ).then((tracks: Track[]) => {
        setTrackList(tracks);
        setInitialIndex(idx);
        setCurrentTrackList(tracks);
        setCurrentTrackIndex(idx);
      });
    } else {
      fetch(`/api/track?id=${id}`)
        .then((res) => res.json())
        .then((data: Track) => {
          setTrackList([data]);
          setInitialIndex(0);
          setCurrentTrackList([data]);
          setCurrentTrackIndex(0);
        });
    }
  }, [
    accessToken,
    id,
    currentTrackList,
    setCurrentTrackList,
    setCurrentTrackIndex,
  ]);

  const handleBackToSearch = () => {
    if (lastSearchQuery) {
      router.push(`/search/${encodeURIComponent(lastSearchQuery)}`);
    } else {
      router.back();
    }
  };

  if (!trackList.length) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col text-white relative">
      {/* 戻るボタン */}
      <button
        onClick={handleBackToSearch}
        className="absolute top-6 left-6 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-md transition-colors"
        title="検索結果に戻る"
      >
        <ArrowLeft size={24} />
      </button>

      {/* プレイヤーコンテンツ */}
      <div className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        <Player
          track={trackList}
          initialIndex={initialIndex}
          accessToken={accessToken!}
          shouldAutoPlay={false}
        />
      </div>
    </div>
  );
}
