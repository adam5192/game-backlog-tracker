//////////////////////////// CURRENTLY UNUSED (might use later)

// shape of a single result from RAWG search endpoint, with only the fields needed
type RawgSearchResult = {
  name: string;
  metacritic: number | null;
  released: string | null;
};

export async function getMetacriticScore(
  name: string,
  releaseYear?: number | null,
): Promise<number | null> {
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(name)}&page_size=10`,
  );
  const data = await res.json();

  if (!Array.isArray(data.results) || data.results.length === 0) return null;

  const results = data.results as RawgSearchResult[];

  // prefer an excat name match
  const exactMatches = results.filter(
    (r) => r.name.toLowerCase() === name.toLowerCase(),
  );

  let best: RawgSearchResult | undefined;

  if (exactMatches.length === 1) {
    best = exactMatches[0];
  } else if (exactMatches.length > 1 && releaseYear) {
    // if there are multiple exact matches, filter on release year
    best = exactMatches.find(
      (r) => r.released && new Date(r.released).getFullYear() === releaseYear,
    );
  }

  // fallback to first exact match if it wasnt narrowed down or top result if no exact match exists
  if (!best) {
    best = exactMatches[0] ?? results[0];
  }

  return best?.metacritic ?? null;
}
