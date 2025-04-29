//music-playlist/src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import querystring from "querystring";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const scope =
  "streaming user-read-playback-state user-modify-playback-state user-read-email user-read-private";

export async function GET() {
  if (!client_id || !redirect_uri) {
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

  return NextResponse.redirect(authUrl);
}
