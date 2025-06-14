//app/api/search/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SearchResult } from "../../../types/spotify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const cookieStore = await cookies();

  let access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  if (!access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const fetchFromSpotify = async (token: string) => {
    const fetch = (await import("node-fetch")).default;
    return fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=12`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  };

  let spotifyRes = await fetchFromSpotify(access_token);

  // トークンが無効だった場合はリフレッシュ
  if (spotifyRes.status === 401 && refresh_token) {
    // トークンを更新
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Failed to refresh access token" },
        { status: 401 }
      );
    }

    const tokenBody = await tokenRes.json();
    access_token = tokenBody.access_token;

    // クッキーを更新
    const response = NextResponse.next();
    response.cookies.set("access_token", access_token ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    spotifyRes = await fetchFromSpotify(access_token!); // 再リクエスト
  }

  if (!spotifyRes.ok) {
    const errorBody = await spotifyRes.json();
    console.error("Spotify API error:", spotifyRes.status, errorBody);
    return NextResponse.json(
      { error: "Spotify API error", detail: errorBody },
      { status: spotifyRes.status }
    );
  }

  const data = (await spotifyRes.json()) as SearchResult;
  return NextResponse.json(data);
}
