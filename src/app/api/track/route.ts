import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Track } from "../../../types/spotify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Track ID is required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  let access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;

  if (!access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const fetchTrack = async (token: string) => {
    const fetch = (await import("node-fetch")).default;
    return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  let spotifyRes = await fetchTrack(access_token);

  // トークンの期限切れならリフレッシュ
  if (spotifyRes.status === 401 && refresh_token) {
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

    const response = NextResponse.next();
    response.cookies.set("access_token", access_token ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    spotifyRes = await fetchTrack(access_token!);
  }

  if (!spotifyRes.ok) {
    const errorBody = await spotifyRes.json();
    return NextResponse.json(
      { error: "Spotify API error", detail: errorBody },
      { status: spotifyRes.status }
    );
  }

  const data = (await spotifyRes.json()) as Track;
  return NextResponse.json(data);
}
