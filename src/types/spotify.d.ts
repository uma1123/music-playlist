export interface Artist {
  id: string;
  name: string;
  uri: string;
}

export interface Album {
  id: string;
  name: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  uri: string;
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
