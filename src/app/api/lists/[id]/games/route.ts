import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists, listGames, games } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTimeToBeatById } from "@/lib/igdb";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // confirm this list exists and belongs to this user before adding anything
  const listRows = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (listRows.length === 0) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    igdbId,
    name,
    coverUrl,
    artworkUrl,
    description,
    releaseDate,
    criticScore,
    genres,
  } = body;

  if (!igdbId || !name) {
    return NextResponse.json(
      { error: "Missing required game data" },
      { status: 400 },
    );
  }

  try {
    // re-use cache if the game alr exists in db, otherwise create it
    const existing = await db
      .select()
      .from(games)
      .where(eq(games.igdbId, igdbId.toString()));
    let gameRecord = existing[0];

    if (!gameRecord) {
      let hltbData: {
        hltbMain: number | null;
        hltbMainExtra: number | null;
        hltbCompletionist: number | null;
      } = { hltbMain: null, hltbMainExtra: null, hltbCompletionist: null };
      try {
        const result = await getTimeToBeatById(igdbId);
        if (result) hltbData = result;
      } catch {}

      const inserted = await db
        .insert(games)
        .values({
          igdbId: igdbId.toString(),
          name,
          coverUrl,
          artworkUrl,
          description,
          releaseDate,
          criticScore: criticScore?.toString() ?? null,
          genres: genres ?? [],
          hltbMain: hltbData.hltbMain?.toString() ?? null,
          hltbMainExtra: hltbData.hltbMainExtra?.toString() ?? null,
          hltbCompletionist: hltbData.hltbCompletionist?.toString() ?? null,
        })
        .returning();
      gameRecord = inserted[0];
    }

    // check for dupes within the list
    const alreadyInList = await db
      .select()
      .from(listGames)
      .where(
        and(eq(listGames.listId, listId), eq(listGames.gameId, gameRecord.id)),
      );

    if (alreadyInList.length > 0) {
      return NextResponse.json(
        { error: "This game is already in the list" },
        { status: 409 },
      );
    }

    // new entires go at the end
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(listGames)
      .where(eq(listGames.listId, listId));

    const nextPosition = Number(existingCount[0]?.count ?? 0);

    const insertedListGame = await db
      .insert(listGames)
      .values({ listId, gameId: gameRecord.id, position: nextPosition })
      .returning();

    return NextResponse.json({ listGame: insertedListGame[0] });
  } catch (err) {
    console.error("Failed to add game to list:", err);
    return NextResponse.json(
      { error: "Something went wrong adding this game" },
      { status: 500 },
    );
  }
}
