import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { userGames, games } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRecommendation } from "@/lib/recommendations";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // fetch completed games and backlog in two seperate queries
  const completedRows = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(
      and(eq(userGames.userId, user.id), eq(userGames.status, "completed")),
    );

  const backlogRows = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(and(eq(userGames.userId, user.id), eq(userGames.status, "backlog")));

  const completed = completedRows.map((row) => ({
    name: row.games.name,
    rating: row.user_games.rating ? Number(row.user_games.rating) : null,
    notes: row.user_games.notes,
  }));

  const backlog = backlogRows.map((row) => ({
    id: row.user_games.id,
    name: row.games.name,
    description: row.games.description,
  }));

  const recommendation = await getRecommendation(completed, backlog);

  if (!recommendation) {
    return NextResponse.json({ recommendation: null });
  }

  // attach full game details for the recommended id, so the frontend can render the card without a second lookup
  const matchedGame = backlogRows.find(
    (row) => row.user_games.id === recommendation.userGameId,
  );

  return NextResponse.json({
    recommendation: matchedGame
      ? {
          userGameId: recommendation.userGameId,
          name: matchedGame.games.name,
          coverUrl: matchedGame.games.coverUrl,
          reason: recommendation.reason,
        }
      : null,
  });
}
