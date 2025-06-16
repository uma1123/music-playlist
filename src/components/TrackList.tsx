import { useRouter } from "next/navigation";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { Play } from "lucide-react"; // アイコンをインポート

interface TrackListProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect }) => {
  const router = useRouter();

  //曲をクリックしたときの処理
  const handleClick = (track: Track) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    } else {
      router.push(`/track/${track.id}`);
    }
  };

  return (
    // 親Cardに「max-h-screen overflow-y-auto」を追加
    <Card className="bg-gradient-to-b from-[#1e1e2f] to-[#121220] text-white p-4 rounded-md shadow-lg border-none max-h-screen overflow-y-auto">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {" "}
        {/* gapを少し広げる */}
        {tracks.map((track, idx) => (
          <CardContent
            key={`${track.id}-${idx}`}
            className="relative group bg-[#282840] hover:bg-[#3a3a5a] transition duration-300 ease-in-out transform hover:-translate-y-2 rounded-lg cursor-pointer p-4 shadow-md"
            onClick={() => handleClick(track)}
          >
            <div className="relative">
              <Image
                src={track.album.images[0].url}
                alt={`${track.album.name} cover`}
                width={150} // 画像サイズを少し大きく
                height={150}
                className="rounded-md shadow-lg object-cover w-[50%] aspect-square"
              />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  aria-label={`Play ${track.name}`}
                  className="bg-green-500 text-black p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              {" "}
              {/* mtを少し広げる */}
              <div className="font-bold text-base truncate">
                {track.name}
              </div>{" "}
              {/* font-boldで強調 */}
              <div className="text-sm text-gray-400 truncate">
                {track.artists.map((artist) => artist.name).join(", ")}
              </div>
            </div>
          </CardContent>
        ))}
      </div>
    </Card>
  );
};

export default TrackList;
