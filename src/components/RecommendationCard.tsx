"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Recommendation = {
  userGameId: string;
  name: string;
  coverUrl: string | null;
  reason: string;
};

export default function RecommendationCard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchRecommendations(forceRefresh = false) {
    const res = await fetch(
      `/api/recommendations${forceRefresh ? "?refresh=true" : ""}`,
    );
    const data = await res.json();
    setRecommendations(data.recommendations ?? []);
    setIndex(0); // reset to the first one whenever we get a new set
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/recommendations");
      const data = await res.json();

      if (!cancelled) {
        setRecommendations(data.recommendations ?? []);
        setIndex(0);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleShowAnother() {
    if (index < recommendations.length - 1) {
      setIndex(index + 1);
    } else {
      setRefreshing(true);
      const res = await fetch("/api/recommendations?refresh=true");
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
      setIndex(0);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface-1 border border-border-color rounded-lg p-4 mb-6 animate-pulse">
        <p className="text-sm text-text-secondary">Finding your next game...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-surface-2 border border-border-color rounded-2xl p-4 mb-6">
        <p className="text-sm text-text-secondary">
          Rate a few completed games and add something to your backlog to unlock
          personalized recommendations.
        </p>
      </div>
    );
  }

  const current = recommendations[index];

  return (
    <div className="bg-surface-1 border border-border-color rounded-lg p-4 mb-6">
      <div className="flex gap-4 items-center">
        {current.coverUrl && (
          <div className="w-16 h-20 relative flex-shrink-0 rounded overflow-hidden">
            <Image
              src={current.coverUrl}
              alt={current.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-text-secondary mb-1">Next up</p>
          <p className="text-lg font-medium text-foreground">{current.name}</p>
          <p className="text-sm text-text-secondary mt-1">{current.reason}</p>
        </div>
      </div>
      <button
        className="text-xs text-text-secondary mt-3 underline disabled:opacity-50"
        onClick={handleShowAnother}
        disabled={refreshing}
      >
        {refreshing ? "Finding something else..." : "Show me something else"}
      </button>
    </div>
  );
}
