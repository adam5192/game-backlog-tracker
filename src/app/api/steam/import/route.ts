import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  resolveSteamId,
  getOwnedGames,
  matchGamesToIgdbSingle,
} from "@/lib/steam";

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

  // readablestream allows us to send data to client in chunks over time, so we can show a progress bar for import
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // convert to byte format for stream
      const results = [];

      for (const [i, steamGame] of steamGames.entries()) {
        const matched = await matchGamesToIgdbSingle(steamGame);
        results.push(matched);

        // send a progress update after each game
        const progressUpdate =
          JSON.stringify({
            type: "progress",
            current: i + 1,
            total: steamGames.length,
          }) + "\n";
        controller.enqueue(encoder.encode(progressUpdate)); // send the chunk rn
      }

      // final message: the complete results when everything is done
      const finalUpdate =
        JSON.stringify({ type: "done", candidates: results }) + "\n";
      controller.enqueue(encoder.encode(finalUpdate));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }, // chunks are being delivered as they arrive rather than waiting for a final return
  });
}
