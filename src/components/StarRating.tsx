"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export default function StarRatings({ value, onChange }: Props) {
  // tracks what the stars should display while hovering, preview rating before comitting
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="flex gap-1" onMouseLeave={() => setHoverValue(null)}>
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
              onClick={() => onChange(starValue - 1)}
              aria-label={`Rate ${starValue - 1} out of 10`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHoverValue(starValue)}
              onClick={() => onChange(starValue)}
              aria-label={`Rate ${starValue} out of 10`}
            />
          </div>
        );
      })}

      {/* only show the clear button once there's actually something to clear */}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          aria-label="Clear rating"
          className="ml-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
