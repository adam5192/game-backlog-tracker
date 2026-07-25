ALTER TABLE "games" RENAME COLUMN "rawg_id" TO "igdb_id";--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_rawg_id_unique";--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_igdb_id_unique" UNIQUE("igdb_id");