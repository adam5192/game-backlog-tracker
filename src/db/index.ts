import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// low-level connection to postgres
const client = postgres(process.env.DATABASE_URL!);

// powers autocomplete and type-checking on queries
export const db = drizzle(client, { schema });
