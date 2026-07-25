import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { userGames } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { userGameId, status, rating, notes } = await request.json();

  await db
    .update(userGames)
    .set({ status, rating, notes, updatedAt: new Date() })
    .where(eq(userGames.id, userGameId));

  return NextResponse.json({ success: true });
}
