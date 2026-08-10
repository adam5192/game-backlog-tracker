"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { X, Plus, Search, Pencil, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableGameCard from "@/components/SortableGameCard";

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

// simplified game shape used by the library grid and search results
type PickableGame = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  artworkUrl?: string | null;
  description?: string | null;
  releaseDate?: string | null;
  criticScore?: number | null;
  genres?: string[];
};

export default function ListDetailPage() {
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [games, setGames] = useState<ListGame[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [library, setLibrary] = useState<PickableGame[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PickableGame[]>([]);
  const [searching, setSearching] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // tracks which ids are alr in this list, so we can show its already added
  const inListIds = new Set(games.map((g) => g.igdbId));

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

  // fetch the users library, reusing the dashboard data (lazy-loaded when the add games panel is opened)
  async function loadLibrary() {
    if (library.length > 0) return; //already loaded
    setLibraryLoading(true);
    const res = await fetch("/api/games/library");
    const data = await res.json();
    setLibrary(data.games ?? []);
    setLibraryLoading(false);
  }

  function toggleAddPanel() {
    const next = !showAddPanel;
    setShowAddPanel(next);
    if (next) loadLibrary();
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(
      `/api/games/search?q=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setSearching(false);
  }

  async function handleAddGame(game: PickableGame) {
    const res = await fetch(`/api/lists/${listId}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(game),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't add this game");
      return;
    }

    // refetch the list so the new game shows up with a real id/position
    const listRes = await fetch(`/api/lists/${listId}`);
    const listData = await listRes.json();
    setGames(listData.games ?? []);
    toast.success(`Added ${game.name}`);
  }

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

  // PointerSensor handles both mouse and touch drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // if dropped outside any valid target, or dropped back on itself, do nothing
    if (!over || active.id === over.id) return;

    const oldIndex = games.findIndex((g) => g.listGameId === active.id);
    const newIndex = games.findIndex((g) => g.listGameId === over.id);

    // arrayMove: returns a new array with the updated index
    const reordered = arrayMove(games, oldIndex, newIndex);

    // update local state immediately
    setGames(reordered);

    // new order stored to database
    const order = reordered.map((g, index) => ({
      listGameId: g.listGameId,
      position: index,
    }));

    const res = await fetch(`/api/lists/${listId}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!res.ok) {
      toast.error("Couldn't save the new order");
      // revert to old state if it is rejected
      setGames(games);
    }
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
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-medium text-foreground">{list.name}</h1>
        <button
          onClick={toggleAddPanel}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          {showAddPanel ? "Done adding" : "Add games"}
        </button>
      </div>
      {list.description && (
        <p className="text-text-secondary text-sm mb-6">{list.description}</p>
      )}

      {showAddPanel && (
        <div className="bg-surface-1 border border-border-color rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-medium text-foreground mb-3">
            Your library
          </h2>
          {libraryLoading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : library.length === 0 ? (
            <p className="text-sm text-text-secondary mb-4">
              Nothing in your library yet, search below instead.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5 max-h-64 overflow-y-auto">
              {library.map((game) => (
                <PickableCard
                  key={game.igdbId}
                  game={game}
                  alreadyAdded={inListIds.has(game.igdbId)}
                  onAdd={() => handleAddGame(game)}
                />
              ))}
            </div>
          )}

          <h2 className="text-sm font-medium text-foreground mb-3">
            Search for more games
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              className="bg-surface-2 text-foreground placeholder-text-secondary px-3 py-1.5 rounded-lg flex-1 border border-border-color focus:border-accent outline-none transition-colors text-sm"
              placeholder="Search IGDB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="text-sm px-4 py-1.5 rounded-full border border-border-color text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              <Search size={14} />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {searchResults.map((game) => (
                <PickableCard
                  key={game.igdbId}
                  game={game}
                  alreadyAdded={inListIds.has(game.igdbId)}
                  onAdd={() => handleAddGame(game)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {games.length === 0 ? (
        <p className="text-text-secondary text-sm">
          No games in this list yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={games.map((g) => g.listGameId)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
              {games.map((game) => (
                <SortableGameCard
                  key={game.listGameId}
                  id={game.listGameId}
                  name={game.name}
                  coverUrl={game.coverUrl}
                  onRemove={() => handleRemove(game.gameId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// small shared card used by both the library grid and search results
// shows a checkmark overlay instead of an add button once already added
function PickableCard({
  game,
  alreadyAdded,
  onAdd,
}: {
  game: PickableGame;
  alreadyAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      disabled={alreadyAdded}
      className="relative aspect-3/4 rounded-lg overflow-hidden bg-surface-2 disabled:cursor-default"
      title={
        alreadyAdded ? `${game.name} (already in list)` : `Add ${game.name}`
      }
    >
      {game.coverUrl && (
        <Image
          src={game.coverUrl}
          alt={game.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      )}
      {alreadyAdded && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">
          ✓
        </div>
      )}
    </button>
  );
}
