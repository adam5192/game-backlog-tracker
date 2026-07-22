CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawg_id" numeric,
	"name" text NOT NULL,
	"cover_url" text,
	"description" text,
	"critic_score" numeric,
	"release_date" date,
	"hltb_main" numeric,
	"hltb_main_extra" numeric,
	"hltb_completionist" numeric,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "games_rawg_id_unique" UNIQUE("rawg_id")
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"status" text NOT NULL,
	"rating" numeric,
	"notes" text,
	"started_at" date,
	"completed_at" date,
	"source" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;