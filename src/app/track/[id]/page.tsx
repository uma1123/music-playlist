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

  if (!trackList.length) return <div>Loading...</div>;

  return (
    <div className="p-1">
      <Player
        track={trackList}
        initialIndex={initialIndex}
        accessToken={accessToken!}
        shouldAutoPlay={false}
      />
    </div>
  );
}
