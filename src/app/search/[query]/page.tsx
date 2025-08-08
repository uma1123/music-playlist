"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Track, SearchResult } from "../../../types/spotify";
import TrackList from "../../../components/TrackList";
import SearchBar from "@/components/SearchBar";
import { Header } from "@/components/Header";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";

export default function SearchResultPage() {
  const params = useParams<{ query: string }>();
  const query = params?.query ?? "";
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const { setCurrentTrackList, setCurrentTrackIndex, setLastSearchQuery } =
    useSpotifyPlayerContext();

  // 検索クエリを保存
  useEffect(() => {
    if (query) {
      setLastSearchQuery(decodeURIComponent(query));
    }
  }, [query, setLastSearchQuery]);

  //クエリが変わったらリセット
  useEffect(() => {
    setTracks([]);
    setOffset(0);
    setHasMore(true);
  }, [query]);

  //クエリが変わったら最初の検索を実行
  useEffect(() => {
    if (!query) return;
    fetchTracks(0, true);
    // eslint-disable-next-line
  }, [query]);

  //検索APIから曲を取得
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

  //曲がクリックされた詳細ページへ遷移
  const handleTrackSelect = (track: Track) => {
    // プレイヤーコンテキストに曲リストとインデックスを設定
    const trackIndex = tracks.findIndex((t) => t.id === track.id);
    setCurrentTrackList(tracks);
    setCurrentTrackIndex(trackIndex);

    // セッションストレージにも保存（後方互換性のため）
    sessionStorage.setItem(
      "lastTrackIds",
      JSON.stringify(tracks.map((t) => t.id))
    );
    sessionStorage.setItem("lastTrackIndex", trackIndex.toString());

    router.push(`/track/${track.id}`);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col">
      {/* 固定ヘッダー + 検索バー */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Header />
          <div className="mt-4">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* 検索結果：ミニプレイヤー分の余白を追加 */}
      <div className="flex-1 overflow-hidden">
        <div className="overflow-y-auto h-[calc(100vh-128px)] px-4 py-6 pb-32 container max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-white">
            「{decodeURIComponent(query)}」の検索結果
          </h1>

          {loading && tracks.length === 0 && (
            <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          {error && <div className="text-red-500">{error}</div>}

          {!loading && !error && (
            <>
              <TrackList tracks={tracks} onTrackSelect={handleTrackSelect} />
              {hasMore && (
                <div className="flex justify-center mt-6 mb-8">
                  <button
                    onClick={() => fetchTracks(offset)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow transition-colors duration-300"
                    disabled={loading}
                  >
                    {loading ? "読み込み中..." : "もっと見る"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
