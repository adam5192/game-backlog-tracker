"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

type GameResult = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  description: string | null;
  releaseDate: string | null;
  criticScore: number | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // tracks if a real search happened yet, not just first load

  async function handleSearch() {
    if (!query.trim()) {
      toast.error("Enter a game name to search.");
      return; // dont even hit the api for an empty search
    }

    setLoading(true);
    const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setLoading(false);
    setHasSearched(true);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong searching.");
      setResults([]); // make sure results is never left as undefined
      return;
    }

    setResults(data.results);
  }

  async function handleAdd(game: GameResult) {
    const res = await fetch("/api/games/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...game, status: "backlog" }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong adding this game.");
      return;
    }

    toast.success(`Added ${game.name} to your backlog`);
  }

  return (
    <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto">
      {" "}
      <h1 className="text-2xl font-medium mb-6 text-foreground">
        Search Games
      </h1>
      <div className="flex gap-2 mb-6">
        <input
          className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg flex-1 border border-border-color focus:border-accent outline-none transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()} // let enter key trigger search too
          placeholder="Search for a game..."
        />
        <button
          className="text-sm px-5 py-2 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {loading ? (
        // skeleton rows so the layout doesnt jump once real data arrives
        <ul className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-border-color pb-3 animate-pulse"
            >
              <div className="w-12 h-16 bg-surface-1 rounded-lg shrink-0" />
              <div className="h-4 bg-surface-1 rounded w-48" />
            </li>
          ))}
        </ul>
      ) : results.length === 0 && hasSearched ? (
        // only show this after an actual search, not on first page load
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">
            No games found for &ldquo;{query}&rdquo;. Try a different search.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((game) => (
            <li
              key={game.igdbId}
              className="flex items-center gap-3 border-b border-border-color pb-3"
            >
              {/* small cover thumbnail */}
              <div className="w-12 h-16 relative shrink-0 rounded-lg overflow-hidden bg-surface-1">
                {game.coverUrl && (
                  <Image
                    src={game.coverUrl}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )}
              </div>
              <span className="flex-1 text-foreground">{game.name}</span>
              <button
                className="text-sm px-3 py-1 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors shrink-0"
                onClick={() => handleAdd(game)}
              >
                Add to backlog
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
