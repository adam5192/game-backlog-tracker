"use client";

import { useMemo, useState } from "react";
import GameDetailModal from "./GameDetailModal";
import Image from "next/image";
import RecommendationCard from "@/components/RecommendationCard";

// matches gamedetailmodal shape, build from joined drizzle query results
type GameDetail = {
  userGameId: string;
  gameId: string;
  name: string;
  coverUrl: string | null;
  artworkUrl: string | null;
  description: string | null;
  criticScore: number | null;
  hltbMain: number | null;
  hltbMainExtra: number | null;
  hltbCompletionist: number | null;
  status: string;
  rating: number | null;
  notes: string | null;
  genres: string[];
  createdAt: string;
  releaseDate: string | null;
};

// receives already-fetched list as a prop
type Props = {
  games: GameDetail[];
};

const STATUSES = ["all", "backlog", "playing", "completed", "dropped"] as const;
type StatusFilter = (typeof STATUSES)[number];

type SortOption = "recent" | "name" | "rating" | "critic" | "release" | "hltb";

export default function GameList({ games }: Props) {
  // tracks which game is currently open in the modal
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // recomputes list of unique gernes only when 'games' actually changes
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => g.genres.forEach((genre) => set.add(genre)));
    return Array.from(set).sort();
  }, [games]);

  // also memoized so it doesnt re-run on every single render
  const filteredGames = useMemo(() => {
    let result = games;

    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    if (selectedGenre) {
      result = result.filter((g) => g.genres.includes(selectedGenre));
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          // -1 so unrated games sort to the bottom
          return (b.rating ?? -1) - (a.rating ?? -1);
        case "critic":
          return (b.criticScore ?? -1) - (a.criticScore ?? -1);
        case "release":
          // missing release dates sort last
          return (
            new Date(b.releaseDate ?? 0).getTime() -
            new Date(a.releaseDate ?? 0).getTime()
          );
        case "hltb":
          return (b.hltbMain ?? -1) - (a.hltbMain ?? -1);
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [games, statusFilter, search, selectedGenre, sortBy]);

  return (
    <>
      {/* search + sort row */}
      <div className="flex gap-2 mb-4">
        <input
          className="bg-gray-900 text-gray-100 placeholder-gray-500 px-4 py-2 rounded-lg flex-1 border border-gray-800 focus:border-gray-600 outline-none transition-colors"
          placeholder="Search your games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="bg-gray-900 text-gray-100 px-4 py-2 rounded-lg w-48 border border-gray-800 focus:border-gray-600 outline-none transition-colors"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="recent">Sort: Recently added</option>
          <option value="name">Name (A-Z)</option>
          <option value="rating">Your rating</option>
          <option value="critic">Critic score</option>
          <option value="release">Release date</option>
          <option value="hltb">Hours to beat</option>
        </select>
      </div>

      {/* genre chips */}
      {availableGenres.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`text-xs px-3 py-1 rounded-full ${
              selectedGenre === null
                ? "bg-gray-100 text-gray-900"
                : "border border-gray-700 text-gray-400"
            }`}
          >
            All
          </button>
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() =>
                setSelectedGenre(genre === selectedGenre ? null : genre)
              }
              // clicking the already-selected genre toggles it back off
              className={`text-xs px-3 py-1 rounded-full ${
                selectedGenre === genre
                  ? "bg-gray-100 text-gray-900"
                  : "border border-gray-700 text-gray-400"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* status tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-3 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`capitalize text-sm px-4 py-1.5 rounded-full transistion-colors ${
              statusFilter === s
                ? "bg-gray-100 text-gray-900"
                : "border border-gray-700 text-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <RecommendationCard />

      {filteredGames.length === 0 ? (
        <p className="text-gray-500 text-sm">No games match your filters.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-8 gap-3">
          {filteredGames.map((game) => (
            <button
              key={game.userGameId}
              className="text-left border border-gray-700 rounded-lg overflow-hidden"
              onClick={() => setSelectedGame(game)}
            >
              <div className="aspect-3/4 bg-gray-800 relative">
                {game.coverUrl && (
                  <Image
                    src={game.coverUrl}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 16vw"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-sm font-medium truncate text-gray-100">
                  {game.name}
                </p>
                {/* show status badge always when viewing "All" */}
                <p className="text-xs text-gray-500 capitalize">
                  {game.status}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}
