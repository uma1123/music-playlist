import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 再生履歴を保存
export async function POST(req: NextRequest) {
  try {
    const { userId: spotifyId, track } = await req.json();

    if (!spotifyId || !track) {
      return NextResponse.json(
        { error: "User ID and track data are required" },
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

    // 楽曲をSongテーブルに保存
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

    // 再生履歴に追加（同じ曲を5分以内に再生していたらスキップ）
    const recent = await prisma.playHistory.findFirst({
      where: {
        userId: user.id,
        songId: song.id,
        playedAt: {
          gte: new Date(Date.now() - 1000 * 60 * 5), //5分以内
        },
      },
    });

    if (!recent) {
      const playHistory = await prisma.playHistory.create({
        data: {
          userId: user.id,
          songId: song.id,
        },
      });

      return NextResponse.json({ success: true, playHistory }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, message: "Already played recently" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving play history:", error);
    return NextResponse.json(
      { error: "Failed to save play history" },
      { status: 500 }
    );
  }
}

// 再生履歴を取得
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

    const playHistory = await prisma.playHistory.findMany({
      where: { userId: user.id },
      include: {
        song: true,
      },
      orderBy: {
        playedAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({ playHistory }, { status: 200 });
  } catch (error) {
    console.error("Error fetching play history:", error);
    return NextResponse.json(
      { error: "Failed to fetch play history" },
      { status: 500 }
    );
  }
}
