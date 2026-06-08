import React, { useState } from "react";
import { X, Move } from "lucide-react";
import FileDisplay from "./FileDisplay";
import { createPortal } from "react-dom";
interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToMove: {
    id: string;
    name: string;
    type: "chat" | "folder";
    parentId?: string | null;
  };
  onMove: (destinationFolderId: string | null) => void;
}

export const MoveItemModal: React.FC<MoveItemModalProps> = ({
  isOpen,
  onClose,
  itemToMove,
  onMove,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");

  if (!isOpen) return null;

  const handleMoveHere = () => {
    const destId = currentFolderId === "root" ? null : currentFolderId;
    onMove(destId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]">
              <Move size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Move {itemToMove.type === "chat" ? "Chat" : "Folder"}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Moving <span className="text-zinc-300 font-semibold">"{itemToMove.name}"</span>. Choose a destination folder below.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

       
        <div className="flex-1 overflow-y-auto min-h-0 bg-black/10">
          <FileDisplay
            isModal={true}
            currentFolderId={currentFolderId}
            onFolderChange={(folderId) => setCurrentFolderId(folderId)}
            showFoldersOnly={true}
            excludeFolderId={itemToMove.type === "folder" ? itemToMove.id : undefined}
          />
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleMoveHere}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_4px_20px_-10px_rgba(6,182,212,0.5)]"
          >
            Move Here
          </button>
        </div>

      </div>
    </div>,document.body
  );
};
