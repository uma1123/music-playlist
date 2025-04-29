// app/api/player/play/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

console.log("Player API route file reached!");

export async function POST(req: NextRequest) {
  const { trackUri } = await req.json();

  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT", // PUTリクエスト
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: [trackUri],
    }),
  });

  console.log("Spotify Player API response status:", response.status); // ★ このログを追加 ★

  if (!response.ok) {
    // Spotify API からのエラーレスポンスボディを確認するために、エラーの場合のみパース
    try {
      const errorBody = await response.json();
      console.error("Spotify Player API error response body:", errorBody); // ★ このログを追加 ★
      return NextResponse.json(
        { error: errorBody },
        { status: response.status }
      );
    } catch {
      // JSON パースに失敗した場合（例: 404 の応答が HTML など）
      const errorText = await response.text();
      console.error("Spotify Player API error response text:", errorText); // ★ このログを追加 ★
      return NextResponse.json(
        { error: "Failed to parse error response", details: errorText },
        { status: response.status }
      );
    }
  }

  return NextResponse.json({ message: "Playing track" });
}
///home/uma11/projects/music-playlist/src/app/api/player/play/route.ts
