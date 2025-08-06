export interface Artist {
  id: string;
  name: string;
  uri: string;
}

export interface Album {
  id: string;
  name: string;
  uri: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  uri: string;
}

export interface SearchResult {
  tracks: {
    items: Track[];
    total: number;
  };
  error?: string;
}

export interface PlayHistory {
  id: string;
  userId: string;
  songId: string;
  playedAt: Date;
  song: {
    id: string;
    spotifyId: string;
    title: string;
    artist: string;
    album: string | null;
    duration: number | null;
    previewUrl: string | null;
    imageUrl: string | null;
    createdAt: Date;
  };
}
