"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Track } from "../../../types/spotify";
import Player from "../../../components/Player";
import useSpotifyAuth from "../../../hooks/useSpotifyAuth";

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useSpotifyAuth();
  const [track, setTrack] = useState<Track | null>(null);

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
      <h1 className="text-2xl font-bold mb-4">{track.name}</h1>
      <Player track={track} accessToken={accessToken!} />
    </div>
  );
}
