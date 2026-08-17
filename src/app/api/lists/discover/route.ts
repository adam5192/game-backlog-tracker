// src/app/api/lists/discover/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, profiles } from "@/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";

// no auth check because anyone can view public lists
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q");

  try {
    const results = await db
      .select()
      .from(lists)
      .leftJoin(profiles, eq(lists.userId, profiles.userId))
      .where(
        search
          ? and(eq(lists.isPublic, true), ilike(lists.name, `%${search}%`))
          : eq(lists.isPublic, true),
      )
      .orderBy(desc(lists.createdAt))
      .limit(20);

    const shaped = results.map((row) => ({
      id: row.lists.id,
      name: row.lists.name,
      description: row.lists.description,
      creatorName: row.profiles?.displayName ?? "Anonymous",
      creatorAvatar: row.profiles?.avatarUrl ?? null,
    }));

    return NextResponse.json({ lists: shaped });
  } catch (err) {
    console.error("Failed to fetch public lists:", err);
    return NextResponse.json(
      { error: "Something went wrong loading public lists" },
      { status: 500 },
    );
  }
}
