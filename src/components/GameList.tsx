"use client";

import { useState } from "react";
import GameDetailModal from "./GameDetailModal";
import Image from "next/image";

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
};

// receives already-fetched list as a prop
type Props = {
  games: GameDetail[];
};

export default function GameList({ games }: Props) {
  // tracks which game is currently open in the modal
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
        {games.map((game) => (
          <button
            key={game.userGameId}
            className="text-left border rounded-lg overflow-hidden"
            onClick={() => setSelectedGame(game)}
            // setting selectedGame to this game triggers the modal to open
          >
            <div className="aspect-3/4 bg-gray-200 relative">
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
              <p className="text-sm font-medium truncate">{game.name}</p>
              <p className="text-xs text-gray-500 capitalize">{game.status}</p>
            </div>
          </button>
        ))}
      </div>
      {selectedGame && (
        // only show modal if game is selected
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          // setting to null closes the modal
        />
      )}
    </>
  );
}
