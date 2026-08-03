"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const [autoSorted, setAutoSorted] = useState(false);
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
    const decoder = new TextDecoder();
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

  function toggleAutoSort() {
    if (autoSorted) {
      setCandidates((prev) =>
        prev.map((c) => ({ ...c, status: "backlog" as const })),
      );
      setAutoSorted(false);
    } else {
      setCandidates((prev) =>
        prev.map((c) => {
          const minutes = c.playtimeMinutes;
          let status: Candidate["status"];
          if (minutes < 120) status = "backlog";
          else if (minutes < 600) status = "playing";
          else status = "completed";
          return { ...c, status };
        }),
      );
      setAutoSorted(true);
    }
  }

  function toggleSelected(appId: number) {
    const next = new Set(selected);
    if (next.has(appId)) next.delete(appId);
    else next.add(appId);
    setSelected(next);
  }

  async function handleImport() {
    setImporting(true);
    const toImport = candidates.filter((c) => selected.has(c.steamAppId));

    const res = await fetch("/api/steam/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: toImport }),
    });

    setImporting(false);

    if (!res.ok) {
      toast.error("Something went wrong importing your games.");
      return;
    }

    toast.success(`Imported ${toImport.length} games`);
    router.push("/dashboard");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium mb-6 text-foreground">
        Import from Steam
      </h1>

      {candidates.length === 0 && (
        <div className="flex gap-2 mb-4">
          <input
            className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg flex-1 border border-border-color focus:border-accent outline-none transition-colors"
            placeholder="Your Steam profile URL or vanity name"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
          />
          <button
            className="text-sm px-5 py-2 rounded-full bg-accent text-accent-foreground disabled:opacity-50"
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch library"}
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>Matching your library...</span>
            {progress && (
              <span>
                {progress.current} / {progress.total}
              </span>
            )}
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{
                width: progress
                  ? `${(progress.current / progress.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {candidates.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              Found {candidates.length} games : {selected.size} selected for
              import.
            </p>
            <button
              onClick={toggleAutoSort}
              className={`text-xs px-4 py-1.5 rounded-full transition-colors ${
                autoSorted
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-text-secondary hover:text-foreground hover:bg-surface-2 border border-border-color"
              }`}
            >
              {autoSorted ? "Auto-sort applied ✓" : "Auto-sort by playtime"}
            </button>
          </div>

          <p className="text-xs text-text-secondary mb-4">
            Uncheck anything that matched incorrectly or that you don&apos;t
            want to import.
          </p>

          <ul className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto">
            {candidates.map((c) => (
              <li
                key={c.steamAppId}
                className="flex items-center gap-3 border-b border-border-color pb-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.steamAppId)}
                  onChange={() => toggleSelected(c.steamAppId)}
                  className="accent-accent"
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {c.steamName}
                    {c.igdbMatch && c.igdbMatch.name !== c.steamName && (
                      <span className="text-text-secondary">
                        {" "}
                        → matched: {c.igdbMatch.name}
                      </span>
                    )}
                  </p>
                  {!c.igdbMatch && (
                    <p className="text-xs text-danger">
                      No IGDB match found — will be skipped
                    </p>
                  )}
                </div>

                {selected.has(c.steamAppId) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {(
                      ["backlog", "playing", "completed", "dropped"] as const
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(c.steamAppId, s)}
                        className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${
                          c.status === s
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-text-secondary hover:text-foreground hover:bg-surface-2 border border-border-color"
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
            className="w-full text-sm px-4 py-2.5 rounded-full bg-accent text-accent-foreground disabled:opacity-50"
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
