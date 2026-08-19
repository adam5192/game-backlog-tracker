CREATE TABLE "list_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "list_votes_list_id_user_id_unique" UNIQUE("list_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "list_votes" ADD CONSTRAINT "list_votes_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;