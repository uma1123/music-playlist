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
  uri: string; // 再生に必要なURI
  // Additional properties: duration_ms, explicit, etc.
}

export interface SearchResult {
  tracks: {
    items: Track[];
    // 他のページング情報など
  };
  // 他のタイプ (artists, albumsなど)
}
