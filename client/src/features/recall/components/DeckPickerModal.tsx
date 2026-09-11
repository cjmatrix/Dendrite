import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Layers,
  FolderOpen,
  Loader,
  Check,
} from "lucide-react";
import { getDecks, createDeck } from "../api/deckApi";
import type { Deck } from "../api/deckApi";

interface DeckPickerModalProps {
  isOpen: boolean;
  onSelect: (deckId: string | null) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DECK_COLORS = [
  "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4",
  "#10b981", "#f59e0b", "#ef4444", "#ec4899",
];

export const DeckPickerModal: React.FC<DeckPickerModalProps> = ({
  isOpen,
  onSelect,
  onCancel,
  isLoading = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DECK_COLORS[0]);
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading: isLoadingDecks } = useQuery({
    queryKey: ["decks"],
    queryFn: getDecks,
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
  });

  const createDeckMutation = useMutation({
    mutationFn: (params: { name: string; color: string }) =>
      createDeck(params.name, params.color),
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setIsCreating(false);
      setNewDeckName("");
      onSelect(newDeck._id);
    },
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewDeckName("");
      setSelectedColor(DECK_COLORS[0]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    createDeckMutation.mutate({ name: newDeckName.trim(), color: selectedColor });
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-[92vw] max-w-md rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-purple-500/30 bg-purple-500/10 text-purple-300">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">
                Choose a Deck
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Save this card to a deck for organized recall
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-3 py-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {/* All (No Deck) Option */}
          <button
            onClick={() => onSelect(null)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group text-left disabled:opacity-50"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 group-hover:border-zinc-500 group-hover:text-zinc-300 transition-all shrink-0">
              <FolderOpen size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                All (No Deck)
              </p>
              <p className="text-[11px] text-zinc-500">
                Save without assigning to any deck
              </p>
            </div>
            {isLoading && (
              <Loader size={14} className="animate-spin text-zinc-500" />
            )}
          </button>

          {/* Divider */}
          {(decks.length > 0 || isCreating) && (
            <div className="my-2 border-t border-white/5" />
          )}

          {/* Loading state */}
          {isLoadingDecks && (
            <div className="flex items-center justify-center py-6">
              <Loader size={18} className="animate-spin text-zinc-500" />
            </div>
          )}

          {/* Existing Decks */}
          {!isLoadingDecks &&
            decks.map((deck: Deck) => (
              <button
                key={deck._id}
                onClick={() => onSelect(deck._id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group text-left disabled:opacity-50"
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center border border-white/10 shrink-0 transition-all group-hover:scale-105"
                  style={{ backgroundColor: `${deck.color}20`, borderColor: `${deck.color}40` }}
                >
                  <Layers
                    size={16}
                    style={{ color: deck.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                    {deck.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-zinc-500 font-mono">
                    {deck.dueCardCount ?? 0} due
                  </span>
                </div>
              </button>
            ))}

          {/* Create New Deck - Inline Form */}
          {isCreating ? (
            <div className="mt-1 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateDeck();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewDeckName("");
                    }
                  }}
                  placeholder="Deck name..."
                  className="flex-1 bg-neutral-800/80 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-zinc-600 outline-none transition-all"
                  maxLength={100}
                />
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
                  Color
                </span>
                {DECK_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? "white" : "transparent",
                      boxShadow:
                        selectedColor === color
                          ? `0 0 8px ${color}60`
                          : "none",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewDeckName("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeck}
                  disabled={
                    !newDeckName.trim() || createDeckMutation.isPending
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-all shadow-lg shadow-purple-600/20"
                >
                  {createDeckMutation.isPending ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Create & Save
                </button>
              </div>

              {createDeckMutation.isError && (
                <p className="mt-2 text-xs text-rose-400">
                  {(createDeckMutation.error as Error)?.message ||
                    "Failed to create deck"}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-purple-500/5 transition-all group text-left mt-1"
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all shrink-0">
                <Plus size={16} />
              </div>
              <p className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                Create New Deck
              </p>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
