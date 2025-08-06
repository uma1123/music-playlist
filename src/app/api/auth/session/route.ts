import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Next.js 13以降でサーバーサイド/APIルートでクッキーを扱う

// GETメソッドでアクセスされたときのハンドラ
export async function GET() {
  // cookies() 関数を使ってリクエストからクッキーを読み取り
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value; // Access Token クッキーの値を取得
  const spotifyId = cookieStore.get("spotify_id")?.value; // Spotify ID クッキーの値を取得

  if (accessToken) {
    // Access Token が存在する場合、認証済みとしてトークンをクライアントに返す
    return NextResponse.json({
      authenticated: true,
      accessToken: accessToken, // Access Token を含める
      spotifyId: spotifyId, // Spotify
    });
  } else {
    // Access Token が存在しない場合、非認証状態として返す
    return NextResponse.json({
      authenticated: false,
      accessToken: null, // トークンは返さない
      spotifyId: null, // Spotify ID も返さない
    });
  }
}
