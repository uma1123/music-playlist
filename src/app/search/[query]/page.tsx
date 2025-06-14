"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Track, SearchResult } from "../../../types/spotify";
import TrackList from "../../../components/TrackList";
import SearchBar from "@/components/SearchBar";
//import useSpotifyAuth from "../../../hooks/useSpotifyAuth";

export default function SearchResultPage() {
  const params = useParams<{ query: string }>();
  const query = params?.query ?? "";
  //const { accessToken } = useSpotifyAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(query as string)}`)
      .then((res) => res.json())
      .then((data: SearchResult) => setTracks(data.tracks.items))
      .catch(() => setError("検索に失敗しました"))
      .finally(() => setLoading(false));
  }, [query]);

  const handleTrackSelect = (track: Track) => {
    router.push(`/track/${track.id}`);
  };

  return (
    <div className="container mx-auto p-8">
      <SearchBar />
      <h1 className="text-2xl font-bold mb-6">「{query}」の検索結果</h1>
      {loading && <div>検索中...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <TrackList tracks={tracks} onTrackSelect={handleTrackSelect} />
      )}
    </div>
  );
}
