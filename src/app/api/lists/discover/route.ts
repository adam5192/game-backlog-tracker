import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, profiles, listGames, games } from "@/db/schema";
import { eq, desc, ilike, and, inArray, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q");

  try {
    const results = await db
      .select()
      .from(lists)
      .innerJoin(profiles, eq(lists.userId, profiles.userId))
      .where(
        search
          ? and(eq(lists.isPublic, true), ilike(lists.name, `%${search}%`))
          : eq(lists.isPublic, true),
      )
      .orderBy(desc(lists.createdAt))
      .limit(20);

    // pull every game for every returned list in 1 query, rather than looping and querying per-list.
    const listIds = results.map((row) => row.lists.id);
    const allListGames = listIds.length
      ? await db
          .select()
          .from(listGames)
          .innerJoin(games, eq(listGames.gameId, games.id))
          .where(inArray(listGames.listId, listIds))
          .orderBy(asc(listGames.position))
      : [];

    const coversByList: Record<string, string[]> = {};
    for (const row of allListGames) {
      const listId = row.list_games.listId;
      if (!coversByList[listId]) coversByList[listId] = [];
      if (coversByList[listId].length < 4 && row.games.coverUrl) {
        coversByList[listId].push(row.games.coverUrl);
      }
    }

    const shaped = results.map((row) => ({
      id: row.lists.id,
      name: row.lists.name,
      description: row.lists.description,
      creatorId: row.lists.userId,
      creatorName: row.profiles?.displayName ?? "Anonymous",
      creatorAvatar: row.profiles?.avatarUrl ?? null,
      previewCovers: coversByList[row.lists.id] ?? [], // added
    }));

    return NextResponse.json({ lists: shaped });
  } catch (err) {
    console.error("Failed to fetch public lists:", err);
    return NextResponse.json(
      { error: "Something went wrong loading public lists" },
      { status: 500 },
    );
  }
}
