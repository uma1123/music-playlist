import { useRouter } from "next/navigation";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Play } from "lucide-react";

interface TrackListProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect }) => {
  const router = useRouter();

  //曲をクリックしたときの処理
  const handleClick = (track: Track) => {
    // 曲リストとインデックスを保存
    sessionStorage.setItem(
      "lastTrackIds",
      JSON.stringify(tracks.map((t) => t.id))
    );
    sessionStorage.setItem(
      "lastTrackIndex",
      String(tracks.findIndex((t) => t.id === track.id))
    );
    if (onTrackSelect) {
      onTrackSelect(track);
    } else {
      router.push(`/track/${track.id}`);
    }
  };

  return (
    // 親Cardに「max-h-screen overflow-y-auto」を追加
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {" "}
        {/* gapを少し広げる */}
        {tracks.map((track, idx) => (
          <div key={`${track.id}-${idx}`} className="group cursor-pointer">
            <div
              className="relative rounded-xl bg-slate-800 hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => handleClick(track)}
            >
              <Image
                src={track.album.images[0].url}
                alt={`${track.album.name} cover`}
                width={300}
                height={300}
                className="w-full h-full object-cover aspect-square"
              />
              {/* 黒のグラデーションオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

              {/* 再生アイコン */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Play size={20} />
                </div>
              </div>

              {/* 曲名とアーティスト */}
              <div className="absolute bottom-0 w-full p-3 bg-black/40 backdrop-blur-sm">
                <h3 className="text-white font-semibold text-sm truncate">
                  {track.name}
                </h3>
                <p className="text-gray-300 text-xs truncate">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
