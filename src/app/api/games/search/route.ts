import { NextRequest, NextResponse } from "next/server";

// handle GET requests to /api/games/serach
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // call RAWG search endpoint
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`,
  );

  const data = await res.json();

  // shape of game object from rawg response
  type RawgGame = {
    id: number;
    name: string;
    background_image: string;
    metacritic: number | null;
    released: string;
  };

  // send back only needed fields to frontend
  const results = data.results.map((game: RawgGame) => ({
    rawgId: game.id,
    name: game.name,
    coverUrl: game.background_image,
    criticScore: game.metacritic,
    releaseDate: game.released,
  }));

  return NextResponse.json({ results });
}
