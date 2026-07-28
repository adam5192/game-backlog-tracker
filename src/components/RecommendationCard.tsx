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
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6 animate-pulse">
        <p className="text-sm text-gray-500">Finding your next game...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const current = recommendations[index];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
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
          <p className="text-xs text-gray-500 mb-1">Next up</p>
          <p className="text-lg font-medium text-gray-100">{current.name}</p>
          <p className="text-sm text-gray-400 mt-1">{current.reason}</p>
        </div>
      </div>
      <button
        className="text-xs text-gray-500 mt-3 underline disabled:opacity-50"
        onClick={handleShowAnother}
        disabled={refreshing}
      >
        {refreshing ? "Finding something else..." : "Show me something else"}
      </button>
    </div>
  );
}
