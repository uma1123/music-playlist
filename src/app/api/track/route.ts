// Spotifyのトラック情報APIをプロキシするAPIエンドポイント
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Track } from "../../../types/spotify";

export async function GET(request: NextRequest) {
  // クエリパラメータからトラックIDを取得
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // IDがなければ400エラー
  if (!id) {
    return NextResponse.json(
      { error: "Track ID is required" },
      { status: 400 }
    );
  }

  // クッキーからアクセストークンとリフレッシュトークンを取得
  const cookieStore = await cookies();
  let access_token = cookieStore.get("access_token")?.value;
  const refresh_token = cookieStore.get("refresh_token")?.value;

  // アクセストークンがなければ401エラー
  if (!access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Spotify APIへトラック情報リクエストを送る関数
  const fetchTrack = async (token: string) => {
    const fetch = (await import("node-fetch")).default;
    return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // 最初のリクエスト
  let spotifyRes = await fetchTrack(access_token);

  // アクセストークンが無効ならリフレッシュ
  if (spotifyRes.status === 401 && refresh_token) {
    // トークンリフレッシュリクエスト
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

    // リフレッシュ失敗時は401エラー
    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Failed to refresh access token" },
        { status: 401 }
      );
    }

    // 新しいアクセストークンを取得しクッキーを更新
    const tokenBody = await tokenRes.json();
    access_token = tokenBody.access_token;

    const response = NextResponse.next();
    response.cookies.set("access_token", access_token ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // 再度Spotify APIへリクエスト
    spotifyRes = await fetchTrack(access_token!);
  }

  // Spotify APIがエラーを返した場合
  if (!spotifyRes.ok) {
    const errorBody = await spotifyRes.json();
    return NextResponse.json(
      { error: "Spotify API error", detail: errorBody },
      { status: spotifyRes.status }
    );
  }

  // 正常時はSpotifyのレスポンスをそのまま返す
  const data = (await spotifyRes.json()) as Track;
  return NextResponse.json(data);
}
