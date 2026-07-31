"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ConfirmDialog from "./ConfirmDialog";

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
  // local state for editable fields, starts pre-filled with whatever the game has saved already
  const [status, setStatus] = useState(game.status);
  const [rating, setRating] = useState(game.rating?.toString() ?? "");
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/games/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userGameId: game.userGameId,
        status,
        rating: rating ? parseFloat(rating) : null,
        notes,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error("Couldn't save your changes. Try again.");
      return;
    }

    toast.success("Changes saved");
    router.refresh(); // re-fetch the dashboard's server-side data
    onClose();
  }

  const [confirmingDelete, setConfirmingDelete] = useState(false); // added
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
      toast.error("Couldnt't remove this game. Try again.");
      return;
    }

    toast.success(`Removed ${game.name}`);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full overflow-hidden">
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
            className="absolute top-2 right-2 bg-gray-900 text-gray-100 rounded-full w-7 h-7"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-medium mb-2 text-gray-100">
            {game.name}
          </h2>

          {game.description && (
            <p className="text-sm text-gray-400 mb-4">{game.description}</p>
          )}

          <div
            className="grid grid-cols-3 gap-3 mb-4"
            title="A blended average of critic and user ratings from IGDB.com"
          >
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-500">IGDB rating</p>
              <p className="text-lg font-medium text-gray-100">
                {game.criticScore ?? "-"}
              </p>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Main Story</p>
              <p className="text-lg font-medium text-gray-100">
                {game.hltbMain ?? "-"}h
              </p>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Completionist</p>
              <p className="text-lg font-medium text-gray-100">
                {game.hltbCompletionist ?? "-"}h
              </p>
            </div>
          </div>

          <label className="text-sm mb-1 block text-gray-400">Status</label>
          <select
            className="border border-gray-700 bg-gray-800 p-2 w-full mb-3 text-gray-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="backlog">Backlog</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>

          <label className="text-sm mb-1 block text-gray-400">
            Your rating
          </label>
          <input
            className="border border-gray-700 bg-gray-800 p-2 w-full mb-3 text-gray-100"
            type="number"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />

          <label className="text-sm mb-1 block text-gray-400">Notes</label>
          <textarea
            className="border border-gray-700 bg-gray-800 p-2 w-full mb-4 text-gray-100"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="border px-4 py-2 w-full bg-gray-100 text-gray-900 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="border border-red-600 text-red-400 px-4 py-2 disabled:opacity-50"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving}
            >
              Remove
            </button>
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
      </div>
    </div>
  );
}
