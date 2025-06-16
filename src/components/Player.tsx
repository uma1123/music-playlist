import { useEffect, useState } from "react";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface PlayerProps {
  track: Track;
  accessToken: string;
}

const Player: React.FC<PlayerProps> = ({
  track: initialTrack,
  accessToken,
}) => {
  //Web Playback SDKの状態や曲情報を管理
  const { player, deviceId, isReady } = useSpotifyPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track>(initialTrack);

  // 曲情報が変わったらcurrentTrackを更新
  useEffect(() => {
    setCurrentTrack(initialTrack);
  }, [initialTrack]);

  // 定期的に状態を更新する処理
  useEffect(() => {
    if (!player) return;

    const updateState = async () => {
      const state = await player.getCurrentState();
      if (state) {
        setPosition(state.position); //再生位置
        setDuration(state.duration); //曲の長さ
        setIsPlaying(!state.paused); //再生中かどうか

        // 曲が変わったらcurrentTrackを更新
        if (state.track_window?.current_track?.uri !== currentTrack.uri) {
          setCurrentTrack({
            id: state.track_window.current_track.id ?? "",
            name: state.track_window.current_track.name,
            artists: state.track_window.current_track.artists.map((a) => ({
              id: "",
              name: a.name,
              uri: "",
            })),
            album: {
              id: "",
              name: state.track_window.current_track.album.name,
              uri: "",
              images: (state.track_window.current_track.album.images ?? []).map(
                (img) => ({
                  url: img.url,
                  height: typeof img.height === "number" ? img.height : 0,
                  width: typeof img.width === "number" ? img.width : 0,
                })
              ),
            },
            uri: state.track_window.current_track.uri ?? "",
          });
        }
      }
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [player, currentTrack]);

  // deviceId・isReady・accessToken変化時に初期再生セットアップ
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
              uris: [initialTrack.uri],
            }),
          }
        );
        setIsPlaying(true);
      } catch (err) {
        console.error("playback error", err);
      }
    };

    play();
  }, [deviceId, isReady, accessToken, initialTrack.uri]);

  return (
    <div
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${currentTrack.album.images[0].url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(0px)",
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-0" />

      <div className="relative z-10 flex items-center justify-center w-full">
        <div className=" bg-opacity-90 p-4 rounded-md shadow-md text-center w-full max-w-md">
          <Image
            src={currentTrack.album.images[0].url}
            alt={currentTrack.name}
            width={500}
            height={500}
            className="rounded-md mb-4 shadow-lg mx-auto"
          />
          <h2 className="text-xl font-bold text-white mt-6">
            {currentTrack.name}
          </h2>
          <p className="text-white text-sm">
            {currentTrack.artists.map((a) => a.name).join(", ")} -{" "}
            {currentTrack.album.name}
          </p>
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
            className="w-full mt-7"
          />
          <div className="text-white text-sm mt-2">
            {formatTime(position)} / {formatTime(duration)}
          </div>
          <button
            className="mt-4 text-white"
            onClick={async () => player?.previousTrack()}
          >
            <SkipBack className="inline w-5 h-5 mr-2" />
          </button>
          <button
            onClick={async () => {
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
            }}
            className="mt-4 bg-black text-white py-2 px-4 rounded-full mr-8 ml-8"
          >
            {isPlaying ? (
              <Pause className="inline w-5 h-5" />
            ) : (
              <Play className="inline w-5 h-5" />
            )}
          </button>
          <button
            className="mt-4 text-white"
            onClick={async () => player?.nextTrack()}
          >
            <SkipForward className="inline w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 時間表示用
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default Player;
