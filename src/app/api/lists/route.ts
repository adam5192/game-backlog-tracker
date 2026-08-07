import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userLists = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, user.id));
    return NextResponse.json({ lists: userLists });
  } catch (err) {
    console.error("Failed to fetch lists:", err);
    return NextResponse.json(
      { error: "Something went wrong loading your list" },
      { status: 500 },
    );
  }
}
