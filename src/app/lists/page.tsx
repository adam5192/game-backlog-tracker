"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type ListSummary = {
  id: string;
  name: string;
  description: string | null;
};

export default function ListsPage() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/lists");
      const data = await res.json();
      if (!cancelled) {
        setLists(data.lists ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!newListName.trim()) {
      toast.error("Enter a name for your list");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong creating your list");
      return;
    }

    const data = await res.json();
    setLists((prev) => [...prev, data.list]);
    setNewListName("");
    toast.success("List created");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-medium mb-6 text-foreground">Your lists</h1>

      <div className="flex gap-2 mb-8">
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
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-1 rounded-2xl p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <p className="text-text-secondary text-sm">
          You haven&apos;t made any lists yet... create one above to get
          started.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="bg-surface-1 border border-border-color rounded-2xl p-5 hover:border-accent transition-colors"
            >
              <h3 className="text-foreground font-medium mb-1">{list.name}</h3>
              {list.description && (
                <p className="text-sm text-text-secondary line-clamp-2">
                  {list.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
