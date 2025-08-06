import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
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
  shouldAutoPlay?: boolean;
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
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-h-screen p-4 overflow-hidden">
        {favoriteMsg && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-300 text-black font-semibold text-base px-6 py-3 rounded-lg shadow-lg border-red-500 transition-all animate-fade-in">
            {favoriteMsg}
          </div>
        )}

        {/* お気に入りボタン - 右上に固定 */}
        <div className="absolute top-8 right-8 z-20">
          <button
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg ${
              loadingFavorite
                ? "bg-gray-400 cursor-not-allowed"
                : isFavorite
                ? "bg-red-500 hover:bg-red-400"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            onClick={handleFavorite}
            disabled={loadingFavorite}
            title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
          >
            {isFavorite ? (
              <Heart size={20} fill="white" className="text-white" />
            ) : (
              <HeartOff size={20} className="text-white" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-lg">
          {/* ジャケット画像 */}
          <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <Image
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* 曲情報 */}
          <div className="text-center mb-8 px-4">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
              {currentTrack.name}
            </h2>
            <p className="text-lg text-white/70">
              {currentTrack.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          {/* シークバー */}
          <div className="w-full max-w-md mb-6">
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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20"
              style={{
                background: `linear-gradient(to right, #8b5cf6 ${
                  duration ? (position / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) ${
                  duration ? (position / duration) * 100 : 0
                }%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-white/60 text-sm">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* プレイヤーコントロール */}
          <div className="flex items-center justify-center gap-8">
            <button
              className="text-white/70 hover:text-white transition-colors disabled:opacity-30"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <SkipBack size={32} />
            </button>

            <button
              onClick={() => player?.togglePlay()}
              className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause size={28} />
              ) : (
                <Play size={28} className="ml-1" />
              )}
            </button>

            <button
              className="text-white/70 hover:text-white transition-colors disabled:opacity-30"
              onClick={handleNext}
              disabled={currentIndex === trackList.length - 1}
            >
              <SkipForward size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
