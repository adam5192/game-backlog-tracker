// copies my real account's library and lists over to the shared demo account
// so the demo shows real ratings/notes instead of generated filler
// safe to run again, it just wipes the demo account and resyncs from scratch each time
//
// run with: npx tsx scripts/copy-to-demo.ts
//
// needs SOURCE_USER_ID, DEMO_USER_ID, and DATABASE_URL in .env.local
// SOURCE_USER_ID is my real account's id, grab it from supabase -> auth -> users

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const { userGames, lists, listGames } = schema;

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const SOURCE_USER_ID = process.env.SOURCE_USER_ID;
const DEMO_USER_ID = process.env.DEMO_USER_ID;

if (!SOURCE_USER_ID || !DEMO_USER_ID) {
  console.error(
    "need both SOURCE_USER_ID and DEMO_USER_ID in .env.local, bailing",
  );
  process.exit(1);
}

if (SOURCE_USER_ID === DEMO_USER_ID) {
  console.error(
    "SOURCE_USER_ID and DEMO_USER_ID are the same, not running this",
  );
  process.exit(1);
}

async function main() {
  console.log("grabbing my real library...");

  const sourceGames = await db
    .select()
    .from(userGames)
    .where(eq(userGames.userId, SOURCE_USER_ID!));

  if (sourceGames.length === 0) {
    console.error("nothing on the source account, nothing to copy");
    process.exit(1);
  }

  console.log(
    `found ${sourceGames.length} games, wiping whatever the demo account currently has...`,
  );

  // clear out the demo account first so this stays a clean resync
  // instead of just piling up duplicates every time i run it
  await db.delete(userGames).where(eq(userGames.userId, DEMO_USER_ID!));
  await db.delete(lists).where(eq(lists.userId, DEMO_USER_ID!));
  // list_games rows clean themselves up automatically via cascade delete

  console.log("copying game entries...");

  // games table is a SHARED cache, both accounts can point at the exact
  // same games.id rows, only the personal user_games stuff needs copying
  for (const row of sourceGames) {
    await db.insert(userGames).values({
      userId: DEMO_USER_ID!,
      gameId: row.gameId,
      status: row.status,
      rating: row.rating,
      notes: row.notes,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      source: row.source,
    });
  }

  console.log(`copied ${sourceGames.length} game entries`);

  console.log("copying lists...");

  const sourceLists = await db
    .select()
    .from(lists)
    .where(eq(lists.userId, SOURCE_USER_ID!));

  for (const list of sourceLists) {
    const inserted = await db
      .insert(lists)
      .values({
        userId: DEMO_USER_ID!,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
      })
      .returning();

    const newList = inserted[0];

    const sourceListGames = await db
      .select()
      .from(listGames)
      .where(eq(listGames.listId, list.id));

    for (const lg of sourceListGames) {
      await db.insert(listGames).values({
        listId: newList.id,
        gameId: lg.gameId, // same shared game row
        position: lg.position,
      });
    }

    console.log(
      `copied list "${list.name}" with ${sourceListGames.length} games`,
    );
  }

  console.log("done, demo account matches my real one now");
  process.exit(0);
}

main().catch((err) => {
  console.error("script blew up:", err);
  process.exit(1);
});
