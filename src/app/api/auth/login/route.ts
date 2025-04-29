import { NextResponse } from "next/server";
import querystring from "querystring";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const scope =
  "streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private"; // 必要なスコープ

// GETメソッドでアクセスされたときのハンドラ
export async function GET() {
  if (!client_id || !redirect_uri) {
    // 環境変数が設定されていない場合のエラー処理
    return NextResponse.json(
      { error: "Spotify API credentials not set" },
      { status: 500 }
    );
  }

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });

  // Spotify認証画面にリダイレクト
  return NextResponse.redirect(authUrl);
}
