"use client";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-surface-1 border border-border-color rounded-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mb-6">{description}</p>
        )}
        <div className="flex gap-2">
          <button
            className="text-sm px-4 py-2 rounded-full flex-1 text-text-secondary hover:text-foreground hover:bg-surface-2 transition-colors border border-border-color"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="text-sm px-4 py-2 rounded-full flex-1 bg-danger/10 text-danger border border-danger hover:bg-danger/20 transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
