import React, { useState, useMemo } from "react";
import { X, Download, Loader2 } from "lucide-react";
import FileDisplay from "./FileDisplay";
import { createPortal } from "react-dom";
import { downloadSharedLink } from "../api/shareLinkApi";
import { getFolders } from "../api/explorerApi";
import toast from "react-hot-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { FileNode } from "../types/types";
import { useAppSelector } from "../../../store/store";

interface ImportSharedModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const ImportSharedModal: React.FC<ImportSharedModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const tree=useAppSelector(state=>state.explorer.tree)
 
  const { data: folders, isLoading: isFoldersLoading, error: foldersError } = useQuery({
    queryKey: ["workspaceFoldersOnly"],
    queryFn: () => getFolders(),
    enabled: isOpen,
  });


  const customTree = useMemo(() => {
    if (!folders) return undefined;

    return {
      id: "root",
      name: "PROJECT",
      type: "folder",
      isExpanded: true,
      children: folders as FileNode[],
    } as FileNode;
  }, [folders,tree]);

  if (!isOpen) return null;

  const handleImportHere = async () => {
    const destId = currentFolderId === "root" ? null : currentFolderId;
    setIsImporting(true);
    const loadingToast = toast.loading("Importing shared content to your workspace...");

    try {
      const result = await downloadSharedLink(token, destId);
      toast.dismiss(loadingToast);
      toast.success("Shared content imported successfully!");
      
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      await queryClient.invalidateQueries({ queryKey: ["chats"] });

      if (result.type === "chat") {
        navigate(`/${result.id}`);
      } else {
        navigate(`/`);
      }

      onClose();
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      let errMsg = "Failed to import shared content";
      if (err && typeof err === "object") {
        if ("response" in err) {
          const response = (err as { response: { data?: { message?: string } } }).response;
          if (response?.data?.message) {
            errMsg = response.data.message;
          }
        } else if ("message" in err) {
          errMsg = (err as { message: string }).message;
        }
      }
      toast.error(errMsg);
    } finally {
      setIsImporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
      <div className="bg-(--theme-bg-surface) border border-zinc-800 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Download size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">
                Import to Workspace
              </h2>
              <p className="text-sm text-zinc-500">
                Choose a destination folder in your workspace to save this shared content.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
            disabled={isImporting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Folder Browser */}
        <div className="flex-1 overflow-hidden min-h-0 bg-black/10 flex flex-col justify-center items-center">
          {isFoldersLoading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
              <span className="text-sm font-medium">Loading your workspace folder tree...</span>
            </div>
          ) : foldersError ? (
            <div className="text-red-400 text-sm font-medium">
              Failed to load workspace folders. Please try again.
            </div>
          ) : (
            <div className="w-full h-full">
              <FileDisplay
                isModal={true}
                currentFolderId={currentFolderId}
                onFolderChange={(folderId) => setCurrentFolderId(folderId)}
                showFoldersOnly={true}
                customTree={customTree}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex justify-end items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
            disabled={isImporting || isFoldersLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleImportHere}
            disabled={isImporting || isFoldersLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/80 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.5)]"
          >
            <Download size={16} />
            {isImporting ? "Importing..." : "Import Here"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
