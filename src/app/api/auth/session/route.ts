// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const accessToken = req.cookies.get("access_token");

  if (accessToken) {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
