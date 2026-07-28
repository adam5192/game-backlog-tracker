import {
  searchIgdbGames,
  getFullCoverUrl,
  findExactIgdbMatch,
  getBlendedRating,
} from "./igdb";

// extract eitheer raw SteamID64 or a vanity name depending on format of user URL
export async function resolveSteamId(input: string): Promise<string | null> {
  const cleaned = input.trim().replace(/\/$/, "");

  // case1: a full /profiles/NUMBER url, extract just the number
  const profileMatch = cleaned.match(/\/profiles\/(\d+)/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // case2: id/customname url, extract just custome name
  const vanityMatch = cleaned.match(/\/id\/([^/]+)/);
  // case3: user just pasted the raw vanity name with no URL at all
  const vanityName = vanityMatch ? vanityMatch[1] : cleaned;

  // case4: user pasted a raw SteamID64 directly
  if (/^\d{17}$/.test(vanityName)) {
    return vanityName;
  }

  // otherwise, treat as a vanity name, and ask steam to resolve it
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanityName)}`,
  );
  const data = await res.json();

  // success === 1 = match found
  if (data.response?.success === 1) {
    return data.response.steamid;
  }

  return null; // couldnt resolve
}

type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number; // total minutes played
};

// feteches a users full steam library using their resolved steamid64
// retirms empty array when profile is private or has no games
export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&format=json`,
  );
  const data = await res.json();

  return data.response?.games ?? [];
}

// data the frontend will need for each steam game
export type SteamImportCandidate = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  igdbMatch: {
    igdbId: number;
    name: string;
    coverUrl: string | null;
    criticScore: number | null;
  } | null;
};

// take raw steam library and try to find an igdb match for each game
export async function matchGamesToIgdb(
  steamGames: { appid: number; name: string; playtime_forever: number }[],
): Promise<SteamImportCandidate[]> {
  function cleanGameName(name: string): string {
    return (
      name
        // strip symbols that appear in IGDB's names but are common in Steam's official titles
        .replace(/[™®©]/g, "")
        .trim()
    );
  }

  // strip common suffixes that do not appear in game database but appear in steam titles
  function stripEditionSuffix(name: string): string {
    return name
      .replace(
        /\s*-?\s*(game of the year|goty|definitive|legacy|remastered?|complete|deluxe|enhanced|special)\s*(edition)?\s*(\(\d{4}\))?$/i,
        "",
      )
      .trim();
  }

  // strip common publisher/franchise branding steam includes but igdb usually omits
  function stripBrandingPrefix(name: string): string {
    return name
      .replace(
        /^(EA SPORTS™?|EA SPORTS FC™?|Tom Clancy'?s|Sid Meier'?s|Marvel'?s|Disney'?s)\s+/i,
        "",
      )
      .trim();
  }

  const results: SteamImportCandidate[] = [];

  for (const steamGame of steamGames) {
    let igdbMatch: SteamImportCandidate["igdbMatch"] = null;
    const cleanedName = cleanGameName(steamGame.name);

    try {
      // STEP 1: try a direct exact-name match first
      let best = await findExactIgdbMatch(cleanedName);

      // STEP 2: fall back if no exact match exists
      if (!best) {
        let candidates = await searchIgdbGames(cleanedName);

        // if the colon-preserving search returned few/no results, try again
        // with the colon replaced by a space, since steam/igdb dont always
        // agree on "title:sub" vs "title: sub"
        if (candidates.length < 3 && cleanedName.includes(":")) {
          const noColonName = cleanedName
            .replace(/:/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const altCandidates = await searchIgdbGames(noColonName);
          const seen = new Set(candidates.map((c) => c.id));
          for (const c of altCandidates) {
            if (!seen.has(c.id)) {
              candidates.push(c);
              seen.add(c.id);
            }
          }
        }

        // if still nothing, try stripping a known publisher/franchise prefix
        if (candidates.length === 0) {
          const noPrefixName = stripBrandingPrefix(cleanedName);
          if (noPrefixName !== cleanedName) {
            candidates = await searchIgdbGames(noPrefixName);
          }
        }

        // if nothing came back, try again without extra suffixes
        if (candidates.length === 0) {
          const simplifiedName = stripEditionSuffix(cleanedName);
          if (simplifiedName !== cleanedName) {
            candidates = await searchIgdbGames(simplifiedName);
          }
        }

        // prefer exact name match, fall back to best result
        const exact = candidates.find(
          (g) => g.name.toLowerCase() === cleanedName.toLowerCase(),
        );

        // temporary debug — see exactly what candidates exist and their rating counts
        console.log(
          `Candidates for "${cleanedName}":`,
          candidates.map((c) => ({
            name: c.name,
            ratingCount: c.total_rating_count,
          })),
        );

        if (exact) {
          best = exact;
        } else if (candidates.length > 0) {
          // prefer whichever candidate has the highest total_rating_count as a popularity signal
          best = [...candidates].sort(
            (a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0),
          )[0];
        }
      }

      if (best) {
        igdbMatch = {
          igdbId: best.id,
          name: best.name,
          coverUrl: best.cover?.url ? getFullCoverUrl(best.cover.url) : null,
          criticScore: getBlendedRating(best),
        };
      }
    } catch {
      // if lookup fails, skip
    }

    results.push({
      steamAppId: steamGame.appid,
      steamName: steamGame.name,
      playtimeMinutes: steamGame.playtime_forever,
      igdbMatch,
    });
  }

  return results;
}
