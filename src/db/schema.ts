import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  igdbId: numeric("igdb_id").unique(),
  name: text("name").notNull(),
  coverUrl: text("cover_url"), // box art  portrait, used in the list view
  artworkUrl: text("artwork_url"), // key art/screenshot  wide, used in the modal
  description: text("description"),
  criticScore: numeric("critic_score"),
  releaseDate: date("release_date"),
  genres: text("genres").array(),
  hltbMain: numeric("hltb_main"),
  hltbMainExtra: numeric("hltb_main_extra"),
  hltbCompletionist: numeric("hltb_completionist"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userGames = pgTable(
  "user_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    status: text("status").notNull(),
    rating: numeric("rating"),
    notes: text("notes"),
    startedAt: date("started_at"),
    completedAt: date("completed_at"),
    source: text("source"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // games should be unique
    userGameUnique: unique().on(table.userId, table.gameId),
  }),
);

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(), // one cached set per user
  data: text("data").notNull(), // JSON string: an array of recommendations
  generatedAt: timestamp("generated_at").defaultNow(),
});
