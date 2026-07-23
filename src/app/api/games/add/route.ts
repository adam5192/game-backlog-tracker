import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { games, userGames } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // no logged-in user = no action
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { rawgId, name, coverUrl, criticScore, releaseDate, status } = body;

  // check if game exists in local cache
  const existing = await db
    .select()
    .from(games)
    .where(eq(games.rawgId, rawgId));

  let gameRecord = existing[0];

  // if doesnt exist, insert now
  if (!gameRecord) {
    const inserted = await db
      .insert(games)
      .values({ rawgId, name, coverUrl, criticScore, releaseDate })
      .returning(); // tells postgres to hand back the row it just created
    gameRecord = inserted[0];
  }

  // create personal enntry to link user to this game
  await db.insert(userGames).values({
    userId: user.id,
    gameId: gameRecord.id,
    status: status || "backlog",
    source: "manual",
  });

  return NextResponse.json({ success: true });
}
