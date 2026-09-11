import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Layers, Loader, Check } from "lucide-react";
import { createDeck } from "../api/deckApi";
import type { Deck } from "../api/deckApi";
import toast from "react-hot-toast";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated?: (deck: Deck) => void;
}

export const DECK_COLORS = [
  "#8b5cf6", // Purple
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#ec4899", // Pink
];

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
  onDeckCreated,
}) => {
  const [deckName, setDeckName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DECK_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset and auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setDeckName("");
      setSelectedColor(DECK_COLORS[0]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const createMutation = useMutation({
    mutationFn: (params: { name: string; color: string }) =>
      createDeck(params.name, params.color),
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      toast.success(`Deck "${newDeck.name}" created!`);
      onDeckCreated?.(newDeck);
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create deck";
      setError(msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = deckName.trim();
    if (!trimmed) {
      setError("Please enter a deck name");
      return;
    }
    setError(null);
    createMutation.mutate({ name: trimmed, color: selectedColor });
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100">
                Create New Deck
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Organize your recall cards into a dedicated deck
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Deck Name Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Deck Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={deckName}
              onChange={(e) => {
                setDeckName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Python Basics, System Design, Algorithms"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-gray-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1.5">{error}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
              Deck Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110"
                      : "opacity-80 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && (
                    <Check size={14} className="text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
              Badge Preview
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{
                backgroundColor: `${selectedColor}15`,
                borderColor: `${selectedColor}30`,
                color: selectedColor,
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="truncate max-w-[200px]">
                {deckName.trim() || "Deck Name"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!deckName.trim() || createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white shadow-lg shadow-purple-600/20 transition-all"
            >
              {createMutation.isPending ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Deck"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
