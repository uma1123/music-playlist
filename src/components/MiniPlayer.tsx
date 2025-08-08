"use client";
import { useSpotifyPlayerContext } from "@/context/SpotifyPlayerProvider";
import {
  Fullscreen,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const MiniPlayer = () => {
  const {
    player,
    deviceId,
    isReady,
    currentTrackList,
    currentTrackIndex,
    setCurrentTrackIndex,
    lastSearchQuery,
  } = useSpotifyPlayerContext();

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const currentTrack = currentTrackList[currentTrackIndex];

  // ページによってミニプレイヤーの表示を制御（一時停止状態でも表示）
  const shouldShowMiniPlayer = () => {
    if (!currentTrack) return false;
    if (pathname === "/login" || pathname?.startsWith("/track/")) return false;
    return true;
  };

  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: Spotify.PlaybackState | null) => {
      if (state) {
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      }
    };
    player.addListener("player_state_changed", handleStateChange);

    const interval = setInterval(async () => {
      const state = await player?.getCurrentState();
      if (state && !state.paused) {
        setPosition(state.position);
      }
    }, 1000);

    return () => {
      player.removeListener("player_state_changed", handleStateChange);
      clearInterval(interval);
    };
  }, [player]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const playTrackAtIndex = async (index: number) => {
    if (!deviceId || !isReady || !currentTrackList[index]) return;

    try {
      console.log(
        `Playing track at index ${index}:`,
        currentTrackList[index]?.name
      );

      const response = await fetch("/api/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          uris: currentTrackList.map((t) => t.uri),
          offset: { position: index },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Play API error:", errorData);
        throw new Error(`Play API failed: ${response.status}`);
      }

      console.log("✅ Playback started successfully");

      // 再生履歴の投稿
      const userId = sessionStorage.getItem("userId");
      if (userId) {
        const track = currentTrackList[index];
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

      // セッションストレージの更新
      sessionStorage.setItem("lastTrackIndex", index.toString());
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentTrackIndex < currentTrackList.length - 1) {
      const newIndex = currentTrackIndex + 1;
      console.log(`Switching to next track: ${newIndex}`);
      setCurrentTrackIndex(newIndex);
      await playTrackAtIndex(newIndex);
    }
  };

  const handlePrev = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentTrackIndex > 0) {
      const newIndex = currentTrackIndex - 1;
      console.log(`Switching to previous track: ${newIndex}`);
      setCurrentTrackIndex(newIndex);
      await playTrackAtIndex(newIndex);
    }
  };

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (player) {
      try {
        await player.togglePlay();
      } catch (error) {
        console.error("Error toggling play:", error);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    const newPosition = Number(e.target.value);
    if (player) {
      try {
        await player.seek(newPosition);
        setPosition(newPosition);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  };

  const handleFullscreen = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentTrackId = currentTrack.uri.split(":")[2];
    router.push(`/track/${currentTrackId}`);
  };

  const handleBackToSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (lastSearchQuery) {
      router.push(`/search/${encodeURIComponent(lastSearchQuery)}`);
    } else {
      router.back();
    }
  };

  if (!shouldShowMiniPlayer()) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-3 shadow-lg pointer-events-auto z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        {/* 戻るボタン */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={handleBackToSearch}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded p-1 transition-colors pointer-events-auto select-none"
            type="button"
            title="検索結果に戻る"
          >
            <ArrowLeft size={20} />
          </button>

          {/* 曲情報 */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 pointer-events-auto cursor-pointer select-none"
            onClick={handleFullscreen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFullscreen(e);
              }
            }}
          >
            <div className="flex-shrink-0">
              <Image
                src={currentTrack.album.images[0]?.url || ""}
                alt={currentTrack.name}
                width={56}
                height={56}
                className="rounded object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-white font-medium text-sm truncate">
                {currentTrack.name}
              </h4>
              <p className="text-gray-400 hover:text-white text-xs truncate">
                {currentTrack.artists.map((artist) => artist.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* 再生コントロール */}
        <div className="flex flex-col items-center flex-1 max-w-md pointer-events-auto">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handlePrev}
              disabled={currentTrackIndex === 0}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded p-1 transition-colors pointer-events-auto select-none"
              type="button"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={handlePlayPause}
              disabled={!player}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 pointer-events-auto select-none"
              type="button"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              onClick={handleNext}
              disabled={currentTrackIndex >= currentTrackList.length - 1}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded p-1 transition-colors pointer-events-auto select-none"
              type="button"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* シークバー */}
          <div className="flex items-center gap-2 w-full pointer-events-auto">
            <span className="text-gray-400 text-xs w-10 select-none">
              {formatTime(position)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              value={position}
              onChange={handleSeek}
              disabled={!player}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pointer-events-auto"
              style={{
                background: `linear-gradient(to right, #ffffff ${
                  duration ? (position / duration) * 100 : 0
                }%, #4a5568 ${duration ? (position / duration) * 100 : 0}%)`,
              }}
            />
            <span className="text-gray-400 text-xs w-10 select-none">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* フルスクリーンボタン */}
        <div className="flex items-center gap-3 flex-1 justify-end pointer-events-auto">
          <button
            onClick={handleFullscreen}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded p-1 transition-colors pointer-events-auto select-none"
            type="button"
            title="フルスクリーン表示"
          >
            <Fullscreen size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
