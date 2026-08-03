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
        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-100 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 mb-6">{description}</p>
        )}
        <div className="flex gap-2">
          <button
            className="text-sm px-4 py-2 rounded-full flex-1 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors border border-gray-800"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="text-sm px-4 py-2 rounded-full flex-1 bg-red-500/10 text-red-400 border border-red-900 hover:bg-red-500/20 transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
