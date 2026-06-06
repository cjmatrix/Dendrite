import React, { useState, useEffect } from "react";
import { X, GitBranch, Calendar, RotateCcw, AlertCircle, Save, Check } from "lucide-react";
import type { FileNode } from "../types/types";
import toast from "react-hot-toast";
import { useFolderBehavior } from "../hooks/useFolderBehavior";
import { createPortal } from 'react-dom';
interface FolderBehaviorModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FileNode;
}

export const FolderBehaviorModal: React.FC<FolderBehaviorModalProps> = ({
  isOpen,
  onClose,
  folder,
}) => {
  const [content, setContent] = useState("");
  const [history, setHistory] = useState<Array<{ content: string; archivedAt: string }>>([]);
  const [inheritedBehavior, setInheritedBehavior] = useState<string | null>(null);
  const [inheritedFolderName, setInheritedFolderName] = useState<string | null>(null);

  console.log(folder)


  const { behaviorData, isLoading, isSaving, saveBehavior } = useFolderBehavior(folder.id, onClose);

  useEffect(() => {
    if (behaviorData) {
      setContent(behaviorData.currentBehavior.current?.content || "");
      setHistory(behaviorData.currentBehavior.history || []);
      setInheritedBehavior(behaviorData.parentBehavior?.parentContent)
      setInheritedFolderName(behaviorData.parentBehavior?.parentName)
    } else {
      setContent("");
      setHistory([]);
       setInheritedBehavior(null)
      setInheritedFolderName(null)
    }

  }, [behaviorData, folder.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveBehavior(content);
  };

  const handleSelectHistory = (historicalContent: string) => {
    setContent(historicalContent);
    toast.success("Restored behavior from history!", {
      duration: 2000,
      icon: "🔄",
      style: {
        background: "#18181b",
        color: "#e4e4e7",
        border: "1px solid #3f3f46",
        borderRadius: "12px",
      },
    });
  };

  return createPortal(
    
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transform scale-100 transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <GitBranch size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Folder Behavior Settings</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Define custom rules and system instructions for <span className="text-amber-400 font-medium">"{folder.name}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Behavior Input Area */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Folder Behavior Directive
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. You are an expert Python assistant. Provide high-performance code snippets and explain time/space complexity using Big O notation for every solution..."
              rows={6}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-zinc-200 outline-none p-4 transition-all resize-none shadow-inner placeholder:text-zinc-600"
            />
            <p className="text-xs text-zinc-500">
              Any chat sessions initiated or organized inside this folder will automatically prepend these instructions to the system directives.
            </p>
          </div>

          {/* Recursive Inheritance Notice */}
          {!content.trim() && (
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2.5">
              <div className="flex items-start gap-2.5 text-amber-400/90">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-300">Recursive Behavior Inheritance</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    No custom behavior is configured directly on this folder. It will fall back recursively to the nearest parent folder behavior.
                  </p>
                </div>
              </div>
              
              {inheritedBehavior ? (
                <div className="mt-2 text-xs border-t border-zinc-800/50 pt-2.5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Inherited from Parent: <span className="text-amber-500">"{inheritedFolderName}"</span>
                  </span>
                  <div className="bg-black/30 border border-zinc-900 text-zinc-400 p-3 rounded-lg max-h-24 overflow-y-auto italic whitespace-pre-wrap select-none">
                    {inheritedBehavior}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-zinc-600 italic block">
                  No parent behavior found. Default companion system instructions will be used.
                </div>
              )}
            </div>
          )}

          {/* Behavior History Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw size={13} className="text-zinc-500" />
              Behavior Archive / History ({history.length})
            </h4>
            
            {history.length === 0 ? (
              <p className="text-xs text-zinc-600 italic py-2 pl-1">
                No previous behaviors archived for this folder.
              </p>
            ) : (
              <div className="grid gap-2.5 max-h-60 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectHistory(item.content)}
                    className="p-3.5 bg-zinc-900/30 hover:bg-zinc-900/70 border border-zinc-800/50 hover:border-amber-500/20 rounded-xl cursor-pointer transition-all duration-200 group flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(item.archivedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px] text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-0.5">
                        Click to Restore <Check size={10} />
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 italic font-mono pl-1">
                      "{item.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-xl transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold text-xs rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <span className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save size={13} strokeWidth={2.5} />
            )}
            Save Behavior
          </button>
        </div>

      </div>
    </div>
  ,document.body);
};
