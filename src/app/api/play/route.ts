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

    if (!uris || !Array.isArray(uris) || uris.length === 0) {
      return NextResponse.json(
        { error: "Valid uris array is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    let access_token = cookieStore.get("access_token")?.value;
    const refresh_token = cookieStore.get("refresh_token")?.value;

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

    let res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // アクセストークンが無効な場合はリフレッシュを試行
    if (res.status === 401 && refresh_token) {
      console.log("Access token expired, refreshing...");

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

      if (tokenRes.ok) {
        const tokenBody = await tokenRes.json();
        access_token = tokenBody.access_token;

        // 新しいトークンでクッキーを更新
        const response = NextResponse.next();
        response.cookies.set("access_token", access_token ?? "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        // 再度リクエストを試行
        res = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      }
    }

    if (!res.ok) {
      let errorDetail = {};
      try {
        errorDetail = await res.json();
      } catch {
        console.error("Failed to parse error response from Spotify");
      }
      console.error("Spotify Play Error:", res.status, errorDetail);
      return NextResponse.json(
        {
          error: "Failed to start playback",
          detail: errorDetail,
          status: res.status,
        },
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
