import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userGames, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import GameList from "@/components/GameList";
import Link from "next/link";
export default async function DashboardPage() {
  const supabase = await createClient();

  // who is currently logged in, based on session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // QUERY: get all user game entries, joined with games table (personal data + shared metaddata)
  const rows = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(eq(userGames.userId, user.id));

  // drizzle's join results comes back nested by table name
  // reshape it into the flat structure expected by gamedetailmodal and gamelist
  const myGames = rows.map((row) => ({
    userGameId: row.user_games.id,
    gameId: row.games.id,
    igdbId: Number(row.games.igdbId),
    name: row.games.name,
    coverUrl: row.games.coverUrl,
    artworkUrl: row.games.artworkUrl,
    description: row.games.description,
    criticScore: row.games.criticScore ? Number(row.games.criticScore) : null,
    hltbMain: row.games.hltbMain ? Number(row.games.hltbMain) : null,
    hltbMainExtra: row.games.hltbMainExtra
      ? Number(row.games.hltbMainExtra)
      : null,
    hltbCompletionist: row.games.hltbCompletionist
      ? Number(row.games.hltbCompletionist)
      : null,
    status: row.user_games.status,
    rating: row.user_games.rating ? Number(row.user_games.rating) : null,
    notes: row.user_games.notes,
    releaseDate: row.games.releaseDate,
    genres: row.games.genres ?? [],
    createdAt: row.user_games.createdAt?.toString() ?? new Date().toISOString(),
  }));

  return (
    <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto">
      {" "}
      <h1 className="text-2xl font-medium mb-6">Your Dashboard</h1>
      {myGames.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">
            No games yet... Search for something to add, or import your Steam
            library.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/search"
              className="text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground"
            >
              Search games
            </Link>
            <Link
              href="/import"
              className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors"
            >
              Import from Steam
            </Link>
          </div>
        </div>
      ) : (
        <GameList games={myGames} />
      )}
    </div>
  );
}
