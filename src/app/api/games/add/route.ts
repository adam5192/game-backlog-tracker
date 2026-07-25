import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { games, userGames } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTimeToBeatById } from "@/lib/igdb";

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
  const {
    igdbId,
    name,
    coverUrl,
    artworkUrl,
    description,
    releaseDate,
    status,
  } = body;

  // check if game exists in local cache
  const existing = await db
    .select()
    .from(games)
    .where(eq(games.igdbId, igdbId.toString()));

  let gameRecord = existing[0];

  // if doesnt exist, insert now
  if (!gameRecord) {
    // only fetch HLTB data the first time ANYONE adds the game, cahce for later users
    let hltbData: {
      hltbMain: number | null;
      hltbMainExtra: number | null;
      hltbCompletionist: number | null;
    } = { hltbMain: null, hltbMainExtra: null, hltbCompletionist: null };

    try {
      const result = await getTimeToBeatById(igdbId);
      if (result) hltbData = result;
    } catch {
      // if not data, still proceed
    }

    const inserted = await db
      .insert(games)
      .values({
        igdbId: igdbId.toString(),
        name,
        coverUrl,
        artworkUrl,
        description,
        releaseDate,
        hltbMain: hltbData.hltbMain?.toString() ?? null,
        hltbMainExtra: hltbData.hltbMainExtra?.toString() ?? null,
        hltbCompletionist: hltbData.hltbCompletionist?.toString() ?? null,
      })
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
