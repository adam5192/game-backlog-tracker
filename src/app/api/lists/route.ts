import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists, listGames, games } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userLists = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, user.id));

    // one query with all lists games, joined with games for cover art so we can preview a few
    const listIds = userLists.map((l) => l.id);
    const allListGames = await db
      .select()
      .from(listGames)
      .innerJoin(games, eq(listGames.gameId, games.id))
      .where(inArray(listGames.listId, listIds))
      .orderBy(asc(listGames.position));

    // group the result set by listId, keeping the first 4 for preview
    const coversByList: Record<string, string[]> = {};
    for (const row of allListGames) {
      const listId = row.list_games.listId;
      if (!coversByList[listId]) coversByList[listId] = [];
      if (coversByList[listId].length < 4 && row.games.coverUrl) {
        coversByList[listId].push(row.games.coverUrl);
      }
    }

    const listWithPreviews = userLists.map((list) => ({
      ...list,
      previewCovers: coversByList[list.id] ?? [],
      gameCount: allListGames.filter((row) => row.list_games.listId === list.id)
        .length,
    }));

    return NextResponse.json({ lists: listWithPreviews });
  } catch (err) {
    console.error("Failed to fetch lists:", err);
    return NextResponse.json(
      { error: "Something went wrong loading your list" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, isPublic } = body;

  // validation: name required, non-empty, reasonable length
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "List name is required" },
      { status: 400 },
    );
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: "List name is too long (max 100 characters)" },
      { status: 400 },
    );
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
    const inserted = await db
      .insert(lists)
      .values({
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic === true,
      })
      .returning();

    return NextResponse.json({ list: inserted[0] });
  } catch (err) {
    console.error("Failed to create list:", err);
    return NextResponse.json(
      { error: "Something went wrong creating your list" },
      { status: 500 },
    );
  }
}
