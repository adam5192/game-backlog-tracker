import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { games, userGames } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTimeToBeatById } from "@/lib/igdb";

type ConfirmedCandidate = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  status: "backlog" | "playing" | "completed" | "dropped";
  igdbMatch: {
    igdbId: number;
    name: string;
    coverUrl: string | null;
    artworkUrl: string | null;
    description: string | null;
    releaseDate: string | null;
    criticScore: number | null;
    genres: string[];
  };
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { candidates } = (await request.json()) as {
    candidates: ConfirmedCandidate[];
  };

  let importedCount = 0;
  let failedCount = 0;

  // pattern matching stays within rate limits for big imports
  for (const candidate of candidates) {
    try {
      const igdbId = candidate.igdbMatch.igdbId;

      const existing = await db
        .select()
        .from(games)
        .where(eq(games.igdbId, igdbId.toString()));

      let gameRecord = existing[0];

      if (!gameRecord) {
        let hltbData: {
          hltbMain: number | null;
          hltbMainExtra: number | null;
          hltbCompletionist: number | null;
        } = { hltbMain: null, hltbMainExtra: null, hltbCompletionist: null };

        try {
          const result = await getTimeToBeatById(igdbId);
          if (result) hltbData = result;
        } catch {}

        const inserted = await db
          .insert(games)
          .values({
            igdbId: igdbId.toString(),
            name: candidate.igdbMatch.name,
            coverUrl: candidate.igdbMatch.coverUrl,
            artworkUrl: candidate.igdbMatch.artworkUrl,
            description: candidate.igdbMatch.description,
            releaseDate: candidate.igdbMatch.releaseDate,
            criticScore: candidate.igdbMatch.criticScore?.toString() ?? null,
            genres: candidate.igdbMatch.genres ?? [],
            hltbMain: hltbData.hltbMain?.toString() ?? null,
            hltbMainExtra: hltbData.hltbMainExtra?.toString() ?? null,
            hltbCompletionist: hltbData.hltbCompletionist?.toString() ?? null,
          })
          .returning();
        gameRecord = inserted[0];
      }

      const status = candidate.status;

      // skip inserting if the game was already in the user's list
      const existingUserGame = await db
        .select()
        .from(userGames)
        .where(eq(userGames.gameId, gameRecord.id));

      const alreadyHasIt = existingUserGame.some((ug) => ug.userId === user.id);
      if (alreadyHasIt) continue;

      await db.insert(userGames).values({
        userId: user.id,
        gameId: gameRecord.id,
        status,
        source: "steam",
      });

      importedCount++;
    } catch (err) {
      // one game failing should not stop the rest
      console.error(`Failed to import ${candidate.steamName}:`, err);
      failedCount++;
    }
  }

  return NextResponse.json({ success: true, importedCount, failedCount });
}
