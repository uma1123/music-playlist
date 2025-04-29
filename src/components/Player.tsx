import { Track } from "../types/spotify";
import { useState } from "react";
import Image from "next/image";

interface PlayerProps {
  track: Track;
}

const Player: React.FC<PlayerProps> = ({ track }) => {
  const [isPlaying, setIsPlaying] = useState(false); // 再生状態の管理 (ダミー)

  const handlePlayPause = async () => {
    try {
      const endpoint = isPlaying ? "/api/player/pause" : "/api/player/play";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackUri: track.uri }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error toggling playback:", errorData);
        return;
      }

      setIsPlaying(!isPlaying);
      console.log(isPlaying ? "Paused" : "Playing");
    } catch (err) {
      console.error("Error toggling playback:", err);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-md p-4 flex flex-col items-center w-full max-w-md">
      <Image
        src={track.album.images[0].url}
        alt={`${track.album.name} cover`}
        width={192} // Adjust width as needed
        height={192} // Adjust height as needed
        className="object-cover rounded-md mb-4"
      />

      <div className="text-center mb-4">
        <div className="font-bold text-lg">{track.name}</div>
        <div className="text-sm text-gray-600">
          {track.artists.map((artist) => artist.name).join(", ")} -{" "}
          {track.album.name}
        </div>
      </div>

      {/* 簡単な再生/一時停止ボタン (機能は未実装) */}
      <button
        onClick={handlePlayPause}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
      >
        {isPlaying ? "一時停止 " : "再生"}
      </button>

      {/* 再生バーなどの要素もここに追加できます (機能は未実装) */}
      {/* <div className="w-full h-2 bg-gray-300 rounded-full mt-4">
          <div className="w-1/3 h-2 bg-green-500 rounded-full"></div>
      </div> */}
    </div>
  );
};

export default Player;
