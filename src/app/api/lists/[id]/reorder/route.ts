import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists, listGames } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: listId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listRows = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, user.id)));

  if (listRows.length === 0) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // expected shape:  { listGameId, position } pairs describing the new order (sent by frontend)
  const { order } = await request.json();

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }

  // make sure every listGameId in the request actually belongs to this list before touching anything
  const listGameIds = order.map((o: { listGameId: string }) => o.listGameId);
  const realEntries = await db
    .select()
    .from(listGames)
    .where(
      and(eq(listGames.listId, listId), inArray(listGames.id, listGameIds)),
    );

  if (realEntries.length !== order.length) {
    return NextResponse.json(
      { error: "Invalid list entries" },
      { status: 400 },
    );
  }

  try {
    // update each entrys position individually
    for (const item of order) {
      await db
        .update(listGames)
        .set({ position: item.position })
        .where(
          and(eq(listGames.id, item.listGameId), eq(listGames.listId, listId)),
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to reorder list:", err);
    return NextResponse.json(
      { error: "Something went wrong saving the new order" },
      { status: 500 },
    );
  }
}
