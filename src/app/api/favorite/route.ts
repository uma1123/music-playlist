import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: spotifyId, track, action } = await req.json();
    if (!spotifyId || !track || !action) {
      return new Response(
        JSON.stringify({
          error: "User ID, track data, and action are required",
        }),
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { spotifyId },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { spotifyId },
      });
    }

    const song = await prisma.song.upsert({
      where: { spotifyId: track.id },
      update: {},
      create: {
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map((a: { name: string }) => a.name).join(", "),
        album: track.album?.name || "",
        duration: Math.floor(track.duration_ms / 1000),
        imageUrl: track.album?.images?.[0]?.url || "",
      },
    });

    if (action === "add") {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_songId: {
            userId: user.id,
            songId: song.id,
          },
        },
      });

      //重複チェック
      if (existing) {
        return new Response(
          JSON.stringify({ error: "This song is already in favorites" }),
          { status: 400 }
        );
      }

      //お気に入りを追加
      const favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          songId: song.id,
        },
      });

      return NextResponse.json({ success: true, favorite }, { status: 200 });
    } else if (action === "remove") {
      await prisma.favorite.deleteMany({
        where: {
          userId: user.id,
          songId: song.id,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
    });
  } catch (error) {
    console.error("Error in favorite route:", error);
    return NextResponse.json(
      { error: "Failed to manage favorite" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { spotifyId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        song: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(favorites, { status: 200 });
  } catch (error) {
    console.error("Error in favorite GET route:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
