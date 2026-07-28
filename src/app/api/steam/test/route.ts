import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId, getOwnedGames, matchGamesToIgdb } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input");

  if (!input) {
    return NextResponse.json({ error: "Missing ?input=" }, { status: 400 });
  }

  const steamId = await resolveSteamId(input);

  if (!steamId) {
    return NextResponse.json(
      { error: "Could not resolve Steam ID" },
      { status: 400 },
    );
  }

  const games = await getOwnedGames(steamId);

  // match the first 5 games for this quick test
  const matched = await matchGamesToIgdb(games.slice(0, 50));

  return NextResponse.json({ steamId, gameCount: games.length, matched });
}
