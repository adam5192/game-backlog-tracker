import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { games, userGames } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HowLongToBeatService } from "howlongtobeat";

const hltbService = new HowLongToBeatService();

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
    // only fetch HLTB data the first time ANYONE adds the game, cahce for later users
    let hltbData: {
      hltbMain: number | null;
      hltbMainExtra: number | null;
      hltbCompletionist: number | null;
    } = { hltbMain: null, hltbMainExtra: null, hltbCompletionist: null };
    try {
      const results = await hltbService.search(name);
      console.log("HLTB results for", name, ":", results); // temporary debug line
      const best = results[0];
      if (best) {
        hltbData = {
          hltbMain: best.gameplayMain,
          hltbMainExtra: best.gameplayMainExtra,
          hltbCompletionist: best.gameplayCompletionist,
        };
      }
    } catch (err) {
      console.log("HLTB search failed:", err);
      // if HLTB lookup fails, continue instead of blocking the add
    }

    const inserted = await db
      .insert(games)
      .values({
        rawgId: rawgId.toString(),
        name,
        coverUrl,
        criticScore: criticScore?.toString() ?? null,
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
