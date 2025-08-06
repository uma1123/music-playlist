//httpOnly: trueを保ちつつ、クライアントから安全にユーザIDを取得できるようにする

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const spotifyId = cookieStore.get("spotifyId")?.value;

  if (spotifyId) {
    return NextResponse.json({ userId: spotifyId }, { status: 200 });
  }

  return NextResponse.json({ error: "User ID not found" }, { status: 404 });
}
