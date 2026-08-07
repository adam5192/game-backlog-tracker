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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;

  // validation: name required, non-empty, reasonable length
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "List name is required" },
      { status: 400 },
    );
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: "List name is too long (max 100 characters)" },
      { status: 400 },
    );
  }
  if (
    description != null &&
    (typeof description !== "string" || description.length > 500)
  ) {
    return NextResponse.json(
      { error: "Description is too long (max 500 characters)" },
      { status: 400 },
    );
  }

  try {
    const inserted = await db
      .insert(lists)
      .values({
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .returning();

    return NextResponse.json({ list: inserted[0] });
  } catch (err) {
    console.error("Failed to create list:", err);
    return NextResponse.json(
      { error: "Something went wrong creating your list" },
      { status: 500 },
    );
  }
}
