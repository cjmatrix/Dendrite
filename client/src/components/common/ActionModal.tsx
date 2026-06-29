import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { createPortal } from "react-dom";
export type ActionModalVariant = "warning" | "confirmation";

interface ActionModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  variant?: ActionModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  title,
  description,
  variant = "confirmation",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  const isWarning = variant === "warning";

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-[92vw] max-w-md rounded-2xl border border-white/10 bg-[var(--theme-bg-base)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                isWarning
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {isWarning ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
              {description ? (
                <p className="text-xs text-zinc-400 mt-1">{description}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {children ? <div className="px-5 pt-4 text-sm text-zinc-300">{children}</div> : null}

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider text-zinc-300 border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all border disabled:opacity-50 ${
              isWarning
                ? "bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,document.body
  );
};
