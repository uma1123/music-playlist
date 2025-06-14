import { useRouter } from "next/navigation";
import { Track } from "../types/spotify";
import Image from "next/image";
import { Card, CardContent } from "./ui/card";

interface TrackListProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect }) => {
  const router = useRouter();

  const handleClick = (track: Track) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    } else {
      router.push(`/track/${track.id}`);
    }
  };

  return (
    <Card className="bg-[#1e1e2f] text-white p-4 rounded-md shadow-lg">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <CardContent
            key={track.id}
            className="relative group hover:bg-gray-100 transition rounded-lg cursor-pointer p-3"
            onClick={() => handleClick(track)}
          >
            <Image
              src={track.album.images[0].url}
              alt={`${track.album.name} cover`}
              width={120}
              height={120}
              className="rounded-lg shadow-sm object-cover"
            />
            <div className="mt-3">
              <div className="font-medium text-base truncate">{track.name}</div>
              <div className="text-sm text-gray-500 truncate">
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
