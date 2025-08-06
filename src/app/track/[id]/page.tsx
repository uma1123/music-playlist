"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Track } from "../../../types/spotify";
import Player from "../../../components/Player";
import useSpotifyAuth from "../../../hooks/useSpotifyAuth";

export default function TrackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { accessToken } = useSpotifyAuth();
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    if (!accessToken || !id) return;
    const ids = JSON.parse(sessionStorage.getItem("lastTrackIds") || "[]");
    const idx = Number(sessionStorage.getItem("lastTrackIndex") || "0");
    if (ids.length > 0 && ids.includes(id)) {
      Promise.all(
        ids.map((tid: string) =>
          fetch(`/api/track?id=${tid}`).then((res) => res.json())
        )
      ).then((tracks) => {
        setTrackList(tracks);
        setInitialIndex(idx);
      });
    } else {
      fetch(`/api/track?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          setTrackList([data]);
          setInitialIndex(0);
        });
    }
  }, [accessToken, id]);

  if (!trackList.length) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col text-white">
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
