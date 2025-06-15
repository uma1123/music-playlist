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
