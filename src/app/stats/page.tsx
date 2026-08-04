import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userGames, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import GenreChart from "@/components/GenreChart";
import StatusChart from "@/components/StatusChart";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const rows = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(eq(userGames.userId, user.id));

  const totalGames = rows.length;
  const completedGames = rows.filter(
    (r) => r.user_games.status === "completed",
  );

  // average of user completed games vs average of igdb rating for those games
  const ratedGames = completedGames.filter(
    (r) => r.user_games.rating != null && r.games.criticScore != null,
  );
  const avgYourRating = ratedGames.length
    ? ratedGames.reduce((sum, r) => sum + Number(r.user_games.rating), 0) /
      ratedGames.length
    : null;
  const avgCriticRating = ratedGames.length
    ? ratedGames.reduce((sum, r) => sum + Number(r.games.criticScore), 0) /
      ratedGames.length
    : null;

  const genreCounts: Record<string, number> = {};
  rows.forEach((r) => {
    (r.games.genres ?? []).forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
    });
  });
  const genreData = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // top 8 genres

  // status counts
  const statuses = ["backlog", "playing", "completed", "dropped"] as const;
  const statusData = statuses.map((status) => ({
    status,
    count: rows.filter((r) => r.user_games.status === status).length,
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-medium mb-6 text-foreground">Your stats</h1>

      {totalGames === 0 ? (
        <p className="text-text-secondary">
          Add some games to your library to see your stats here.
        </p>
      ) : (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total games" value={totalGames.toString()} />
            <StatCard
              label="Completed"
              value={completedGames.length.toString()}
            />
            <StatCard
              label="Your avg rating"
              value={avgYourRating != null ? avgYourRating.toFixed(1) : "—"}
            />
            <StatCard
              label="Critic avg (same games)"
              value={avgCriticRating != null ? avgCriticRating.toFixed(0) : "—"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-2 border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">
                Top genres
              </h2>
              <GenreChart data={genreData} />
            </div>

            <div className="bg-surface-2 border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-medium text-foreground mb-4">
                By status
              </h2>
              <StatusChart data={statusData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-1 rounded-2xl p-5">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}
