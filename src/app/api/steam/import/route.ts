import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveSteamId, getOwnedGames, matchGamesToIgdb } from "@/lib/steam";

// this route handles RESOLVE + MATCHING
// does not insert anything into database
// the user will be able to review the list before they confirm and add them to their profile
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { profileInput } = await request.json();

  const steamId = await resolveSteamId(profileInput);
  if (!steamId) {
    return NextResponse.json(
      {
        error:
          "Could not resolve that Steam profile. Check the URL and try again.",
      },
      { status: 400 },
    );
  }

  const steamGames = await getOwnedGames(steamId);
  if (steamGames.length === 0) {
    return NextResponse.json(
      {
        error:
          "No games found. Make sure your Steam profile's game details are set to Public.",
      },
      { status: 400 },
    );
  }

  const matched = await matchGamesToIgdb(steamGames);

  return NextResponse.json({ candidates: matched });
}
