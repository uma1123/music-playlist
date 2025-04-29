"use client"; // クライアントコンポーネントです

import { useState } from "react";
import { Track } from "../types/spotify";
import useSpotifyAuth from "../hooks/useSpotifyAuth"; // 修正したフックをインポート
import SearchBar from "../components/SearchBar";
import TrackList from "../components/TrackList";
import Player from "../components/Player";

export default function Home() {
  // useSpotifyAuth から isAuthenticated, login, isLoading を取得
  const { isAuthenticated, login, isLoading } = useSpotifyAuth();
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchLoading, setSearchLoading] = useState(false); // 検索中のローディング状態
  const [error, setError] = useState<string | null>(null);

  // 検索実行時のハンドラ
  const handleSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true); // 検索開始時にローディングを true に
    setError(null); // エラーをクリア
    try {
      // /api/search API ルートを呼び出し
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error: ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data.tracks.items); // 検索結果を設定
    } catch (err: any) {
      console.error("Search error:", err);
      setError(`検索中にエラーが発生しました: ${err.message}`);
      setSearchResults([]);
    } finally {
      setSearchLoading(false); // 検索終了時にローディングを false に
    }
  };

  // 曲選択時のハンドラ
  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    setSearchResults([]); // 検索結果表示を閉じる
  };

  // --- 認証状態による表示の切り替え ---

  // isLoading が true の間は、クッキー確認中なのでローディング表示などを行います
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl font-semibold">
        Loading authentication status...
      </div>
    );
  }

  // isLoading が false になり、isAuthenticated が false の場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Music Player</h1>
          <p className="mb-4">Spotifyアカウントでログインしてください</p>
          <button
            onClick={login} // ログイン関数を呼び出し
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Spotifyでログイン
          </button>
        </div>
      </div>
    );
  } else {
    // isLoading が false になり、isAuthenticated が true の場合は認証済み画面を表示
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-4">
            Simple Spotify Player
          </h1>
          <SearchBar onSearch={handleSearch} /> {/* 検索バーコンポーネント */}
        </header>

        <main className="container mx-auto">
          {searchLoading && ( // 検索中のローディング表示
            <div className="text-center text-blue-500">検索中・・・</div>
          )}
          {error && <div className="text-center text-red-500">{error}</div>}{" "}
          {/* 検索エラー表示 */}
          {/* 検索結果の表示 */}
          {!searchLoading && !error && searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">検索結果</h2>
              <TrackList
                tracks={searchResults}
                onTrackSelect={handleTrackSelect}
              />
            </div>
          )}
          {/* 選択された曲情報の表示 */}
          {!searchLoading && !error && selectedTrack && (
            <div className="mb-8 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4">選択されたトラック</h2>
              <Player track={selectedTrack} /> {/* プレイヤーコンポーネント */}
            </div>
          )}
          {/* 初期メッセージまたは検索結果/選択曲がない場合 */}
          {!searchLoading &&
            !error &&
            !searchResults.length &&
            !selectedTrack && (
              <div className="text-center text-gray-500">
                曲を検索してください。
              </div>
            )}
        </main>
      </div>
    );
  }
}
