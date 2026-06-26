import React, { useState, useEffect, useRef } from "react";
import { Folder, MessageSquare, Brain, Search, X, ChevronRight } from "lucide-react";
import { searchExplorer } from "../api/explorerApi";
import { useAppSelector } from "../../../store/store";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { useDebouncedValue } from "../../../components/common/useDebouncedValue";
import type { SearchItem, FileNode } from "../types/types";

interface SearchExplorerModalProps {
  onClose: () => void;
  initialFolderId?: string;
  onNavigate?: (type: "folder" | "chat" | "agent", id: string) => void;
}

export const SearchExplorerModal: React.FC<SearchExplorerModalProps> = ({
  onClose,
  initialFolderId,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "folder" | "chat" | "agent">("all");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tree = useAppSelector(state => state.explorer.tree);

  const debouncedQuery = useDebouncedValue(query, 500);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, typeFilter]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const data = await searchExplorer({
        q: searchQuery,
        type: typeFilter,
        folderId: initialFolderId,
      });
      setResults(data);
    } catch (err) {
      toast.error("Failed to perform search");   
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (item: SearchItem) => {
    if (item.type === "folder") {
      if (item.isSystemFolder) {
        let color = "text-cyan-400";
        if (item.name === "Documents") {
          color = "text-blue-400 text-opacity-90 fill-blue-500/10";
        } else if (item.name === "Media") {
          color = "text-rose-400 text-opacity-90 fill-rose-500/10";
        } else if (item.name === "Research") {
          color = "text-amber-400 text-opacity-90 fill-amber-500/10";
        } else if (item.name === "Chats") {
          color = "text-emerald-400 text-opacity-90 fill-emerald-500/10";
        }
        return <Folder size={16} className={color} strokeWidth={2} />;
      }
      return (
        <Folder
          size={16}
          className="text-cyan-500 fill-cyan-500/10 text-opacity-90"
          strokeWidth={2}
        />
      );
    }
    if (item.type === "agent") {
      return (
        <Brain
          size={15}
          className="text-amber-400 fill-amber-500/10"
          strokeWidth={2}
        />
      );
    }
    return (
      <MessageSquare
        size={15}
        className="text-emerald-400/90 fill-emerald-500/10"
        strokeWidth={2}
      />
    );
  };

  const handleSelect = (item: SearchItem) => {
    if (onNavigate) {
      onNavigate(item.type, item.id);
    }
    onClose();
  };

  const findNode = (node: FileNode, targetId: string): FileNode | null => {
    if (node.id === targetId) return node;
    for (const child of node.children || []) {
      const found = findNode(child, targetId);
      if (found) return found;
    }
    return null;
  };

  const initialFolderName = initialFolderId ? findNode(tree, initialFolderId)?.name : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header / Input */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
          <Search size={20} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={initialFolderName ? `Search in ${initialFolderName}...` : "Search folders, chats, and agents..."}
            className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["all", "folder", "chat", "agent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize ${
                typeFilter === t
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors text-left group"
                    title={item.breadcrumbs.map((b, index: number) => (
                            
                              b.name 
                         
                          )).join(" > ")}
                  >
                    <div className="mt-1 shrink-0 p-1.5 rounded-lg group-hover:bg-zinc-700 transition-colors flex items-center justify-center">
                      {getIconForType(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-200 font-medium truncate">
                        {item.name}
                      </div>
                      {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap text-xs text-zinc-500">
                          {item.breadcrumbs.map((b, index: number) => (
                            <React.Fragment key={b.id}>
                              <span className="truncate max-w-[100px]">{b.name}</span>
                              {index < item.breadcrumbs.length - 1 && (
                                <ChevronRight size={12} className="shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-8 text-center text-zinc-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Type to start searching...
            </div>
          )}
        </div>
      </div>
    </div>
  ,document.body);
};
