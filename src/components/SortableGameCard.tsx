"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: string;
  name: string;
  coverUrl: string | null;
  onRemove: () => void;
  onClick: () => void;
};

export default function SortableGameCard({
  id,
  name,
  coverUrl,
  onRemove,
  onClick,
}: Props) {
  // useSortable allows for drag and drop with the sortable list
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // dim the card being dragged for visual feedback
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // spreading attributes/listeners onto the whole card makes the entire card draggable
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="relative group cursor-grab active:cursor-grabbing"
    >
      <div className="aspect-3/4 bg-surface-1 rounded-lg overflow-hidden relative">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 16vw"
          />
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // dont let this click also trigger a drag
          onRemove();
        }}
        aria-label={`Remove ${name}`}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface-2/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
      <p className="text-xs text-foreground mt-1.5 truncate">{name}</p>
    </div>
  );
}
