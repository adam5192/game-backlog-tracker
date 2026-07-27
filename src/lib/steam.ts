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
