// components/Player.tsx
import { useEffect, useState } from "react";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface PlayerProps {
  track: Track;
  accessToken: string;
}

const Player: React.FC<PlayerProps> = ({ track, accessToken }) => {
  const { player, deviceId, isReady } = useSpotifyPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (state) {
        setPosition(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [player]);

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = Number(e.target.value);
    if (player) {
      await player.seek(seekTo);
      setPosition(seekTo);
    }
  };

  const handlePlayPause = async () => {
    if (!player) return;

    try {
      const state = await player.getCurrentState();
      if (!state) return;

      if (state.paused) {
        await player.resume();
        setIsPlaying(true);
      } else {
        await player.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("play/pause error", err);
    }
  };

  useEffect(() => {
    if (!deviceId || !isReady) return;

    const play = async () => {
      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [track.uri],
            }),
          }
        );
        setIsPlaying(true);
      } catch (err) {
        console.error("playback error", err);
      }
    };

    play();
  }, [track.uri, accessToken, deviceId, isReady]);

  // 秒数を mm:ss 形式に変換する関数を追加
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleNext = async () => {
    if (player) {
      try {
        await player.nextTrack();
      } catch (err) {
        console.error("Next track error", err);
      }
    }
  };

  const handlePrev = async () => {
    if (player) {
      try {
        await player.previousTrack();
      } catch (err) {
        console.error("Next track error", err);
      }
    }
  };

  return (
    <div
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        // 透過したトラック画像を背景に
        backgroundImage: `url(${track.album.images[0].url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(0px)",
      }}
    >
      {/* オーバーレイで暗く＆透過 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-0" />

      <div className="relative z-10 flex items-center justify-center w-full">
        <div className=" bg-opacity-90 p-4 rounded-md shadow-md text-center w-full max-w-md">
          <Image
            src={track.album.images[0].url}
            alt={track.name}
            width={500}
            height={500}
            className="rounded-md mb-4 shadow-lg mx-auto"
          />
          <h2 className="text-xl font-bold text-white mt-6">{track.name}</h2>
          <p className="text-white text-sm">
            {track.artists.map((a) => a.name).join(", ")} - {track.album.name}
          </p>
          <input
            type="range"
            min={0}
            max={duration}
            value={position}
            onChange={handleSeek}
            className="w-full mt-7"
          />
          <div className="text-white text-sm mt-2">
            {formatTime(position)} / {formatTime(duration)}
          </div>
          <button className="mt-4 text-white" onClick={handlePrev}>
            <SkipBack className="inline w-5 h-5 mr-2" />
          </button>
          <button
            onClick={handlePlayPause}
            className="mt-4 bg-black text-white py-2 px-4 rounded-full mr-8 ml-8"
          >
            {isPlaying ? (
              <Pause className="inline w-5 h-5" />
            ) : (
              <Play className="inline w-5 h-5" />
            )}
          </button>
          <button className="mt-4 text-white" onClick={handleNext}>
            <SkipForward className="inline w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
