import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/store';
import { Folder, MessageSquare, ChevronRight, MessageCircle, FolderPlus, Edit, Trash, Check, Sparkles, Brain, Component, Database, Cpu } from 'lucide-react';
import type { FileNode, FileType } from '../types/types';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { setActiveSidebarRootId } from '../store/explorerSlice';

export default function FileDisplay() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.explorer.tree);
  const queryClient = useQueryClient();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode | null } | null>(null);
  const [isCreating, setIsCreating] = useState<FileType | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");

  const { currentFolder, path } = useMemo(() => {
    let target = tree;
    let currentPath: FileNode[] = [{ ...tree, id: 'root', name: 'Root' }];

    if (folderId && folderId !== 'root') {
      const dfs = (node: FileNode, targetId: string, currentPathBranch: FileNode[]): { found: FileNode | null, path: FileNode[] } => {
        if (node.id === targetId) return { found: node, path: [...currentPathBranch, node] };
        if (!node.children) return { found: null, path: [] };
        
        for (const child of node.children) {
          const res = dfs(child, targetId, [...currentPathBranch, node]);
          if (res.found) return res;
        }
        return { found: null, path: [] };
      };
      
      const result = dfs(tree, folderId, []);
      if (result.found) {
        target = result.found;
        currentPath = result.path;
      }
    }
    
    if (target.id === 'root') {
        currentPath = [{ ...tree, id: 'root', name: 'Root' }];
    } else {
        if (currentPath[0]) {
            currentPath[0] = { ...currentPath[0], name: 'Root' };
        }
    }

    return { currentFolder: target, path: currentPath };
  }, [tree, folderId]);

  // --- Folder mutations with optimistic updates ---
  const { mutate: createFolderMutate } = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string | null; }) => {
      await api.post("/folders/create", { name, parentId });
    },
    onMutate: async ({ name, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const tempFolder = { id: `temp-${Date.now()}`, name, type: "folder", parentId, children: [], isExpanded: false };
        const addChild = (nodes: any[]): any[] => nodes.map((n: any) => n.id === parentId ? { ...n, children: [...(n.children || []), tempFolder] } : { ...n, children: n.children ? addChild(n.children) : [] });
        return parentId ? addChild(old) : [...old, tempFolder];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["folders"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["folders"] }); },
  });

  const { mutate: updateFolder } = useMutation({
    mutationFn: async ({ folderId, updates }: { folderId: string; updates: { name?: string; isExpanded?: boolean }; }) => {
      await api.patch(`/folders/${folderId}`, updates);
    },
    onMutate: async ({ folderId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const updateNode = (nodes: any[]): any[] => nodes.map((n: any) => n.id === folderId ? { ...n, ...updates } : { ...n, children: n.children ? updateNode(n.children) : [] });
        return updateNode(old);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["folders"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["folders"] }); },
  });

  const { mutate: deleteFolderMutate } = useMutation({
    mutationFn: async (folderId: string) => { await api.delete(`/folders/${folderId}`); },
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const removeNode = (nodes: any[]): any[] => nodes.filter((n: any) => n.id !== folderId).map((n: any) => ({ ...n, children: n.children ? removeNode(n.children) : [] }));
        return removeNode(old);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["folders"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["folders"] }); },
  });

  // --- Chat mutations with optimistic updates ---
  const { mutate: createChatMutate } = useMutation({
    mutationFn: async ({ title, folderId }: { title: string; folderId: string | null; }) => {
      await api.post("/chats/create", { title, folderId });
    },
    onMutate: async ({ title, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return [...old, { _id: `temp-${Date.now()}`, title, folderId, type: "chat" }];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["chats"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["chats"] }); },
  });

  const { mutate: updateChat } = useMutation({
    mutationFn: async ({ chatId, updates }: { chatId: string; updates: { title?: string; folderId?: string | null }; }) => {
      await api.patch(`/chats/${chatId}`, updates);
    },
    onMutate: async ({ chatId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.map((c: any) => c._id === chatId ? { ...c, ...updates } : c);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["chats"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["chats"] }); },
  });

  const { mutate: deleteChatMutate } = useMutation({
    mutationFn: async (chatId: string) => { await api.delete(`/chats/${chatId}`); },
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.filter((c: any) => c._id !== chatId);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(["chats"], context.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["chats"] }); },
  });

  // --- Handlers ---
  const handleCreate = () => {
    if (newItemName.trim()) {
      const activeId = currentFolder.id === 'root' ? null : currentFolder.id;
      if (isCreating === "folder") {
        createFolderMutate({ name: newItemName, parentId: activeId });
      } else {
        createChatMutate({ title: newItemName, folderId: activeId });
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
    if (contextMenu?.node) {
      if (contextMenu.node.type === "folder") {
        deleteFolderMutate(contextMenu.node.id);
      } else {
        deleteChatMutate(contextMenu.node.id);
      }
    }
    setContextMenu(null);
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node: null });
  };

  const handleNodeContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => { 
        // Only close if we aren't actively renaming inline
        if (!isRenaming) setContextMenu(null); 
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu, isRenaming]);

  return (
    <div 
      className="h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-(--theme-bg-surface) to-(--theme-bg-base) text-gray-200 flex flex-col pt-8 px-8 overflow-y-auto"
      onContextMenu={handleBackgroundContextMenu}
    >
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-10 bg-zinc-900/40 p-4 px-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md" onContextMenu={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-linear-to-br from-indigo-500/20 to-purple-600/20 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]">
            <Cpu size={22} className="text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-indigo-400/80 uppercase mb-0.5">Dendrites Workspace</span>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-300 tracking-tight">
              {path.map((node, index) => (
                <React.Fragment key={index}>
                  <span 
                    onClick={() => navigate(node.id === 'root' ? '/explorer' : `/explorer/${node.id}`)}
                    className={`cursor-pointer hover:text-white transition-colors ${index === path.length - 1 ? 'text-white drop-shadow-md' : 'text-zinc-500'}`}
                  >
                    {node.name}
                  </span>
                  {index < path.length - 1 && <ChevronRight size={18} className="text-zinc-700 mx-1" strokeWidth={2.5} />}
                </React.Fragment>
              ))}
            </h2>
          </div>
        </div>
      </div>

      {/* Grid view */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-x-6 gap-y-10 pb-12 px-2">
        
        {/* Inline Create Input Card */}
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-zinc-700/50 rounded transition-colors"
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {currentFolder.children && currentFolder.children.length > 0 ? (
           currentFolder.children.map(child => {
            const isFolder = child.type === 'folder';
            
            // Premium Badge logic for system folders
            let color = "text-indigo-400 fill-indigo-500/10 text-opacity-80";
            let suffix = null;
            let suffixBg = "";
            let IconComponent = Folder;
            let iconSize = 64;
            
            if (isFolder && child.isSystemFolder) {
               switch(child.name) {
                  case "Documents": 
                    color = "text-blue-400 text-opacity-90 fill-blue-500/10"; 
                    suffix = <Database size={14} className="text-blue-100" strokeWidth={2.5} />; 
                    suffixBg = "bg-blue-600"; 
                    break;
                  case "Media": 
                    color = "text-rose-400 text-opacity-90 fill-rose-500/10"; 
                    suffix = <Component size={14} className="text-rose-100" strokeWidth={2.5} />; 
                    suffixBg = "bg-rose-600"; 
                    break;
                  case "Research": 
                    color = "text-amber-400 text-opacity-90 fill-amber-500/10"; 
                    suffix = <Brain size={14} className="text-amber-100" strokeWidth={2.5} />; 
                    suffixBg = "bg-amber-600"; 
                    break;
                  case "Chats": 
                    color = "text-emerald-400 text-opacity-90 fill-emerald-500/10"; 
                    suffix = <MessageCircle size={14} className="text-emerald-100" strokeWidth={2.5} />; 
                    suffixBg = "bg-emerald-600"; 
                    break;
                  default: 
                    color = "text-indigo-400"; 
                    break;
               }
            }
            
            const isBeingRenamed = isRenaming === child.id;
            
            return (
              <div 
                key={child.id} 
                className="group flex flex-col items-center gap-4 p-4 rounded-2xl hover:bg-white/3 cursor-pointer transition-all duration-300 border border-transparent hover:border-white/10 hover:shadow-2xl hover:-translate-y-1 relative"
                onClick={() => !isBeingRenamed && (isFolder ? navigate(`/explorer/${child.id}`) : navigate(`/${child.id}`))}
                onContextMenu={(e) => handleNodeContextMenu(e, child)}
              >
                <div className="relative flex items-center justify-center p-2">
                  {isFolder ? (
                    <>
                      <IconComponent size={iconSize} className={color + " transition-transform duration-300 group-hover:scale-105"} strokeWidth={1} />
                      {suffix && (
                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-xl shadow-lg border border-white/20 ${suffixBg} z-10 animate-in zoom-in duration-300`}>
                           {suffix}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative flex items-center justify-center p-3.5 rounded-[1.25rem] bg-linear-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 transition-all duration-300 group-hover:scale-105">
                      <Sparkles size={16} className="absolute -top-1.5 -right-1.5 text-emerald-400 opacity-80 animate-pulse" />
                      <MessageSquare size={44} className="text-emerald-400" strokeWidth={1.5} />
                    </div>
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleRename(child);
                        }}
                        className="p-1 flex-shrink-0 text-gray-400 hover:text-emerald-400 hover:bg-zinc-700/50 rounded transition-colors"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                  </div>
                ) : (
                  <span className="text-[13px] font-medium text-center truncate w-full px-1 text-zinc-300 drop-shadow-md">
                     {child.name}
                  </span>
                )}
              </div>
            );
          })
        ) : (!isCreating) && (
          <div className="col-span-full flex flex-col items-center justify-center mt-20 text-gray-500">
             <div className="bg-zinc-900/40 p-8 rounded-full mb-4 border border-zinc-800/50">
                <Folder size={48} className="text-zinc-700" strokeWidth={1} />
             </div>
             <p className="text-sm">This folder is empty</p>
             <p className="text-xs mt-2 italic text-zinc-600">Right-click anywhere to create files</p>
          </div>
        )}
      </div>

      {/* Context Menu Modal Overlay */}
      {contextMenu && (
        <>
          <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-50 bg-[var(--theme-bg-surface)] border border-zinc-800 shadow-2xl rounded-xl py-1.5 w-52 text-sm text-gray-200 overflow-hidden">
            {contextMenu.node ? (
              /* Context Menu For SPECIFIC Files / Folders */
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
                
                {contextMenu.node.id !== "root" && !contextMenu.node.isSystemFolder && (
                 <button className="w-full text-left px-3 py-2 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                   <Trash size={15} /> Delete
                 </button>
                )}
              </>
            ) : (
              /* Context Menu For BACKGROUND */
              <>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreating("chat"); setContextMenu(null); }}>
                  <MessageSquare size={15} /> New Chat
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreating("folder"); setContextMenu(null); }}>
                  <FolderPlus size={15} /> New Folder
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
