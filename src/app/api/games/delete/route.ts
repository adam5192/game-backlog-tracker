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

  const { userGameId } = await request.json();

  try {
    await db.delete(userGames).where(eq(userGames.id, userGameId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete game:", err);
    return NextResponse.json(
      { error: "Something went wrong removing this game" },
      { status: 500 },
    );
  }
}
