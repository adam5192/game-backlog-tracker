// exchange client id + secret for temporary access token
async function getIgdbAccessToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  const data = await res.json();
  return data.access_token;
}

// shape of a single game result from igdb /games endpoint
export type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number; // unix timestamp (seconds)
  artworks?: { url: string }[];
  cover?: { url: string };
};

// searches IGDB directly
export async function searchIgdbGames(query: string): Promise<IgdbGame[]> {
  const token = await getIgdbAccessToken();

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    // cover.url: reaches into the related "cover" object for its url field
    // limit 15: gives the user enough real options to pick the right one
    body: `search "${query}"; fields name,summary,first_release_date,artworks.url,cover.url; limit 15;`,
  });

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// fetches time-to-beat data using exact igdb game id
export async function getTimeToBeatById(igdbGameId: number) {
  const token = await getIgdbAccessToken();

  const res = await fetch("https://api.igdb.com/v4/game_time_to_beats", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    body: `fields *; where game_id = ${igdbGameId};`,
  });

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

// upgrades cover URL to a proper https URL at a bigger size.
export function getFullCoverUrl(rawUrl: string): string {
  return `https:${rawUrl.replace("t_thumb", "t_720p")}`;
}

// attempts a direct, exact-name lookup
export async function findExactIgdbMatch(
  name: string,
): Promise<IgdbGame | null> {
  const token = await getIgdbAccessToken();

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    body: `fields name,summary,first_release_date,artworks.url,cover.url; where name = "${name}"; limit 1;`,
  });

  const data = await res.json();
  return Array.isArray(data) && data[0] ? data[0] : null;
}
