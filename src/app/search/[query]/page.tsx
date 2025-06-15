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

  useEffect(() => {
    setTracks([]);
    setOffset(0);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    if (!query) return;
    fetchTracks(0, true);
    // eslint-disable-next-line
  }, [query]);

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

        // ★ ここで取得した曲をキューに自動追加 ★
        if (isReset && data.tracks.items.length > 0) {
          await addTracksToQueue(data.tracks.items);
        }
      } else {
        setError(data.error || "検索に失敗しました");
      }
    } catch {
      setError("検索に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 曲をキューに追加（最初の1曲は再生）
  const addTracksToQueue = async (tracks: Track[]) => {
    for (let i = 0; i < tracks.length; i++) {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: tracks[i].uri }),
      });

      if (i === 0) {
        await fetch("/api/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uri: tracks[i].uri }),
        });
      }
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
