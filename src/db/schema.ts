import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  rawgId: numeric("rawg_id").unique(),
  name: text("name").notNull(),
  coverUrl: text("cover_url"),
  description: text("description"),
  criticScore: numeric("critic_score"),
  releaseDate: date("release_date"),
  hltbMain: numeric("hltb_main"),
  hltbMainExtra: numeric("hltb_main_extra"),
  hltbCompletionist: numeric("hltb_completionist"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userGames = pgTable("user_games", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id),
  status: text("status").notNull(), // 'backlog' | 'playing' | 'completed' | 'dropped'
  rating: numeric("rating"),
  notes: text("notes"),
  startedAt: date("started_at"),
  completedAt: date("completed_at"),
  source: text("source"), // 'steam' | 'manual'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
