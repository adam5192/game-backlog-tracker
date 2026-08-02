"use client";

import { useState } from "react";
import { toast } from "sonner";

type GameResult = {
  igdbId: number;
  name: string;
  coverUrl: string;
  criticScore: number | null;
  releaseDate: string;
  genres: string[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  }

  async function handleAdd(game: GameResult) {
    const res = await fetch("/api/games/add", {
      method: "POST",
      headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ ...game, status: "backlog" }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong adding this game.");
      return;
    }
    toast.success(`Added ${game.name} to your backlog!`);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="flex gap-2 mb-6 text-gray-100">Search Games</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="bg-gray-900 text-gray-100 placeholder-gray-500 px-4 py-2 rounded-lg flex-1 border border-gray-800 focus:border-gray-600 outline-none transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a game..."
        />
        <button
          className="text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-900 disabled:opacity-50"
          onClick={handleSearch}
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
              className="flex items-center justify-between border-b border-gray-800 pb-2 animate-pulse"
            >
              <div className="h-4 bg-gray-800 rounded w-48" />
              <div className="h-7 bg-gray-800 rounded-full w-24" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {results.map((game) => (
            <li
              key={game.igdbId}
              className="flex items-center justify-between border-b border-gray-800 pb-2"
            >
              <span className="text-gray-100">
                {game.name} {game.criticScore && `(${game.criticScore})`}
              </span>
              <button
                className="text-sm px-3 py-1 rounded-full border border-gray-800 text-gray-100 hover:bg-gray-800 transition-colors"
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
