export interface Artist {
  id?: string;
  name: string;
  uri?: string;
}

export interface Album {
  id?: string;
  name: string;
  uri?: string;
  images: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  uri: string;
}

export interface SearchResult {
  tracks: {
    items: Track[];
    total: number;
  };
  error?: string;
}

// SpotifyPlayerProvider用の型定義を追加
export interface SpotifyPlayerContextProps {
  player: Spotify.Player | null;
  deviceId: string | null;
  isReady: boolean;
  currentTrackList: Track[];
  currentTrackIndex: number;
  setCurrentTrackList: (tracks: Track[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
  lastSearchQuery: string | null;
  setLastSearchQuery: (query: string | null) => void;
}

export interface SpotifyPlayerProviderProps {
  accessToken: string;
  children: React.ReactNode;
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

export interface Favorite {
  id: string;
  userId: string;
  songId: string;
  createdAt: string;
  song: {
    id: string;
    spotifyId: string;
    title: string;
    artist: string;
    album: string | null;
    duration: number | null;
    imageUrl: string | null;
  };
}
