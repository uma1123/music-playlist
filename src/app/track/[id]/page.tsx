"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Track } from "../../../types/spotify";
import Player from "../../../components/Player";
import useSpotifyAuth from "../../../hooks/useSpotifyAuth";

export default function TrackDetailPage() {
  //urlから曲IDを取得
  const params = useParams<{ id: string }>();
  const id = params?.id;
  //spotify認証状態を取得
  const { accessToken } = useSpotifyAuth();
  //曲状態を管理
  const [track, setTrack] = useState<Track | null>(null);

  //曲IDやアクセストークンが変わったらAPIから曲情報を主翼
  useEffect(() => {
    if (!accessToken || !id) return;
    fetch(`/api/track?id=${id}`)
      .then((res) => res.json())
      .then((data) => setTrack(data))
      .catch(() => setTrack(null));
  }, [accessToken, id]);

  if (!track) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <Player track={track} accessToken={accessToken!} />
    </div>
  );
}
