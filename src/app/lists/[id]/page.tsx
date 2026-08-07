"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { X } from "lucide-react";

type ListGame = {
  listGameId: string;
  gameId: string;
  igdbId: number;
  name: string;
  coverUrl: string | null;
  position: number;
};

type ListDetail = {
  id: string;
  name: string;
  description: string | null;
};

export default function ListDetailPage() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [games, setGames] = useState<ListGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/lists/${listId}`);
      const data = await res.json();
      if (!cancelled) {
        setList(data.list ?? null);
        setGames(data.games ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  async function handleRemove(gameId: string) {
    const res = await fetch(`/api/lists/${listId}/games/${gameId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Couldn't remove this game");
      return;
    }

    setGames((prev) => prev.filter((g) => g.gameId !== gameId));
    toast.success("Removed from list");
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-text-secondary text-sm">
        Loading...
      </div>
    );
  }

  if (!list) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-text-secondary text-sm">
        List not found.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-medium text-foreground mb-1">{list.name}</h1>
      {list.description && (
        <p className="text-text-secondary text-sm mb-6">{list.description}</p>
      )}

      {games.length === 0 ? (
        <p className="text-text-secondary text-sm">
          No games in this list yet. (Search and add-to-list UI coming next.)
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {games.map((game) => (
            <div key={game.listGameId} className="relative group">
              <div className="aspect-3/4 bg-surface-1 rounded-lg overflow-hidden relative">
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
              <button
                onClick={() => handleRemove(game.gameId)}
                aria-label={`Remove ${game.name}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface-2/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <p className="text-xs text-foreground mt-1.5 truncate">
                {game.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
