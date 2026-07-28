"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// matches the shape returned by matchGamesToIgdb on the backend
type Candidate = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  igdbMatch: { igdbId: number; name: string; coverUrl: string | null } | null;
};

export default function ImportPage() {
  const [profileInput, setProfileInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  async function handleFetch() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/steam/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileInput }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setCandidates(data.candidates);
    // pre-select the games that found an igdb match
    // games with no match shown but unchecked so the user
    // can still see what got skipped
    const matchedIds = data.candidates
      .filter((c: Candidate) => c.igdbMatch)
      .map((c: Candidate) => c.steamAppId);
    setSelected(new Set(matchedIds));
  }

  function toggleSelected(appId: number) {
    // build a new set instead of mutating bc react needs a new object reference to detect the state change
    const next = new Set(selected);
    if (next.has(appId)) {
      next.delete(appId);
    } else {
      next.add(appId);
    }
    setSelected(next);
  }

  async function handleImport() {
    setImporting(true);
    // only send candidates the user left checked
    const toImport = candidates.filter((c) => selected.has(c.steamAppId));

    await fetch("/api/steam/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: toImport }),
    });

    setImporting(false);
    router.push("/dashboard");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-4 text-gray-100">
        Import from Steam
      </h1>

      {candidates.length === 0 && (
        <div className="flex gap-2 mb-4">
          <input
            className="border border-gray-700 p-2 flex-1 text-gray-100 placeholder-gray-500"
            placeholder="Your steam profile URL or vanity name"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
          />
          <button
            className="border border-gray-700 px-4 py-2 text-gray-100 disabled:opacity-50"
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch library"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {candidates.length > 0 && (
        <>
          <p className="text-sm text-gray-400 mb-4">
            Found {candidates.length} games — {selected.size} selected for
            import. Uncheck anything that matched incorrectly or that you
            don&apos;t want to import.
          </p>

          <ul className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto">
            {candidates.map((c) => (
              <li
                key={c.steamAppId}
                className="flex items-center gap-3 border-b border-gray-700 pb-2"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.steamAppId)}
                  onChange={() => toggleSelected(c.steamAppId)}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-100">
                    {c.steamName}
                    {/* show the matched igdb name only if it differs
                        from the steam name; so the user can find mismatches easily*/}
                    {c.igdbMatch && c.igdbMatch.name !== c.steamName && (
                      <span className="text-gray-500">
                        → matched: {c.igdbMatch.name}
                      </span>
                    )}
                  </p>
                  {!c.igdbMatch && (
                    <p className="text-xs text-red-400">
                      No IGDB match found - will be skipped
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            className="border px-4 py-2 w-full bg-gray-100 text-gray-900 disabled:opacity-50"
            onClick={handleImport}
            disabled={importing || selected.size === 0}
          >
            {importing ? "Importing..." : `Import ${selected.size} games`}
          </button>
        </>
      )}
    </div>
  );
}
