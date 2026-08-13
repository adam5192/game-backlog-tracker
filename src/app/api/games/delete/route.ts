import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { userGames } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { userGameId } = await request.json();

  try {
    // only delete a row that belongs to current user
    const deleted = await db
      .delete(userGames)
      .where(and(eq(userGames.id, userGameId), eq(userGames.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Game entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete game:", err);
    return NextResponse.json(
      { error: "Something went wrong removing this game" },
      { status: 500 },
    );
  }
}
