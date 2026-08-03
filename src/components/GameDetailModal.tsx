"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ConfirmDialog from "./ConfirmDialog";
import StarRating from "./StarRating";

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

type Props = {
  game: GameDetail;
  onClose: () => void;
};

export default function GameDetailModal({ game, onClose }: Props) {
  const [status, setStatus] = useState(game.status);
  const [rating, setRating] = useState(game.rating ?? 0);
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/games/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userGameId: game.userGameId,
        status,
        rating: rating > 0 ? rating : null,
        notes,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error("Couldn't save your changes. Try again.");
      return;
    }

    toast.success("Changes saved");
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    setSaving(true);
    const res = await fetch("/api/games/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userGameId: game.userGameId }),
    });
    setSaving(false);
    setConfirmingDelete(false);

    if (!res.ok) {
      toast.error("Couldn't remove this game. Try again.");
      return;
    }

    toast.success(`Removed ${game.name}`);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full overflow-hidden">
        <div className="aspect-video bg-gray-800 relative">
          {(game.artworkUrl ?? game.coverUrl) && (
            <Image
              src={game.artworkUrl ?? game.coverUrl ?? ""}
              alt={game.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-900/80 text-gray-100 flex items-center justify-center hover:bg-gray-900 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-medium mb-2 text-gray-100">
            {game.name}
          </h2>

          {game.description && (
            <p className="text-sm text-gray-400 mb-5">{game.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div
              className="bg-gray-800/60 rounded-xl p-3 text-center"
              title="A blended average of critic and user ratings from IGDB.com"
            >
              <p className="text-xs text-gray-500 mb-1">IGDB rating</p>
              <p className="text-lg font-medium text-gray-100">
                {game.criticScore ?? "—"}
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Main story</p>
              <p className="text-lg font-medium text-gray-100">
                {game.hltbMain ?? "—"}h
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Completionist</p>
              <p className="text-lg font-medium text-gray-100">
                {game.hltbCompletionist ?? "—"}h
              </p>
            </div>
          </div>

          <label className="text-sm text-gray-400 block mb-1.5">Status</label>
          <select
            className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg w-full border border-gray-700 focus:border-gray-600 outline-none transition-colors mb-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="backlog">Backlog</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>

          <label className="text-sm text-gray-400 block mb-2">
            Your rating
          </label>
          <div className="mb-4">
            <StarRating value={rating} onChange={setRating} />
          </div>

          <label className="text-sm text-gray-400 block mb-1.5">Notes</label>
          <textarea
            className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg w-full border border-gray-700 focus:border-gray-600 outline-none transition-colors mb-5 resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="text-sm px-4 py-2 rounded-full flex-1 bg-gray-100 text-gray-900 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              className="text-sm px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-900 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Remove ${game.name}?`}
        description="This will remove it from your list. This can't be undone."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
