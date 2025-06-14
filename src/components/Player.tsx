// components/Player.tsx
import { useEffect, useState } from "react";
import { useSpotifyPlayerContext } from "../context/SpotifyPlayerProvider";
import { Track } from "../types/spotify";
import Image from "next/image";

interface PlayerProps {
  track: Track;
  accessToken: string;
}

const Player: React.FC<PlayerProps> = ({ track, accessToken }) => {
  const { player, deviceId, isReady } = useSpotifyPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);

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

  return (
    <div className="bg-white p-4 rounded-md shadow-md text-center w-full max-w-md">
      <Image
        src={track.album.images[0].url}
        alt={track.name}
        width={192}
        height={192}
        className="rounded-md mb-4"
      />
      <h2 className="text-xl font-bold">{track.name}</h2>
      <p className="text-gray-600 text-sm">
        {track.artists.map((a) => a.name).join(", ")} - {track.album.name}
      </p>
      <button
        onClick={handlePlayPause}
        className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full"
      >
        {isPlaying ? "一時停止" : "再生"}
      </button>
      {/* <div>
        <div>deviceId: {deviceId}</div>
        <div>isReady: {isReady ? "true" : "false"}</div>
        <div>accessToken: {accessToken ? "取得済み" : "未取得"}</div>
      </div> */}
    </div>
  );
};

export default Player;
