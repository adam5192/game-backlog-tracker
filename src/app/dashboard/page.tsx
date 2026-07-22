import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userGames, games } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const supabase = await createClient();

  // who is currently logged in, based on session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // QUERY: get all user game entries, joined with games table (personal data + shared metaddata)
  const myGames = await db
    .select()
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(eq(userGames.userId, user.id));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium mb-6">Your Dashboard</h1>

      {myGames.length === 0 ? (
        <p className="text-gray-500">
          No games yet -- you have not added anything to your backlog.
        </p>
      ) : (
        <ul className="space-y-2">
          {myGames.map((row) => (
            <li key={row.user_games.id}>
              {row.games.name} -- {row.user_games.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
