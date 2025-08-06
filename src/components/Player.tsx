import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
// 例: アイコンをreact-iconsや独自の場所からインポート
import {
  Heart,
  HeartOff,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";

interface Track {
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
}

interface PlayerProps {
  track: Track | Track[];
  initialIndex?: number;
  accessToken: string;
  shouldAutoPlay?: boolean; // 追加
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const Player: React.FC<PlayerProps> = ({
  track,
  initialIndex = 0,
  accessToken,
}) => {
  // 配列化
  const trackList = useMemo(
    () => (Array.isArray(track) ? track : [track]),
    [track]
  );

  const { player, deviceId, isReady } = useSpotifyPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMsg, setFavoriteMsg] = useState<string | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const [currentTrack, setCurrentTrack] = useState<Track | undefined>(
    undefined
  );

  useEffect(() => {
    setCurrentTrack(trackList[currentIndex]);
    sessionStorage.setItem("lastTrackIndex", currentIndex.toString());

    return () => {
      sessionStorage.setItem("lastTrackIndex", currentIndex.toString());
    };
  }, [trackList, currentIndex]);

  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: Spotify.PlaybackState | null) => {
      if (state) {
        setDuration(state.duration);
        setPosition(state.position);
        setIsPlaying(!state.paused);
        const uri = state.track_window?.current_track?.uri;
        const idx = trackList.findIndex((t) => t.uri === uri);
        if (idx !== -1 && idx !== currentIndex) {
          setCurrentIndex(idx);
        }
      }
    };

    player.addListener("player_state_changed", handleStateChange);

    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (state) {
        setPosition(state.position);
      }
    }, 1000);

    return () => {
      player.removeListener("player_state_changed", handleStateChange);
      clearInterval(interval);
    };
  }, [player, trackList, currentIndex]);

  useEffect(() => {
    if (!deviceId || !isReady || !accessToken || !trackList[currentIndex]?.uri)
      return;

    const play = async () => {
      await fetch("/api/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: trackList.map((t) => t.uri),
          offset: { position: currentIndex },
          deviceId,
        }),
      });

      const postPlayHistory = async (currentTrack: Track, userId: string) => {
        if (!currentTrack || !userId) return;

        const trackData = {
          id: currentTrack.uri.split(":")[2],
          name: currentTrack.name,
          artists: currentTrack.artists,
          album: currentTrack.album,
          duration_ms: currentTrack.duration_ms,
          images: currentTrack.album.images,
        };

        try {
          await fetch("/api/play-history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              track: trackData,
            }),
          });
        } catch (error) {
          console.error("Error posting play history:", error);
        }
      };

      const userId = sessionStorage.getItem("userId");
      if (userId && trackList[currentIndex]) {
        await postPlayHistory(trackList[currentIndex], userId);
      }
    };

    play();
  }, [currentIndex, deviceId, isReady, accessToken, trackList]);

  //お気に入り状態をチェック
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentTrack) return;

      const userId = sessionStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(`/api/favorite?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Favorite status check response:", data); // デバッグ用

          const trackId = currentTrack.uri.split(":")[2];

          // データ構造を安全にチェック
          let favorites = [];
          if (data && Array.isArray(data.favorites)) {
            favorites = data.favorites;
          } else if (data && Array.isArray(data)) {
            favorites = data;
          } else {
            console.warn("Unexpected favorites data structure:", data);
            setIsFavorite(false);
            return;
          }

          const isInFavorites = favorites.some(
            (fav: { song: { spotifyId: string } }) =>
              fav.song?.spotifyId === trackId
          );
          setIsFavorite(isInFavorites);
        } else {
          console.error("Failed to fetch favorites:", response.status);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [currentTrack]);

  const handleFavorite = async () => {
    if (!currentTrack || loadingFavorite) return;

    setLoadingFavorite(true);
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setFavoriteMsg("ユーザー情報が見つかりません");
      setTimeout(() => setFavoriteMsg(null), 2000);
      setLoadingFavorite(false);
      return;
    }

    const trackData = {
      id: currentTrack.uri.split(":")[2],
      name: currentTrack.name,
      artists: currentTrack.artists,
      album: currentTrack.album,
      duration_ms: currentTrack.duration_ms,
    };

    try {
      const response = await fetch("/api/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          track: trackData,
          action: isFavorite ? "remove" : "add",
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // レスポンスの成功フラグをチェック
        if (result.success || result.success !== false) {
          setIsFavorite(!isFavorite);
          setFavoriteMsg(
            isFavorite ? "お気に入りを解除しました" : "お気に入りに追加しました"
          );
        } else {
          // 既にお気に入りに追加されている場合
          if (result.message === "Already in favorites") {
            setIsFavorite(true);
            setFavoriteMsg("既にお気に入りに追加されています");
          } else {
            setFavoriteMsg("エラーが発生しました");
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Favorite API error:", errorData);
        setFavoriteMsg("エラーが発生しました");
      }
    } catch (error) {
      console.error("Error managing favorite:", error);
      setFavoriteMsg("エラーが発生しました");
    }

    setTimeout(() => setFavoriteMsg(null), 2000);
    setLoadingFavorite(false);
  };

  const handleNext = () => {
    if (currentIndex < trackList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // currentTrackが未定義の場合は何も描画しない
  if (!currentTrack || !currentTrack.album) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black"
      style={{
        backgroundImage: `url(${currentTrack.album.images[0]?.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-0" />

      {/* メインUI */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-h-screen p-2 overflow-hidden">
        {favoriteMsg && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-300 text-black font-semibold text-base px-6 py-3 rounded-lg shadow-lg border-red-500 transition-all animate-fade-in">
            {favoriteMsg}
          </div>
        )}
        <div className="flex flex-col items-center w-full max-w-md">
          {/* ジャケット画像 */}
          <div className="relative w-full max-w-[85vw] h-[40vh] sm:h-[50vh] rounded-lg overflow-hidden shadow-2xl">
            <Image
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* 曲情報 */}
          <div className="text-center mt-4 mb-2 px-2">
            <h2 className="text-lg sm:text-xl font-bold text-white break-words">
              {currentTrack.name}
            </h2>
            <p className="text-sm text-white/80 mt-1 break-words">
              {currentTrack.artists.map((a) => a.name).join(", ")} -{" "}
              {currentTrack.album.name}
            </p>
            {/* お気に入りボタン */}
            <div className="flex flex-col items-end mt-3">
              <button
                className={`flex items-end gap-2 px-5 py-2 rounded-full shadow ${
                  loadingFavorite
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-300 hover:bg-red-200"
                }`}
                onClick={handleFavorite}
                disabled={loadingFavorite}
              >
                {isFavorite ? (
                  <Heart size={30} fill="red" />
                ) : (
                  <HeartOff size={30} />
                )}
              </button>
            </div>
          </div>

          {/* シークバー */}
          <div className="w-full px-2">
            <input
              type="range"
              min={0}
              max={duration}
              value={position}
              onChange={async (e) => {
                const seekTo = Number(e.target.value);
                if (player) {
                  await player.seek(seekTo);
                  setPosition(seekTo);
                }
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-neutral-600"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${
                  duration ? (position / duration) * 100 : 0
                }%, rgb(75 85 99) ${
                  duration ? (position / duration) * 100 : 0
                }%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-white/80 text-xs font-mono">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* プレイヤーコントロール */}
          <div className="flex items-center justify-around w-full mt-4">
            <button
              className="text-white/80 hover:text-white"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <SkipBack className="w-7 h-7" />
            </button>
            <button
              onClick={() => player?.togglePlay()}
              className="bg-white text-black rounded-full p-3"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            <button
              className="text-white/80 hover:text-white"
              onClick={handleNext}
              disabled={currentIndex === trackList.length - 1}
            >
              <SkipForward className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Player;
