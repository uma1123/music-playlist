import { useEffect, useState, useMemo, useCallback } from "react";
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

  const {
    player,
    deviceId,
    isReady,
    currentTrackList,
    currentTrackIndex,
    setCurrentTrackList,
    setCurrentTrackIndex,
  } = useSpotifyPlayerContext();

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMsg, setFavoriteMsg] = useState<string | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // コンテキストとの同期処理を安全に行う
  const updateContext = useCallback(() => {
    if (!hasInitialized) {
      setCurrentTrackList(
        trackList.map((t) => ({
          ...t,
          id: t.uri.split(":")[2], // Extract id from uri if not present
        }))
      );
      setCurrentTrackIndex(currentIndex);
      setHasInitialized(true);
    }
  }, [
    trackList,
    currentIndex,
    setCurrentTrackList,
    setCurrentTrackIndex,
    hasInitialized,
  ]);

  // 初期化処理
  useEffect(() => {
    updateContext();
  }, [updateContext]);

  // コンテキストからの同期（一方向のみ）
  useEffect(() => {
    if (hasInitialized && currentTrackList.length > 0) {
      const isSameTrackList =
        currentTrackList.length === trackList.length &&
        currentTrackList.every(
          (track, index) => track.uri === trackList[index]?.uri
        );

      if (isSameTrackList && currentTrackIndex !== currentIndex) {
        setCurrentIndex(currentTrackIndex);
      }
    }
  }, [
    currentTrackIndex,
    currentTrackList,
    trackList,
    currentIndex,
    hasInitialized,
  ]);

  const currentTrack = useMemo(
    () => trackList[currentIndex],
    [trackList, currentIndex]
  );

  // セッションストレージの更新
  useEffect(() => {
    if (hasInitialized) {
      sessionStorage.setItem("lastTrackIndex", currentIndex.toString());
    }
  }, [currentIndex, hasInitialized]);

  // プレイヤーの状態監視
  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: Spotify.PlaybackState | null) => {
      if (state) {
        setDuration(state.duration);
        setPosition(state.position);
        setIsPlaying(!state.paused);

        // URIベースでの同期（無限ループを防ぐため条件を厳しく）
        const currentUri = state.track_window?.current_track?.uri;
        if (currentUri && currentTrack && currentUri !== currentTrack.uri) {
          const newIndex = trackList.findIndex((t) => t.uri === currentUri);
          if (newIndex !== -1 && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            setCurrentTrackIndex(newIndex);
          }
        }
      }
    };

    player.addListener("player_state_changed", handleStateChange);

    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (state && !state.paused) {
        setPosition(state.position);
      }
    }, 1000);

    return () => {
      player.removeListener("player_state_changed", handleStateChange);
      clearInterval(interval);
    };
  }, [player, trackList, currentIndex, currentTrack, setCurrentTrackIndex]);

  // 自動再生処理
  useEffect(() => {
    if (
      !deviceId ||
      !isReady ||
      !accessToken ||
      !currentTrack?.uri ||
      !hasInitialized
    ) {
      return;
    }

    const play = async () => {
      try {
        console.log("Starting playback for track:", currentTrack.name);

        // 現在の再生状態をチェック
        const currentState = await player?.getCurrentState();

        // 同じ曲が既に再生中の場合は何もしない
        if (
          currentState &&
          currentState.track_window?.current_track?.uri === currentTrack.uri &&
          currentState.track_window?.current_track?.uri
        ) {
          console.log("Same track is already playing, skipping play request");
          setIsPlaying(!currentState.paused);
          setPosition(currentState.position);
          setDuration(currentState.duration);
          return;
        }

        const response = await fetch("/api/play", {
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

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Play API error:", errorData);

          if (response.status === 401) {
            console.log("Authentication failed, redirecting to login...");
            window.location.href = "/api/auth/login";
            return;
          }

          throw new Error(`Play API failed: ${response.status}`);
        }

        console.log("✅ Playback started successfully");

        // 再生履歴の投稿
        const userId = sessionStorage.getItem("userId");
        if (userId) {
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
        }
      } catch (error) {
        console.error("Error starting playback:", error);
      }
    };

    // 遅延を短縮し、重複実行を防ぐ
    const timeoutId = setTimeout(play, 500);

    return () => clearTimeout(timeoutId);
  }, [
    currentIndex,
    deviceId,
    isReady,
    accessToken,
    trackList,
    currentTrack,
    hasInitialized,
    player, // playerを依存配列に追加
  ]);

  // お気に入り状態をチェック
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentTrack) return;

      const userId = sessionStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(`/api/favorite?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const trackId = currentTrack.uri.split(":")[2];

          let favorites = [];
          if (data && Array.isArray(data.favorites)) {
            favorites = data.favorites;
          } else if (data && Array.isArray(data)) {
            favorites = data;
          } else {
            setIsFavorite(false);
            return;
          }

          const isInFavorites = favorites.some(
            (fav: { song: { spotifyId: string } }) =>
              fav.song?.spotifyId === trackId
          );
          setIsFavorite(isInFavorites);
        } else {
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

        if (result.success || result.success !== false) {
          setIsFavorite(!isFavorite);
          setFavoriteMsg(
            isFavorite ? "お気に入りを解除しました" : "お気に入りに追加しました"
          );
        } else {
          if (result.message === "Already in favorites") {
            setIsFavorite(true);
            setFavoriteMsg("既にお気に入りに追加されています");
          } else {
            setFavoriteMsg("エラーが発生しました");
          }
        }
      } else {
        setFavoriteMsg("エラーが発生しました");
      }
    } catch (error) {
      console.error("Error managing favorite:", error);
      setFavoriteMsg("エラーが発生しました");
    }

    setTimeout(() => setFavoriteMsg(null), 2000);
    setLoadingFavorite(false);
  };

  const handleNext = async () => {
    if (currentIndex < trackList.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentTrackIndex(newIndex);

      // 新しい曲を再生
      try {
        const response = await fetch("/api/play", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: trackList.map((t) => t.uri),
            offset: { position: newIndex },
            deviceId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Play API failed: ${response.status}`);
        }

        // 再生履歴の投稿
        const userId = sessionStorage.getItem("userId");
        if (userId) {
          const track = trackList[newIndex];
          const trackData = {
            id: track.uri.split(":")[2],
            name: track.name,
            artists: track.artists,
            album: track.album,
            duration_ms: track.duration_ms,
            images: track.album.images,
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
        }
      } catch (error) {
        console.error("Error playing next track:", error);
      }
    }
  };

  const handlePrev = async () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentTrackIndex(newIndex);

      // 新しい曲を再生
      try {
        const response = await fetch("/api/play", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: trackList.map((t) => t.uri),
            offset: { position: newIndex },
            deviceId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Play API failed: ${response.status}`);
        }

        // 再生履歴の投稿
        const userId = sessionStorage.getItem("userId");
        if (userId) {
          const track = trackList[newIndex];
          const trackData = {
            id: track.uri.split(":")[2],
            name: track.name,
            artists: track.artists,
            album: track.album,
            duration_ms: track.duration_ms,
            images: track.album.images,
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
        }
      } catch (error) {
        console.error("Error playing previous track:", error);
      }
    }
  };

  if (!currentTrack || !currentTrack.album) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black"
      style={{
        backgroundImage: `url(${currentTrack.album.images[0]?.url})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-h-screen p-4 overflow-hidden">
        {favoriteMsg && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-300 text-black font-semibold text-base px-6 py-3 rounded-lg shadow-lg border-red-500 transition-all animate-fade-in">
            {favoriteMsg}
          </div>
        )}

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
          <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <Image
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="text-center mb-8 px-4">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
              {currentTrack.name}
            </h2>
            <p className="text-lg text-white/70">
              {currentTrack.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

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
