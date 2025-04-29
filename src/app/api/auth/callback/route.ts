import { NextResponse, NextRequest } from "next/server";
import querystring from "querystring";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

// GETメソッドでアクセスされたときのハンドラ
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || null; // Authorization Code

  if (!client_id || !client_secret || !redirect_uri) {
    // 環境変数が設定されていない場合のエラー処理
    return NextResponse.json(
      { error: "Spotify API credentials not set" },
      { status: 500 }
    );
  }

  if (code === null) {
    // エラーハンドリング (承認されなかった場合など)
    // NextResponse.redirectを使う場合は、完全なURLを指定する必要があります
    const errorRedirectUrl = new URL("/", request.url); // リダイレクト先のURL
    errorRedirectUrl.search = querystring.stringify({ error: "access_denied" });
    return NextResponse.redirect(errorRedirectUrl);
  }

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  };

  try {
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(authOptions.url, {
      method: "POST",
      headers: authOptions.headers,
      body: querystring.stringify(authOptions.form),
    });
    // Define the expected response type
    interface SpotifyTokenResponse {
      access_token: string;
      refresh_token: string;
    }

    const body = (await response.json()) as SpotifyTokenResponse;

    const access_token = body.access_token;
    const refresh_token = body.refresh_token;

    // Cookies インスタンスは req と res に依存しますが、App Router では異なります。
    // NextResponse の headers を使って Set-Cookie を設定するのが新しい方法です。
    // または、'cookies-next' のようなライブラリを使う方法もあります。
    // ここでは NextResponse の headers を使う例を示します。

    const responseHeaders = new Headers();
    // productionではSecure属性やHttpOnly属性を適切に設定してください
    responseHeaders.append(
      "Set-Cookie",
      `access_token=${access_token}; Path=/; HttpOnly; SameSite=Strict`
    );
    responseHeaders.append(
      "Set-Cookie",
      `refresh_token=${refresh_token}; Path=/; HttpOnly; SameSite=Strict`
    );

    // 認証成功後、メインページなどにリダイレクト
    const successRedirectUrl = new URL("/", request.url); // リダイレクト先のURL
    return NextResponse.redirect(successRedirectUrl, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    const errorRedirectUrl = new URL("/", request.url);
    errorRedirectUrl.search = querystring.stringify({ error: "invalid_token" });
    return NextResponse.redirect(errorRedirectUrl);
  }
}
