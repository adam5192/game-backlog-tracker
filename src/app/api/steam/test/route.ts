import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId } from "@/lib/steam";

// TEMPORARY  just for testing resolveSteamId directly.
// will delete this once i build the real import flow.
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input");

  if (!input) {
    return NextResponse.json({ error: "Missing ?input=" }, { status: 400 });
  }

  const steamId = await resolveSteamId(input);

  return NextResponse.json({ input, resolvedSteamId: steamId });
}
