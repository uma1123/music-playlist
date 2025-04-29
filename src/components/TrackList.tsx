import { Track } from "../types/spotify";
import Image from "next/image";

interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect }) => {
  return (
    <ul className="divide-y divide-gray-200 bg-white rounded-md shadow-md">
      {tracks.map((track) => (
        <li
          key={track.id}
          className="p-4 hover:bg-gray-50 cursor-pointer flex items-center"
          onClick={() => onTrackSelect(track)}
        >
          <Image
            src={track.album.images[0].url}
            alt={`${track.album.name} cover`}
            width={48}
            height={48}
            className="object-cover mr-4 rounded"
          />
          <div>
            <div className="font-semibold">{track.name}</div>
            <div className="text-sm text-gray-600">
              {track.artists.map((artist) => artist.name).join(", ")}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TrackList;
