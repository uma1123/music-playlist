import { useEffect, useState } from "react";
import Image from "next/image";
import { Track } from "../types/spotify";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";

interface PlayerProps {
  track: Track;
  accessToken: string;
}

const Player: React.FC<PlayerProps> = ({ track, accessToken }) => {
  const { player, isReady, deviceId } = useSpotifyPlayer(accessToken);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = async () => {
    if (!player || !isReady) return;

    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error("Error toggling playback", err);
    }
  };

  useEffect(() => {
    if (player && isReady && track) {
      (async () => {
        try {
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              device_ids: [deviceId],
              play: false,
            }),
          });

          await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [track.uri],
              device_id: deviceId,
            }),
          });
          setIsPlaying(true);
        } catch (err) {
          console.error("Error playing track", err);
        }
      })();
    }
  }, [player, isReady, track, accessToken, deviceId]);

  return (
    <div className="bg-white rounded-md shadow-md p-4 flex flex-col items-center w-full max-w-md">
      <Image
        src={track.album.images[0].url}
        alt={`${track.album.name} cover`}
        width={192}
        height={192}
        className="object-cover rounded-md mb-4"
      />
      <div className="text-center mb-4">
        <div className="font-bold text-lg">{track.name}</div>
        <div className="text-sm text-gray-600">
          {track.artists.map((artist) => artist.name).join(", ")} -{" "}
          {track.album.name}
        </div>
      </div>

      <button
        onClick={handlePlayPause}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
      >
        {isPlaying ? "一時停止" : "再生"}
      </button>
    </div>
  );
};

export default Player;
