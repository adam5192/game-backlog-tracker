import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 400 });
  }

  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id));
    return NextResponse.json({ profile: rows[0] ?? null });
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    return NextResponse.json(
      { error: "Something went wrong loading your profile" },
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

  const { displayName, bio, avatarUrl } = await request.json();

  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    return NextResponse.json(
      { error: "Display name is required" },
      { status: 400 },
    );
  }
  if (displayName.length > 50) {
    return NextResponse.json(
      { error: "Display name is too long (max 50 characters)" },
      { status: 400 },
    );
  }
  if (bio != null && typeof bio === "string" && bio.length > 300) {
    return NextResponse.json(
      { error: "Bio is too long (max 300 characters)" },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(profiles)
      .values({
        userId: user.id,
        displayName: displayName.trim(),
        bio,
        avatarUrl,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { displayName: displayName.trim(), bio, avatarUrl },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save profile", err);
    return NextResponse.json(
      { error: "Something went wrong saving your profile" },
      { status: 500 },
    );
  }
}
