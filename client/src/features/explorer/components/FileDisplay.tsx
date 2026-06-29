import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../store/store';
import { Folder, MessageSquare, ChevronRight, MessageCircle, FolderPlus, Edit, Trash, Check, Sparkles, Brain, Component, Database, Cpu, X, Move } from 'lucide-react';
import type { FileNode } from '../types/types';
import { setActiveSidebarRootId, toggleExplorerModal } from '../store/explorerSlice';


import { useFileItemMutations } from '../hooks/useFileItemMutations';
import { useFileDisplayTree } from '../hooks/useFileDisplayTree';
import { MoveItemModal } from './MoveItemModal';
import { ActionModal } from '../../../components/common/ActionModal';

export default function FileDisplay({
  isModal = false,
  onSelect,
  currentFolderId,
  onFolderChange,
  showFoldersOnly = false,
  excludeFolderId,
  customTree
}: {
  isModal?: boolean,
  onSelect?: (node: FileNode) => void,
  currentFolderId?: string | null,
  onFolderChange?: (folderId: string) => void,
  showFoldersOnly?: boolean,
  excludeFolderId?: string,
  customTree?: FileNode
}) {
  const { folderId: routeFolderId } = useParams();
  const [localFolderId, setLocalFolderId] = useState<string | null>(currentFolderId || 'root');

  useEffect(() => {
    if (currentFolderId) {
      setLocalFolderId(currentFolderId);
    }
  }, [currentFolderId]);

  const activeFolderId = isModal ? localFolderId : routeFolderId;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const reduxTree = useAppSelector(state => state.explorer.tree);
  const tree = customTree || reduxTree;

  const { currentFolder, path } = useFileDisplayTree(tree, activeFolderId);
  const { createFolder, updateFolder, deleteFolder, createChat, updateChat, deleteChat } = useFileItemMutations();


  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode | null } | null>(null);
  const [isCreating, setIsCreating] = useState<"chat" | "folder" | "agent" | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<FileNode | null>(null);
  const [showAllCrumbs, setShowAllCrumbs] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileNode | null>(null);


  const handleCreate = () => {
    if (newItemName.trim()) {
      const activeId = currentFolder.id === 'root' ? null : currentFolder.id;
      if (isCreating === "folder") {
        createFolder({ name: newItemName, parentId: activeId });
      } else if (isCreating === "agent") {
        createChat({ title: newItemName, folderId: activeId, type: "agent" });
      } else {
        createChat({ title: newItemName, folderId: activeId });
      }
      setNewItemName("");
      setIsCreating(null);
    }
  };

  const handleRename = (node: FileNode) => {
    if (renameItemName.trim() && renameItemName !== node.name) {
      if (node.type === "folder") {
        updateFolder({ folderId: node.id, updates: { name: renameItemName } });
      } else {
        updateChat({ chatId: node.id, updates: { title: renameItemName } });
      }
    }
    setIsRenaming(null);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === "folder") {
        deleteFolder(itemToDelete.id);
      } else {
        deleteChat(itemToDelete.id);
      }
    }
    setItemToDelete(null);
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuWidth = 208; 
    const menuHeight = 130; 
    const x = e.clientX + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 10) : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 10) : e.clientY;
    setContextMenu({ x, y, node: null });
  };

  const handleNodeContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 208; 
    const menuHeight = 220; 
    const x = e.clientX + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 10) : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 10) : e.clientY;
    setContextMenu({ x, y, node });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => { if (!isRenaming) setContextMenu(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu, isRenaming]);

  
  return (
    <div
      className={`h-full text-gray-200 flex flex-col overflow-y-auto custom-scrollbar ${isModal ? "p-6 bg-transparent" : "pt-8 px-8 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-(--theme-bg-surface) to-(--theme-bg-base)"}`}
      onContextMenu={(isModal && !!onSelect) ? undefined : handleBackgroundContextMenu}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6 sm:mb-10 bg-zinc-900/40 p-3 sm:p-4 px-4 sm:px-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md" onContextMenu={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="p-2 sm:p-2.5 bg-linear-to-br from-indigo-500/20 to-purple-600/20 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)] shrink-0">
            <Cpu size={20} className="text-indigo-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400/80 uppercase mb-0.5">Dendrites Workspace</span>

            {/* Desktop: full breadcrumb path always visible */}
            <h2 className="hidden sm:flex text-xl font-semibold items-center gap-2 text-gray-300 tracking-tight flex-wrap">
              {path.map((node, index) => (
                <React.Fragment key={index}>
                  <span
                    onClick={() => {
                      if (isModal) {
                        const nextId = node.id === 'root' ? 'root' : node.id;
                        setLocalFolderId(nextId);
                        if (onFolderChange) onFolderChange(nextId);
                      } else {
                        navigate(node.id === 'root' ? '/explorer' : `/explorer/${node.id}`);
                      }
                    }}
                    className={`cursor-pointer hover:text-white transition-colors ${index === path.length - 1 ? 'text-white drop-shadow-md' : 'text-zinc-500'}`}
                  >
                    {node.name}
                  </span>
                  {index < path.length - 1 && <ChevronRight size={18} className="text-zinc-700 mx-1" strokeWidth={2.5} />}
                </React.Fragment>
              ))}
            </h2>

            {/* Mobile: current folder + clickable "…" to expand */}
            <div className="flex sm:hidden items-center gap-1.5 min-w-0">
              {path.length > 1 && (
                <button
                  onClick={() => setShowAllCrumbs(prev => !prev)}
                  className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-200 px-1.5 py-0.5 rounded-lg hover:bg-zinc-800/60 transition-all text-sm font-semibold shrink-0"
                  title="Show full path"
                >
                  <span>…</span>
                  <ChevronRight size={12} className={`text-zinc-600 transition-transform duration-200 ${showAllCrumbs ? 'rotate-90' : ''}`} />
                </button>
              )}
              <span className="text-base font-semibold text-white tracking-tight truncate">
                {path[path.length - 1]?.name || 'Workspace'}
              </span>
            </div>
          </div>
        </div>

        {isModal && !onSelect && (
          <button
            onClick={() => dispatch(toggleExplorerModal())}
            className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all ml-auto shrink-0"
            title="Close Explorer"
          >
            <X size={20} />
          </button>
        )}

        {/* Mobile breadcrumb dropdown */}
        {showAllCrumbs && path.length > 1 && (
          <div className="sm:hidden absolute top-full left-0 right-0 mt-2 z-30 bg-zinc-900/95 backdrop-blur-xl border border-white/5 rounded-2xl px-3 py-2 flex flex-col gap-0.5 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            {/* Dismiss overlay */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowAllCrumbs(false)} />
            {path.slice(0, -1).map((node, i) => (
              <button
                key={node.id}
                onClick={() => {
                  if (isModal) {
                    const nextId = node.id === 'root' ? 'root' : node.id;
                    setLocalFolderId(nextId);
                    if (onFolderChange) onFolderChange(nextId);
                  } else {
                    navigate(node.id === 'root' ? '/explorer' : `/explorer/${node.id}`);
                  }
                  setShowAllCrumbs(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 transition-all text-left group"
              >
                <span className="text-zinc-600 text-xs">{i + 1}.</span>
                <Folder size={14} className="text-zinc-500 group-hover:text-indigo-300 transition-colors shrink-0" />
                <span className="text-zinc-300 group-hover:text-white font-medium text-sm transition-colors">{node.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-6 gap-y-10 pb-12 px-2">

        {/* Inline Create Card */}
        {isCreating && (
          <div className="flex flex-col items-center gap-3 p-3 rounded-xl border border-indigo-500/50 bg-zinc-800/50 shadow-lg">
            <div className="relative flex items-center justify-center p-2">
              {isCreating === "folder" ? (
                <Folder size={64} className="text-indigo-400 fill-indigo-500/5 text-opacity-80" strokeWidth={1} />
              ) : (
                <MessageSquare size={54} className="text-emerald-400/90 fill-emerald-500/10" strokeWidth={1} />
              )}
            </div>
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                className="bg-(--theme-bg-base) border border-indigo-500/50 focus:border-indigo-500 rounded text-[13px] text-gray-200 outline-none px-2 py-1 w-full transition-colors text-center"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={() => setIsCreating(null)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Name..."
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
                className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-zinc-700/50 rounded transition-colors"
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {currentFolder.children && currentFolder.children.length > 0 ? (
          currentFolder.children
            .filter(child => {
              if (showFoldersOnly && child.type !== 'folder') return false;
              if (excludeFolderId && child.id === excludeFolderId) return false;
              return true;
            })
            .map(child => {
            const isFolder = child.type === 'folder';

            // Badge styling for system folders
            let color = "text-indigo-400 fill-indigo-500/10 text-opacity-80";
            let suffix = null;
            let suffixBg = "";
            const IconComponent = Folder;
            const iconSize = 64;

            if (isFolder && child.isSystemFolder) {
              switch (child.name) {
                case "Documents": color = "text-blue-400 text-opacity-90 fill-blue-500/10"; suffix = <Database size={14} className="text-blue-100" strokeWidth={2.5} />; suffixBg = "bg-blue-600"; break;
                case "Media": color = "text-rose-400 text-opacity-90 fill-rose-500/10"; suffix = <Component size={14} className="text-rose-100" strokeWidth={2.5} />; suffixBg = "bg-rose-600"; break;
                case "Research": color = "text-amber-400 text-opacity-90 fill-amber-500/10"; suffix = <Brain size={14} className="text-amber-100" strokeWidth={2.5} />; suffixBg = "bg-amber-600"; break;
                case "Chats": color = "text-emerald-400 text-opacity-90 fill-emerald-500/10"; suffix = <MessageCircle size={14} className="text-emerald-100" strokeWidth={2.5} />; suffixBg = "bg-emerald-600"; break;
                default: color = "text-indigo-400"; break;
              }
            }

            const isBeingRenamed = isRenaming === child.id;

            return (
              <div
                key={child.id}
                className="group flex flex-col items-center gap-4 p-4 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors duration-150 border border-transparent hover:border-white/10 relative"
                onClick={() => {
                  if (isBeingRenamed) return;
                  if (isFolder) {
                    if (isModal) {
                      setLocalFolderId(child.id);
                      if (onFolderChange) onFolderChange(child.id);
                    } else { navigate(`/explorer/${child.id}`); }
                  } else {
                    if (isModal && onSelect) { onSelect(child); }
                    else if (isModal && !onSelect) { dispatch(toggleExplorerModal()); navigate(`/${child.id}`); }
                    else { navigate(`/${child.id}`); }
                  }
                }}
                onContextMenu={(isModal && onSelect) ? undefined : (e) => handleNodeContextMenu(e, child)}
              >
                <div className="relative flex items-center justify-center p-2">
                  {isFolder ? (
                    <>
                      <IconComponent size={iconSize} className={color} strokeWidth={1} />
                      {suffix && (
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg border border-white/20 ${suffixBg} z-10`}>
                          {suffix}
                        </div>
                      )}
                    </>
                  ) : (
                    child.chatType === "agent" ? (
                      <div className={`relative flex items-center justify-center ${isModal ? "p-2.5" : "p-3.5"} rounded-[1.25rem] bg-linear-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/25`}>
                        <Brain size={16} className={`absolute -top-1.5 -right-1.5 text-amber-400 opacity-80 ${isModal ? "hidden" : ""}`} />
                        <Brain size={isModal ? 32 : 44} className="text-amber-400" strokeWidth={1.5} />
                      </div>
                    ) : (
                      <div className={`relative flex items-center justify-center ${isModal ? "p-2.5" : "p-3.5"} rounded-[1.25rem] bg-linear-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20`}>
                        <Sparkles size={16} className={`absolute -top-1.5 -right-1.5 text-emerald-400 opacity-80 ${isModal ? "hidden" : ""}`} />
                        <MessageSquare size={isModal ? 32 : 44} className="text-emerald-400" strokeWidth={1.5} />
                      </div>
                    )
                  )}
                </div>

                {isBeingRenamed ? (
                  <div className="flex items-center gap-1 w-full bg-black/40 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      className="bg-(--theme-bg-base) border border-indigo-500/50 focus:border-indigo-500 rounded text-[13px] text-gray-200 outline-none px-2 py-1 flex-1 min-w-0 transition-colors text-center"
                      value={renameItemName}
                      onChange={(e) => setRenameItemName(e.target.value)}
                      onBlur={() => { setIsRenaming(null); setContextMenu(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(child)}
                    />
                    <button
                      onMouseDown={(e) => { e.preventDefault(); handleRename(child); }}
                      className="p-1 flex-shrink-0 text-gray-400 hover:text-emerald-400 hover:bg-zinc-700/50 rounded transition-colors"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <span className="text-[13px] font-medium text-center  w-full px-1 text-zinc-300 drop-shadow-md">
                    {child.name}
                  </span>
                )}
              </div>
            );
          })
        ) : (!isCreating && !(isModal && onSelect)) && (
          <div className="col-span-full flex flex-col items-center justify-center mt-20 text-gray-500">
            <div className="bg-zinc-900/40 p-8 rounded-full mb-4 border border-zinc-800/50">
              <Folder size={48} className="text-zinc-700" strokeWidth={1} />
            </div>
            <p className="text-sm">This folder is empty</p>
            <p className="text-xs mt-2 italic text-zinc-600">Right-click anywhere to create files</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-50 bg-[var(--theme-bg-surface)] border border-zinc-800 shadow-2xl rounded-xl py-1.5 w-52 text-sm text-gray-200 overflow-hidden">
            {contextMenu.node ? (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 border-b border-white/5 truncate">
                  {contextMenu.node.name}
                </div>
                {contextMenu.node.type === "folder" && (
                  <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); dispatch(setActiveSidebarRootId(contextMenu.node!.id)); setContextMenu(null); }}>
                    <FolderPlus size={15} /> Open With Folder
                  </button>
                )}
                {!contextMenu.node.isSystemFolder && (
                  <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsRenaming(contextMenu.node!.id); setRenameItemName(contextMenu.node!.name); setContextMenu(null); }}>
                    <Edit size={15} /> Rename
                  </button>
                )}
                {contextMenu.node.id !== "root" && !contextMenu.node.isSystemFolder && contextMenu.node.type === "chat" && (
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setItemToMove(contextMenu.node); setIsMoveOpen(true); setContextMenu(null); }}
                  >
                    <Move size={15} /> Move
                  </button>
                )}
                {contextMenu.node.id !== "root" && !contextMenu.node.isSystemFolder && (
                <button
                  className="w-full text-left px-3 py-2 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 text-red-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(contextMenu.node);
                    setContextMenu(null);
                  }}
                >
                  <Trash size={15} /> Delete
                </button>
                )}
              </>
            ) : (
              <>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreating("chat"); setContextMenu(null); }}>
                  <MessageSquare size={15} /> New Chat
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreating("agent"); setContextMenu(null); }}>
                  <MessageSquare size={15} /> New Agent Chat
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreating("folder"); setContextMenu(null); }}>
                  <FolderPlus size={15} /> New Folder
                </button>
              </>
            )}
          </div>
        </>
      )}
      {isMoveOpen && itemToMove && (
        <MoveItemModal
          isOpen={isMoveOpen}
          onClose={() => { setIsMoveOpen(false); setItemToMove(null); }}
          itemToMove={{
            id: itemToMove.id,
            name: itemToMove.name,
            type: itemToMove.type,
          }}
          onMove={(destFolderId) => {
            if (itemToMove.type === "folder") {
              updateFolder({ folderId: itemToMove.id, updates: { parentId: destFolderId } });
            } else {
              updateChat({ chatId: itemToMove.id, updates: { folderId: destFolderId } });
            }
          }}
        />
      )}
      <ActionModal
        isOpen={itemToDelete !== null}
        title={`Delete ${itemToDelete?.type === "folder" ? "Folder" : "Chat"}`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        variant="warning"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
