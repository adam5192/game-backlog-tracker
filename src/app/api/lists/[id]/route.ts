import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists, userGames } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { listGames, games } from "@/db/schema";
import { asc } from "drizzle-orm";
import { blockIfDemoUser } from "@/lib/demo";
import { listVotes } from "@/db/schema";
import { sql } from "drizzle-orm";

// Next.js app router passes the route segments (id foleder name) via a params object
type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const listRows = await db.select().from(lists).where(eq(lists.id, id));

    if (listRows.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const list = listRows[0];
    const isOwner = user != null && list.userId === user.id;

    if (!list.isPublic && !isOwner) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // vote count
    const voteCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(listVotes)
      .where(eq(listVotes.listId, id));
    const voteCount = Number(voteCountResult[0]?.count ?? 0);

    // hasVoted only makes sense for a logged-in viewer
    let hasVoted = false;
    if (user) {
      const myVote = await db
        .select()
        .from(listVotes)
        .where(and(eq(listVotes.listId, id), eq(listVotes.userId, user.id)));
      hasVoted = myVote.length > 0;
    }

    const gameRows = await db
      .select()
      .from(listGames)
      .innerJoin(games, eq(listGames.gameId, games.id))
      .where(eq(listGames.listId, id))
      .orderBy(asc(listGames.position));

    const gameIds = gameRows.map((row) => row.games.id);

    const userGameRows =
      user && gameIds.length
        ? await db
            .select()
            .from(userGames)
            .where(
              and(
                eq(userGames.userId, user.id),
                inArray(userGames.gameId, gameIds),
              ),
            )
        : [];

    const userGameByGameId = new Map(userGameRows.map((ug) => [ug.gameId, ug]));

    const listGamesData = gameRows.map((row) => {
      const ownedEntry = userGameByGameId.get(row.games.id);
      return {
        listGameId: row.list_games.id,
        gameId: row.games.id,
        igdbId: Number(row.games.igdbId),
        name: row.games.name,
        coverUrl: row.games.coverUrl,
        artworkUrl: row.games.artworkUrl,
        description: row.games.description,
        criticScore: row.games.criticScore
          ? Number(row.games.criticScore)
          : null,
        hltbMain: row.games.hltbMain ? Number(row.games.hltbMain) : null,
        hltbMainExtra: row.games.hltbMainExtra
          ? Number(row.games.hltbMainExtra)
          : null,
        hltbCompletionist: row.games.hltbCompletionist
          ? Number(row.games.hltbCompletionist)
          : null,
        position: row.list_games.position,
        userGameId: ownedEntry?.id ?? null,
        status: ownedEntry?.status ?? null,
        rating: ownedEntry?.rating ? Number(ownedEntry.rating) : null,
        notes: ownedEntry?.notes ?? null,
      };
    });

    return NextResponse.json({
      list,
      games: listGamesData,
      isOwner,
      voteCount,
      hasVoted,
    });
  } catch (err) {
    console.error("Failed to fetch list:", err);
    return NextResponse.json(
      { error: "Something went wrong loading this list" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, isPublic } = body;

  if (name != null) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "List name cannot be empty" },
        { status: 400 },
      );
    }
    if (name.length > 100) {
      return NextResponse.json(
        { error: "List name is too long (max 100 characters)" },
        { status: 400 },
      );
    }
  }
  if (
    description != null &&
    (typeof description !== "string" || description.length > 500)
  ) {
    return NextResponse.json(
      { error: "Description is too long (max 500 characters)" },
      { status: 400 },
    );
  }

  try {
    const updated = await db
      .update(lists)
      .set({
        ...(name != null && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(isPublic !== undefined && { isPublic: isPublic === true }),
        updatedAt: new Date(),
      })
      .where(and(eq(lists.id, id), eq(lists.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ list: updated[0] });
  } catch (err) {
    console.error("Failed to update list:", err);
    return NextResponse.json(
      { error: "Something went wrong updating your list" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const demoBlock = blockIfDemoUser(user.id);
  if (demoBlock) return demoBlock;

  try {
    const deleted = await db
      .delete(lists)
      .where(and(eq(lists.id, id), eq(lists.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete list:", err);
    return NextResponse.json(
      { error: "Something went wrong deleting your list" },
      { status: 500 },
    );
  }
}
