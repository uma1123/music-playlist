import { useEffect, useState } from "react";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useMemo } from "react";

interface PlayerProps {
  track: Track | Track[]; // 単一曲または複数曲
  initialIndex?: number;
  accessToken: string;
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
  // 単一曲でも配列化して扱う
  const trackList = useMemo(
    () => (Array.isArray(track) ? track : [track]),
    [track]
  );
  const { player, deviceId, isReady } = useSpotifyPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>(
    trackList[initialIndex]
  );

  useEffect(() => {
    setCurrentTrack(trackList[currentIndex]);
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
      try {
        await fetch("/api/play", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: trackList.map((t) => t.uri),
            offset: { position: currentIndex },
            deviceId,
          }),
        });
      } catch (err) {
        console.error("playback error", err);
      }
    };

    play();
  }, [deviceId, isReady, accessToken, currentIndex, trackList]);

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

      {/* メインコンテナ */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 overflow-y-auto">
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
          <div className="w-full max-w-[85vw] sm:max-w-xs md:max-w-sm">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 85vw, (max-width: 768px) 24rem, 24rem"
              />
            </div>
          </div>
          <div className="w-full text-center mt-6 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg break-words">
              {currentTrack.name}
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-2 drop-shadow break-words px-2">
              {currentTrack.artists.map((a) => a.name).join(", ")} -{" "}
              {currentTrack.album.name}
            </p>
          </div>
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
            <div className="flex justify-between w-full mt-2 text-white/80 text-xs font-mono">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center justify-around w-full mt-6">
            <button
              className="text-white/80 hover:text-white transition-colors"
              onClick={handlePrev}
              aria-label="前の曲"
              disabled={currentIndex === 0}
            >
              <SkipBack className="w-8 h-8 sm:w-9 sm:h-9" />
            </button>
            <button
              onClick={() => player?.togglePlay()}
              className="bg-white text-black rounded-full shadow-lg hover:scale-105 active:scale-100 transition p-4"
              aria-label={isPlaying ? "一時停止" : "再生"}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
              ) : (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
              )}
            </button>
            <button
              className="text-white/80 hover:text-white transition-colors"
              onClick={handleNext}
              aria-label="次の曲"
              disabled={currentIndex === trackList.length - 1}
            >
              <SkipForward className="w-8 h-8 sm:w-9 sm:h-9" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Player;
