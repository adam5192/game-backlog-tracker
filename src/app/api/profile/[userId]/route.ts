import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, lists, listGames, games } from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";

type Params = { params: Promise<{ userId: string }> };

// no auth check - visible by anyone
export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = await params;

  try {
    const profileRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (profileRows.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRows[0];

    // only show their public lists
    const userLists = await db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, userId), eq(lists.isPublic, true)));

    // one query for every public list's games at once, then group by list in JS afterward, rather than querying per-list in a loop
    const listIds = userLists.map((l) => l.id);
    const allListGames = listIds.length
      ? await db
          .select()
          .from(listGames)
          .innerJoin(games, eq(listGames.gameId, games.id))
          .where(inArray(listGames.listId, listIds))
          .orderBy(asc(listGames.position))
      : [];

    const coversByList: Record<string, string[]> = {};
    const countByList: Record<string, number> = {};
    for (const row of allListGames) {
      const listId = row.list_games.listId;
      countByList[listId] = (countByList[listId] ?? 0) + 1;
      if (!coversByList[listId]) coversByList[listId] = [];
      if (coversByList[listId].length < 4 && row.games.coverUrl) {
        coversByList[listId].push(row.games.coverUrl);
      }
    }

    const shapedLists = userLists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      previewCovers: coversByList[list.id] ?? [],
      gameCount: countByList[list.id] ?? 0,
    }));

    return NextResponse.json({
      profile: {
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        memberSince: profile.createdAt,
      },
      lists: shapedLists,
    });
  } catch (err) {
    console.error("Failed to fetch public profile:", err);
    return NextResponse.json(
      { error: "Something went wrong loading this profile" },
      { status: 500 },
    );
  }
}
