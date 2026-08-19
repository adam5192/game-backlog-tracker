import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, profiles, listGames, games } from "@/db/schema";
import { eq, desc, ilike, and, inArray, asc, sql } from "drizzle-orm";
import { listVotes } from "@/db/schema";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q");

  try {
    // count votes per list in the same query
    const results = await db
      .select({
        list: lists,
        profile: profiles,
        voteCount: sql<number>`count(${listVotes.id})`,
      })
      .from(lists)
      .leftJoin(profiles, eq(lists.userId, profiles.userId))
      .leftJoin(listVotes, eq(listVotes.listId, lists.id))
      .where(
        search
          ? and(eq(lists.isPublic, true), ilike(lists.name, `%${search}%`))
          : eq(lists.isPublic, true),
      )
      .groupBy(lists.id, profiles.userId)
      .orderBy(desc(sql`count(${listVotes.id})`)) // sort by vote count, highest first
      .limit(20);

    const listIds = results.map((row) => row.list.id);
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
      id: row.list.id,
      name: row.list.name,
      description: row.list.description,
      creatorId: row.list.userId,
      creatorName: row.profile?.displayName ?? "Anonymous",
      creatorAvatar: row.profile?.avatarUrl ?? null,
      previewCovers: coversByList[row.list.id] ?? [],
      voteCount: Number(row.voteCount),
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
