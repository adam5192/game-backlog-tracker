// persists across function calls so we dont after re-authenticate on every igdb request
let cachedToken: { token: string; expiresAt: number } | null = null;

// exchange client id + secret for temporary access token
async function getIgdbAccessToken() {
  // if we already have a token that hasnt expired yet, reuse it
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  const res = await fetchWithTimeout(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  const data = await res.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
  return cachedToken.token;
}

// shape of a single game result from igdb /games endpoint
export type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number; // unix timestamp (seconds)
  artworks?: { url: string }[];
  cover?: { url: string };
  genres?: { name: string }[];
  total_rating_count?: number; // used as a tiebreaker for matching games
  aggregated_rating?: number; // critic average
  rating?: number; // user average
};

// searches IGDB directly
export async function searchIgdbGames(query: string): Promise<IgdbGame[]> {
  const token = await getIgdbAccessToken();

  const res = await fetchWithTimeout("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    // limit 15: gives the user enough real options to pick the right one
    body: `search "${query}"; fields name,summary,first_release_date,artworks.url,cover.url,aggregated_rating,rating,total_rating_count, genres.name; limit 15;`,
  });

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// fetches time-to-beat data using exact igdb game id
export async function getTimeToBeatById(igdbGameId: number) {
  const token = await getIgdbAccessToken();

  const res = await fetchWithTimeout(
    "https://api.igdb.com/v4/game_time_to_beats",
    {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
      body: `fields *; where game_id = ${igdbGameId};`,
    },
  );

  const data = await res.json();
  const entry = Array.isArray(data) ? data[0] : null;

  if (!entry) return null;

  return {
    hltbMain: entry.normally ? Math.round(entry.normally / 3600) : null,
    hltbMainExtra: null,
    hltbCompletionist: entry.completely
      ? Math.round(entry.completely / 3600)
      : null,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// upgrades cover URL to a proper https URL at a bigger size.
export function getFullCoverUrl(rawUrl: string): string {
  return `https:${rawUrl.replace("t_thumb", "t_720p")}`;
}

export function getBlendedRating(game: IgdbGame): number | null {
  const critic = game.aggregated_rating;
  const user = game.rating;

  if (critic != null && user != null) {
    return Math.round((critic + user) / 2);
  }
  const single = critic ?? user;
  return single != null ? Math.round(single) : null;
}

export function getGenreNames(game: IgdbGame): string[] {
  return game.genres?.map((g) => g.name) ?? [];
}

// attempts a direct, exact-name lookup
export async function findExactIgdbMatch(
  name: string,
): Promise<IgdbGame | null> {
  const token = await getIgdbAccessToken();

  const res = await fetchWithTimeout("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    // if there are multiple exact matches, dont just trust whichever one comes back first
    // select the more popular option based on rating count
    body: `fields name,summary,first_release_date,artworks.url,cover.url,aggregated_rating,rating,total_rating_count, genres.name; where name = "${name}"; sort total_rating_count desc; limit 5;`,
  });

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) return null;

  // because of the sorting, the most popular exact match is now the first result
  return data[0];
}
