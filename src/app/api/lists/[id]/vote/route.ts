import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { listVotes, lists } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

  try {
    // confirm the list exists and is public
    const listRows = await db.select().from(lists).where(eq(lists.id, listId));
    if (listRows.length === 0 || !listRows[0].isPublic) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // check if this user has already voted on this list
    const existing = await db
      .select()
      .from(listVotes)
      .where(and(eq(listVotes.listId, listId), eq(listVotes.userId, user.id)));

    if (existing.length > 0) {
      // if already voted, clicking again removes the vote
      await db
        .delete(listVotes)
        .where(
          and(eq(listVotes.listId, listId), eq(listVotes.userId, user.id)),
        );
    } else {
      // Not voted yet — add a new vote
      await db.insert(listVotes).values({ listId, userId: user.id });
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(listVotes)
      .where(eq(listVotes.listId, listId));

    const voteCount = Number(countResult[0]?.count ?? 0);
    const hasVoted = existing.length === 0;

    return NextResponse.json({ voteCount, hasVoted });
  } catch (err) {
    console.error("Failed to toggle vote:", err);
    return NextResponse.json(
      { error: "Something went wrong voting on this list" },
      { status: 500 },
    );
  }
}
