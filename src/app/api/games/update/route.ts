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

  // basic validation for rating
  if (
    rating != null &&
    (typeof rating !== "number" || rating < 0 || rating > 10)
  ) {
    return NextResponse.json(
      { error: "Rating must be between 0 and 10" },
      { status: 400 },
    );
  }

  // notes length
  if (notes != null && typeof notes === "string" && notes.length > 2000) {
    return NextResponse.json(
      { error: "Notes are too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  try {
    await db
      .update(userGames)
      .set({ status, rating, notes, updatedAt: new Date() })
      .where(eq(userGames.id, userGameId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update game:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your changes" },
      { status: 500 },
    );
  }
}
