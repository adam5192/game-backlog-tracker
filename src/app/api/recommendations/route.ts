import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { userGames, games, recommendations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRecommendations } from "@/lib/recommendations";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { recommendationsRatelimit } from "@/lib/ratelimit";

const redis = Redis.fromEnv();

// allows 1 request per 5-second window enforced through shared storage that
// every serverless instance can see, instead of in-memory state

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // each user gets their own independent 5-second window
  const { success } = await recommendationsRatelimit.limit(user.id);

  if (!success) {
    return NextResponse.json(
      { error: "Please wait a moment before requesting again." },
      { status: 429 },
    );
  }

  // ?refresh=true bypasses the cache entirely, used when the user has
  // cycled through every cached recommendation and wants fresh ones
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  const existing = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, user.id));

  const cached = existing[0];
  const isFresh =
    cached &&
    Date.now() - new Date(cached.generatedAt!).getTime() < CACHE_DURATION_MS;

  // need the backlog either way, to attach full game details
  // to whichever recommendation ids end up returning
  const backlogRows = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(and(eq(userGames.userId, user.id), eq(userGames.status, "backlog")));

  let recList: { userGameId: string; reason: string }[];

  if (cached && isFresh && !forceRefresh) {
    // use the cached set — no API cal
    recList = JSON.parse(cached.data);
  } else {
    const completedRows = await db
      .select()
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(
        and(eq(userGames.userId, user.id), eq(userGames.status, "completed")),
      );

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

    recList = await getRecommendations(completed, backlog, 3);

    // upsert: insert a new cache row, or update the existing one if this
    // user already has a row (since userId is unique on this table)
    await db
      .insert(recommendations)
      .values({ userId: user.id, data: JSON.stringify(recList) })
      .onConflictDoUpdate({
        target: recommendations.userId,
        set: { data: JSON.stringify(recList), generatedAt: new Date() },
      });
  }

  // attach full game details to each cached/fresh id
  const enriched = recList
    .map((rec) => {
      const row = backlogRows.find((r) => r.user_games.id === rec.userGameId);
      if (!row) return null;
      return {
        userGameId: rec.userGameId,
        name: row.games.name,
        coverUrl: row.games.coverUrl,
        reason: rec.reason,
      };
    })
    .filter((r) => r !== null);

  return NextResponse.json({
    recommendations: enriched,
    generatedAt: cached?.generatedAt ?? new Date().toISOString(),
  });
}
