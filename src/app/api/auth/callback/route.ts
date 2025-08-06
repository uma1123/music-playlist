// Spotify認証後のコールバックを処理するAPIエンドポイント
import { NextRequest, NextResponse } from "next/server";
import querystring from "querystring";

export async function GET(req: NextRequest) {
  // 認可コードをクエリから取得
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  // デバッグ情報をログ出力
  console.log("=== Spotify Callback Debug ===");
  console.log("Code:", code);
  console.log("Error from Spotify:", error);
  console.log("SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID);
  console.log("SPOTIFY_REDIRECT_URI:", process.env.SPOTIFY_REDIRECT_URI);

  // エラーがある場合は早期リターン
  if (error) {
    console.error("Spotify authorization error:", error);
    return new NextResponse(`認証エラー: ${error}`, { status: 400 });
  }

  // コードがない場合もエラー
  if (!code) {
    console.error("No authorization code received");
    return new NextResponse("認証コードが取得できませんでした", {
      status: 400,
    });
  }

  // 環境変数チェック
  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    !process.env.SPOTIFY_REDIRECT_URI
  ) {
    console.error("Missing Spotify environment variables");
    return new NextResponse("Spotify環境変数が設定されていません", {
      status: 500,
    });
  }

  // Spotifyのトークンエンドポイントにアクセストークン・リフレッシュトークンをリクエスト
  const tokenRequestBody = querystring.stringify({
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  console.log("Token request body:", tokenRequestBody);

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
    body: tokenRequestBody,
  });

  console.log("Spotify token response status:", response.status);

  // 認証失敗時はエラーを返す
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Spotify token request failed:", errorText);
    try {
      const errorJson = JSON.parse(errorText);
      console.error("Error details:", errorJson);
      return new NextResponse(
        `Spotify認証に失敗しました: ${
          errorJson.error_description || errorJson.error
        }`,
        { status: 400 }
      );
    } catch {
      return new NextResponse(`Spotify認証に失敗しました: ${errorText}`, {
        status: 400,
      });
    }
  }

  // アクセストークン・リフレッシュトークンを取得
  const body = await response.json();
  console.log("Token response received successfully");

  const access_token = body.access_token;
  const refresh_token = body.refresh_token;

  if (!access_token) {
    console.error("No access token in response:", body);
    return new NextResponse("アクセストークンが取得できませんでした", {
      status: 400,
    });
  }

  // アクセストークン取得後
  const userRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    console.error("Failed to fetch user info:", await userRes.text());
    return new NextResponse("ユーザー情報の取得に失敗しました", {
      status: 400,
    });
  }

  const user = await userRes.json();
  const spotifyId = user.id;

  console.log("User info retrieved successfully, Spotify ID:", spotifyId);

  // 認証後のリダイレクト先を修正
  const redirectBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://music-playlist-zeta.vercel.app";

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

  // cookieにspotifyIdを保存
  res.cookies.set("spotifyId", spotifyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  console.log("Authentication successful, redirecting to:", redirectBaseUrl);
  return res;
}
