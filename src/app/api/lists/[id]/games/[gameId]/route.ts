import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists, listGames } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; gameId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: listId, gameId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // confirm ownership of the list before allowing any modification
  const listRows = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (listRows.length === 0) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  try {
    await db
      .delete(listGames)
      .where(and(eq(listGames.listId, listId), eq(listGames.gameId, gameId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to remove game from list:", err);
    return NextResponse.json(
      { error: "Something went wrong removing this game" },
      { status: 500 },
    );
  }
}
