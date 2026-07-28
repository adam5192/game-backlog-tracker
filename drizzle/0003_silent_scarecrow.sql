CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"data" text NOT NULL,
	"generated_at" timestamp DEFAULT now(),
	CONSTRAINT "recommendations_user_id_unique" UNIQUE("user_id")
);
