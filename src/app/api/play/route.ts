import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの存在チェック
    const contentLength = req.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    const { uris, offset, deviceId } = await req.json();

    const cookieStore = await cookies();
    const access_token = cookieStore.get("access_token")?.value;

    if (!access_token) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // deviceIdがあればクエリパラメータで指定
    const url = deviceId
      ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
      : `https://api.spotify.com/v1/me/player/play`;

    const body: { uris: string[]; offset?: { position: number } } = { uris };
    if (typeof offset === "object" && offset.position !== undefined) {
      body.offset = offset;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorDetail = {};
      try {
        errorDetail = await res.json();
      } catch {
        console.error("Failed to parse error response from Spotify");
      }
      console.error("Spotify Play Error:", errorDetail);
      return NextResponse.json(
        { error: "Failed to start playback", detail: errorDetail },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/play:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}
