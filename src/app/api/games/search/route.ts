import { NextRequest, NextResponse } from "next/server";
import { searchIgdbGames, getFullCoverUrl, getBlendedRating } from "@/lib/igdb";

// handle GET requests to /api/games/serach
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const games = await searchIgdbGames(query);

  // sort by rating count
  const sorted = [...games].sort(
    (a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0),
  );

  const results = sorted.map((game) => ({
    igdbId: game.id,
    name: game.name,
    description: game.summary ?? null,
    coverUrl: game.cover?.url ? getFullCoverUrl(game.cover.url) : null,
    artworkUrl: game.artworks?.[0]?.url
      ? getFullCoverUrl(game.artworks[0].url)
      : game.cover?.url
        ? getFullCoverUrl(game.cover.url)
        : null,
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
      : null,
    criticScore: getBlendedRating(game),
  }));

  return NextResponse.json({ results });
}
