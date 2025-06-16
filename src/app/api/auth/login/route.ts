// Spotify認証ページへのリダイレクトを行うAPIエンドポイント
import { NextResponse } from "next/server";
import querystring from "querystring";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

// Spotify認証時に要求するスコープ
const scope =
  "streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private";

export async function GET() {
  // 必要な環境変数がなければエラー
  if (!client_id || !redirect_uri) {
    return NextResponse.json(
      { error: "Spotify API credentials not set" },
      { status: 500 }
    );
  }

  // Spotify認証ページのURLを生成
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });

  // 認証ページへリダイレクト
  return NextResponse.redirect(authUrl);
}
