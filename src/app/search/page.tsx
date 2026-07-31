"use client";

import { useState } from "react";

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

  async function handleSearch() {
    const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results);
  }

  async function handleAdd(game: GameResult) {
    const res = await fetch("/api/games/add", {
      method: "POST",
      headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ ...game, status: "backlog" }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Something went wrong adding this game.");
      return;
    }
    alert(`Added ${game.name} to your backlog!`);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="flex gap-2 mb-6">Search Games</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a game..."
        />
        <button className="border px-4 py-2" onClick={handleSearch}>
          Search
        </button>
      </div>

      <ul className="space-y-3">
        {results.map((game) => (
          <li
            key={game.igdbId}
            className="flex items-center justify-between border-b pb-2"
          >
            <span>
              {game.name} {game.criticScore && `(${game.criticScore})`}
            </span>
            <button
              className="border px-3 py-1 text-sm"
              onClick={() => handleAdd(game)}
            >
              Add to backlog
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
