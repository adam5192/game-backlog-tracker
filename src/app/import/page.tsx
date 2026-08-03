"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// matches the shape returned by matchGamesToIgdb on the backend
type Candidate = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  igdbMatch: { igdbId: number; name: string; coverUrl: string | null } | null;
  status: "backlog" | "playing" | "completed" | "dropped";
};

export default function ImportPage() {
  const [profileInput, setProfileInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [autoSorted, setAutoSorted] = useState(false); // tracks toggle state
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const router = useRouter();

  async function handleFetch() {
    setLoading(true);
    setError("");
    setProgress(null);

    const res = await fetch("/api/steam/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileInput }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder(); // turn bytes into string
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const update = JSON.parse(line);

        if (update.type === "progress") {
          setProgress({ current: update.current, total: update.total });
        } else if (update.type === "done") {
          const withDefaults = update.candidates.map(
            (c: Omit<Candidate, "status">) => ({
              ...c,
              status: "backlog" as const,
            }),
          );
          setCandidates(withDefaults);
          const matchedIds = withDefaults
            .filter((c: Candidate) => c.igdbMatch)
            .map((c: Candidate) => c.steamAppId);
          setSelected(new Set(matchedIds));
        }
      }
    }

    setLoading(false);
  }

  function updateStatus(appId: number, status: Candidate["status"]) {
    setCandidates((prev) =>
      prev.map((c) => (c.steamAppId === appId ? { ...c, status } : c)),
    );
  }

  // rough guess as to where each game should go (backlog, playing, completed, dropped)
  // decided based on hours played
  function toggleAutoSort() {
    if (autoSorted) {
      // toggle off, revert everything to "backlog"
      setCandidates((prev) =>
        prev.map((c) => ({ ...c, status: "backlog" as const })),
      );
      setAutoSorted(false);
    } else {
      // toggle-on, playtime-based guessing
      setCandidates((prev) =>
        prev.map((c) => {
          const minutes = c.playtimeMinutes;
          let status: Candidate["status"];
          if (minutes < 120) {
            status = "backlog"; // likely not played or not given a real chance
          } else if (minutes < 600) {
            status = "playing"; // probably made some decent progress
          } else {
            status = "completed"; // 10+ hours = probably finished or deeply played
          }

          return { ...c, status };
        }),
      );
      setAutoSorted(true);
    }
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

      {/* progress bar */}
      {loading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Matching your library...</span>
            {progress && (
              <span>
                {progress.current} / {progress.total}
              </span>
            )}
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-100 rounded-full transition-all duration-300"
              style={{
                width: progress
                  ? `${(progress.current / progress.total) * 100}%`
                  : "0%",
              }}
            ></div>
          </div>
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
          <button
            className={`text-xs px-3 py-1 ${
              autoSorted
                ? "bg-gray-100 text-gray-900"
                : "border border-gray-700 text-gray-100"
            }`}
            onClick={toggleAutoSort}
          >
            {autoSorted ? "Auto-sort applied ✓" : "Auto-sort by playtime"}
          </button>

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
                    {c.igdbMatch && c.igdbMatch.name !== c.steamName && (
                      <span className="text-gray-500">
                        {" "}
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

                {/* only show status buttons for games that are actually checked,
                ignore unselected games */}
                {selected.has(c.steamAppId) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {(
                      ["backlog", "playing", "completed", "dropped"] as const
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(c.steamAppId, s)}
                        // highlight whichever status is currently selected for this game
                        className={`text-xs px-2 py-1 rounded capitalize ${
                          c.status === s
                            ? "bg-gray-100 text-gray-900"
                            : "border border-gray-700 text-gray-400"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
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
