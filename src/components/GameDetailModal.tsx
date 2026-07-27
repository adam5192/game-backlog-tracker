"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

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
    await fetch(`/api/games/update`, {
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
    router.refresh(); // re-fetch the dashboard's server-side data
    onClose();
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Remove ${game.name} from your list?`);
    if (!confirmed) return;

    setSaving(true);
    await fetch("/api/games/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userGameId: game.userGameId }),
    });
    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        <div className="aspect-video bg-gray-200 relative">
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
            className="absolute top-2 right-2 bg-white rounded-full w-7 h-7"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-medium mb-2 text-gray-900">
            {game.name}
          </h2>

          {game.description && (
            <p className="text-sm text-gray-600 mb-4">{game.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-100 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Critic score</p>
              <p className="text-lg font-medium text-gray-900">
                {game.criticScore ?? "-"}
              </p>
            </div>
            <div className="bg-gray-100 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Main Story</p>
              <p className="text-lg font-medium text-gray-900">
                {game.hltbMain ?? "-"}h
              </p>
            </div>
            <div className="bg-gray-100 rounded p-3 text-center">
              <p className="text-xs text-gray-500">Completionist</p>
              <p className="text-lg font-medium text-gray-900">
                {game.hltbCompletionist ?? "-"}h
              </p>
            </div>
          </div>

          <label className="text-sm mb-1 block text-gray-700">Status</label>
          <select
            className="border p-2 w-full mb-3 text-gray-900"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="backlog">Backlog</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>

          <label className="text-sm mb-1 block text-gray-700">
            Your rating
          </label>
          <input
            className="border p-2 w-full mb-3 text-gray-900"
            type="number"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />

          <label className="text-sm mb-1 block text-gray-800">Notes</label>
          <textarea
            className="border p-2 w-full mb-4 text-gray-900"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="border px-4 py-2 w-full bg-black tet-white disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="border border-red-600 text-red-600 px-4 py-2 disabled:opacity:50"
              onClick={handleDelete}
              disabled={saving}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
