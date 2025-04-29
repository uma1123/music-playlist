// src/app/api/search/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers"; // Next.js 13以降でサーバーサイド/APIルートでクッキーを扱う
import { SearchResult } from "../../../types/spotify"; // パスは適宜調整

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // cookies() 関数を使ってリクエストからクッキーを読み取り
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value; // クッキーが存在すればその値、なければ undefined

  if (!access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    const fetch = (await import("node-fetch")).default;

    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=$${encodeURIComponent(
        query
      )}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!spotifyRes.ok) {
      const errorBody = await spotifyRes.json();
      console.error("Spotify API error:", spotifyRes.status, errorBody);
      if (spotifyRes.status === 401) {
        return NextResponse.json(
          { error: "Spotify token expired or invalid" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Error fetching from Spotify API" },
        { status: spotifyRes.status }
      );
    }

    const data = (await spotifyRes.json()) as SearchResult;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Server error during search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
