"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Recommendation = {
  userGameId: string;
  name: string;
  coverUrl: string | null;
  reason: string;
};

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function RecommendationCard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [index, setIndex] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/recommendations");
      const data = await res.json();

      if (!cancelled) {
        setRecommendations(data.recommendations ?? []);
        setGeneratedAt(data.generatedAt ?? null);
        setIndex(0);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // how much time remains until a new refresh is allowed (used to disable the button or display try again later)
  const msSinceGenerated =
    generatedAt && now ? now - new Date(generatedAt).getTime() : 0;

  const canRefresh = msSinceGenerated >= REFRESH_COOLDOWN_MS;
  const hoursRemaining = Math.ceil(
    (REFRESH_COOLDOWN_MS - msSinceGenerated) / (60 * 60 * 1000),
  );

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(recommendations.length - 1, i + 1));
  }

  async function handleRefresh() {
    if (!canRefresh) return;

    setRefreshing(true);
    const res = await fetch("/api/recommendations?refresh=true");

    if (res.status === 429) {
      toast.error("Please wait a moment before trying again");
      setRefreshing(false);
      return;
    }

    const data = await res.json();
    setRecommendations(data.recommendations ?? []);
    setGeneratedAt(data.generatedAt ?? null);
    setIndex(0);
    setRefreshing(false);
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
      <div className="flex gap-3 items-center">
        {/* left arrow : disabled and dimmed at the start of the list */}
        <button
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous recommendation"
          className="text-text-secondary hover:text-foreground disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        {current.coverUrl && (
          <div className="w-16 h-20 relative shrink-0 rounded overflow-hidden">
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

        {/* right arrow : disabled and dimmed at the start of the list */}
        <button
          onClick={goNext}
          disabled={index === recommendations.length - 1}
          aria-label="Next recommendation"
          className="text-text-secondary hover:text-foreground disabled:opacity-30 disabled:hover:text-text-secondary transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground disabled:opacity-40 disabled:hover:text-text-secondary transition-colors mt-3"
        onClick={handleRefresh}
        disabled={!canRefresh || refreshing}
      >
        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        {refreshing
          ? "Refreshing..."
          : canRefresh
            ? "Get new recommendations"
            : `New picks available in ${hoursRemaining}h`}
      </button>
    </div>
  );
}
