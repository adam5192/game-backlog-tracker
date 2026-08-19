"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, Globe, ArrowBigUp } from "lucide-react";
import Image from "next/image";

// shape of one of MY OWN lists, from GET /api/lists
type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  previewCovers: string[];
  gameCount: number;
  isPublic: boolean;
};

// shape of a PUBLIC list from someone else, different fields so kept as its own type
type PublicList = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  previewCovers: string[];
  voteCount: number;
};

export default function ListsPage() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // separate state for the public lists section
  const [publicLists, setPublicLists] = useState<PublicList[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicLoadError, setPublicLoadError] = useState(false);
  const [publicQuery, setPublicQuery] = useState("");

  // own function so the retry button can call it again too
  async function loadMyLists() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/lists");
      if (!res.ok) throw new Error("failed to load your lists");
      const data = await res.json();
      setLists(data.lists ?? []);
    } catch (err) {
      console.error("error loading your lists:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  // same idea but for public lists
  async function loadPublicLists(query?: string) {
    setPublicLoading(true);
    setPublicLoadError(false);
    try {
      const url = query
        ? `/api/lists/discover?q=${encodeURIComponent(query)}`
        : "/api/lists/discover";
      const res = await fetch(url);
      if (!res.ok) throw new Error("failed to load public lists");
      const data = await res.json();
      setPublicLists(data.lists ?? []);
    } catch (err) {
      console.error("error loading public lists:", err);
      setPublicLoadError(true);
    } finally {
      setPublicLoading(false);
    }
  }

  // load both sections once when the page first mounts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMyLists();
    loadPublicLists();
  }, []);

  async function handleCreate() {
    if (!newListName.trim()) {
      toast.error("Enter a name for your list");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
          isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong creating your list");
        return;
      }

      // grab this before resetting state below, since setIsPublic(true)
      // wont have "taken effect" yet by the time we check it after
      const wasPublic = isPublic;

      setNewListName("");
      setNewListDescription("");
      setIsPublic(true); // reset back to the default (public) for next time
      toast.success("List created");

      loadMyLists();
      if (wasPublic) {
        loadPublicLists(); // show it in the public section right away too
      }
    } catch (err) {
      console.error("error creating list:", err);
      toast.error("Something went wrong. Check your connection and try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-medium mb-6 text-foreground">Your lists</h1>

      {/* create list form */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex gap-2">
          <input
            className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg flex-1 border border-border-color focus:border-accent outline-none transition-colors"
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={handleCreate}
            disabled={creating}
          >
            <Plus size={16} />
            {creating ? "Creating..." : "Create list"}
          </button>
        </div>
        <input
          className="bg-surface-1 text-foreground placeholder-text-secondary px-4 py-2 rounded-lg border border-border-color focus:border-accent outline-none transition-colors text-sm"
          placeholder="Description (optional)"
          value={newListDescription}
          onChange={(e) => setNewListDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        {/* toggle for the list currently being created */}
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-accent"
          />
          Make this list public (anyone can find and view it)
        </label>
      </div>

      {/* your lists: loading / error / empty / real data, handle all 4 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-1 rounded-2xl p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-8 mb-12">
          <p className="text-text-secondary text-sm mb-3">
            Couldn&apos;t load your lists right now.
          </p>
          <button
            onClick={loadMyLists}
            className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : lists.length === 0 ? (
        <p className="text-text-secondary text-sm mb-12">
          You haven&apos;t made any lists yet. Create one above to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="bg-surface-1 border border-border-color rounded-2xl overflow-hidden hover:border-accent transition-colors"
            >
              {/* preview strip, only if the list actually has games */}
              {list.previewCovers.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-3 pb-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-3/4 relative bg-surface-2 rounded-lg overflow-hidden"
                    >
                      {list.previewCovers[i] && (
                        <Image
                          src={list.previewCovers[i]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-foreground font-medium">{list.name}</h3>
                  {/* little globe icon so its obvious which of my own lists are public */}
                  {list.isPublic && (
                    <span title="Public list">
                      <Globe size={12} className="text-text-secondary" />
                    </span>
                  )}
                </div>
                {list.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-1">
                    {list.description}
                  </p>
                )}
                <p className="text-xs text-text-secondary">
                  {list.gameCount} {list.gameCount === 1 ? "game" : "games"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* public lists section, totally separate from mine above */}
      <div className="border-t border-border-color pt-8">
        <h2 className="text-xl font-medium text-foreground mb-4">
          Discover public lists
        </h2>

        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <input
            className="bg-surface-1 text-foreground placeholder-text-secondary pl-9 pr-4 py-2 rounded-lg w-full border border-border-color focus:border-accent outline-none transition-colors"
            placeholder="Search public lists..."
            value={publicQuery}
            onChange={(e) => setPublicQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPublicLists(publicQuery)}
          />
        </div>

        {publicLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-1 rounded-2xl p-5 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : publicLoadError ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm mb-3">
              Couldn&apos;t load public lists right now.
            </p>
            <button
              onClick={() => loadPublicLists(publicQuery)}
              className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : publicLists.length === 0 ? (
          <p className="text-text-secondary text-sm">
            {publicQuery
              ? `No public lists found for "${publicQuery}".`
              : "No public lists yet. Be the first to make one public!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicLists.map((list) => (
              <div
                key={list.id}
                className="bg-surface-1 border border-border-color rounded-2xl overflow-hidden hover:border-accent transition-colors"
              >
                <Link href={`/lists/${list.id}`} className="block">
                  {list.previewCovers.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 p-3 pb-0">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-3/4 relative bg-surface-2 rounded-lg overflow-hidden"
                        >
                          {list.previewCovers[i] && (
                            <Image
                              src={list.previewCovers[i]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 pt-5">
                    <h3 className="text-foreground font-medium mb-1">
                      {list.name}
                    </h3>
                    <span className="text-xs text-text-secondary ml-auto flex items-center gap-1">
                      <ArrowBigUp size={12} /> {list.voteCount}
                    </span>
                    {list.description && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {list.description}
                      </p>
                    )}
                  </div>
                </Link>

                <Link
                  href={`/profile/${list.creatorId}`}
                  className="flex items-center gap-2 px-5 pb-5 pt-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-5 h-5 rounded-full bg-surface-2 relative overflow-hidden shrink-0">
                    {list.creatorAvatar && (
                      <Image
                        src={list.creatorAvatar}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="20px"
                      />
                    )}
                  </div>
                  <span className="text-xs text-text-secondary">
                    {list.creatorName}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
