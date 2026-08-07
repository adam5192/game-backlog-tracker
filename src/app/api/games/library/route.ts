import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { userGames, games } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, user.id));

    const results = rows.map((row) => ({
      igdbId: Number(row.games.igdbId),
      name: row.games.name,
      coverUrl: row.games.coverUrl,
      artworkUrl: row.games.artworkUrl,
      description: row.games.description,
      releaseDate: row.games.releaseDate,
      criticScore: row.games.criticScore ? Number(row.games.criticScore) : null,
      genres: row.games.genres ?? [],
    }));

    return NextResponse.json({ games: results });
  } catch (err) {
    console.error("Failed to fetch library:", err);
    return NextResponse.json(
      { error: "Something went wrong loading your library" },
      { status: 500 },
    );
  }
}
