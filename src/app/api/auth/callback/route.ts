// Spotify認証後のコールバックを処理するAPIエンドポイント
import { NextRequest, NextResponse } from "next/server";
import querystring from "querystring";

export async function GET(req: NextRequest) {
  // 認可コードをクエリから取得
  const code = req.nextUrl.searchParams.get("code");

  // Spotifyのトークンエンドポイントにアクセストークン・リフレッシュトークンをリクエスト
  const response = await fetch("https://accounts.spotify.com/api/token", {
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
    body: querystring.stringify({
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  // 認証失敗時はエラーを返す
  if (!response.ok) {
    return new NextResponse("Spotify認証に失敗しました", { status: 400 });
  }

  // アクセストークン・リフレッシュトークンを取得
  const body = await response.json();
  const access_token = body.access_token;
  const refresh_token = body.refresh_token;

  // 認証後のリダイレクト先
  const redirectBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

  // トークンをクッキーにセットしてリダイレクト
  const res = NextResponse.redirect(redirectBaseUrl);

  res.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
