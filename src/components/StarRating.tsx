"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export default function StarRatings({ value, onChange }: Props) {
  // tracks what the stars should display while hovering, preview rating before comitting
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  return (
    <div className="flex gap-1">
      {/* 5 stars each worth 2 pts */}
      {[1, 2, 3, 4, 5].map((star) => {
        const starValue = star * 2;
        const isFull = displayValue >= starValue;
        const isHalf =
          displayValue >= starValue - 1 && displayValue < starValue;
        return (
          <div key={star} className="relative w-6 h-6">
            {/* outline star sits underneath as the empty base layer */}
            <Star
              size={24}
              className="absolute inset-0 text-border-color"
              strokeWidth={1.5}
            />
            {/* filled star (or half) sits on top */}
            {(isFull || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: isFull ? "100%" : "50%" }}
              >
                <Star size={24} className="text-amber-400 fill-amber-400" />
              </div>
            )}
            {/* two invisible click zones stacked over the star 
                for half and full value */}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHoverValue(starValue - 1)}
              onMouseLeave={() => setHoverValue(null)}
              onClick={() => onChange(starValue - 1)}
              aria-label={`Rate ${starValue - 1} out of 10`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(null)}
              onClick={() => onChange(starValue)}
              aria-label={`Rate ${starValue} out of 10`}
            />
          </div>
        );
      })}
      {/* text next to the stars, so the exact value is
          always visible */}
      <span className="text-sm text-text-secondary ml-2 self-center">
        {value > 0 ? `${value}/10` : "Not rated"}
      </span>
    </div>
  );
}
