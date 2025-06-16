import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Spotifyの再生キューに曲を追加するAPIエンドポイント
export async function POST(req: NextRequest) {
  // リクエストボディから曲のURIを取得
  const { uri } = await req.json();

  // クッキーからアクセストークンを取得
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;

  // アクセストークンがなければ401エラー
  if (!access_token) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  // Spotify APIのキュー追加エンドポイントにリクエスト
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  // 失敗時はエラーレスポンスを返す
  if (!res.ok) {
    const err = await res.json();
    console.error("Spotify Queue Error:", err);
    return NextResponse.json(
      { error: "Failed to add to queue" },
      { status: 500 }
    );
  }

  // 成功時はsuccess: trueを返す
  return NextResponse.json({ success: true });
}
