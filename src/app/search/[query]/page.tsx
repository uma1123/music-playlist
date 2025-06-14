"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Track, SearchResult } from "../../../types/spotify";
import TrackList from "../../../components/TrackList";
import SearchBar from "@/components/SearchBar";

export default function SearchResultPage() {
  const params = useParams<{ query: string }>();
  const query = params?.query ?? "";
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // 検索ワードが変わったらリセット
  useEffect(() => {
    setTracks([]);
    setOffset(0);
    setHasMore(true);
  }, [query]);

  // 初回・検索ワード変更時に取得
  useEffect(() => {
    if (!query) return;
    fetchTracks(0, true);
    // eslint-disable-next-line
  }, [query]);

  // 曲を取得する関数
  const fetchTracks = async (offsetValue = offset, isReset = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(
          query as string
        )}&offset=${offsetValue}`
      );
      const data: SearchResult = await res.json();
      if (res.ok) {
        setTracks((prev) =>
          isReset ? data.tracks.items : [...prev, ...data.tracks.items]
        );
        setOffset(offsetValue + data.tracks.items.length);
        setHasMore(
          data.tracks.items.length > 0 &&
            data.tracks.total > offsetValue + data.tracks.items.length
        );
      } else {
        setError(data.error || "検索に失敗しました");
      }
    } catch {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (track: Track) => {
    router.push(`/track/${track.id}`);
  };

  return (
    <div className="container mx-auto p-8 overflow-y-auto h-screen">
      <SearchBar />
      <h1 className="text-2xl font-bold mb-6">「{query}」の検索結果</h1>
      {loading && tracks.length === 0 && <div>検索中...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <>
          <TrackList tracks={tracks} onTrackSelect={handleTrackSelect} />
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchTracks(offset)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
                disabled={loading}
              >
                {loading ? "読み込み中..." : "もっと見る"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
