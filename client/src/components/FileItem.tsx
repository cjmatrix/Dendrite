import React, { useEffect, useState } from "react";
import type { FileNode, FileType } from "../types/types";
import {
  Folder,
  ChevronDown,
  MessageSquare,
  Plus,
  FolderPlus,
  Check,
  Edit,
  Trash,
  FileText,
  Image as ImageIcon,
  BookOpen,
  MessageCircle,
  GitBranch,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { setActiveSidebarRootId } from "../store/explorerSlice";
import { useAppDispatch } from "../store/store";

interface FileItemProps {
  node: FileNode;
}

export const FileItem: React.FC<FileItemProps> = React.memo(({ node }) => {
  const [isOpen, setIsOpen] = useState(node.isExpanded);
  const [isCreating, setIsCreating] = useState<FileType | null>(null);
  const [isRenaming, setIsRenaming] = useState<FileType | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");
  const navigate = useNavigate();
  const isFolder = node.type === "folder";
  const queryClient = useQueryClient();
  const dispatch=useAppDispatch();




  const { mutate: createFolderMutate } = useMutation({
    mutationFn: async ({
      name,
      parentId,
    }: {
      name: string;
      parentId: string | null;
    }) => {
      await api.post("/folders/create", { name, parentId });
    },
    onMutate: async ({ name, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const tempFolder = {
          id: `temp-${Date.now()}`,
          name,
          type: "folder",
          parentId,
          children: [],
          isExpanded: false,
        };

        const addChild = (nodes: any[]): any[] =>
          nodes.map((n: any) =>
            n.id === parentId
              ? { ...n, children: [...(n.children || []), tempFolder] }
              : { ...n, children: n.children ? addChild(n.children) : [] },
          );
        return parentId ? addChild(old) : [...old, tempFolder];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["folders"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });



  const { mutate: updateFolder } = useMutation({
    mutationFn: async ({
      folderId,
      updates,
    }: {
      folderId: string;
      updates: { name?: string; isExpanded?: boolean };
    }) => {
      await api.patch(`/folders/${folderId}`, updates);
    },
    onMutate: async ({ folderId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const updateNode = (nodes: any[]): any[] =>
          nodes.map((n: any) =>
            n.id === folderId
              ? { ...n, ...updates }
              : { ...n, children: n.children ? updateNode(n.children) : [] },
          );
        return updateNode(old);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["folders"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const { mutate: deleteFolderMutate } = useMutation({
    mutationFn: async (folderId: string) => {
      await api.delete(`/folders/${folderId}`);
    },
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const removeNode = (nodes: any[]): any[] =>
          nodes
            .filter((n: any) => n.id !== folderId)
            .map((n: any) => ({
              ...n,
              children: n.children ? removeNode(n.children) : [],
            }));
        return removeNode(old);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["folders"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

 

  const { mutate: createChatMutate } = useMutation({
    mutationFn: async ({
      title,
      folderId,
    }: {
      title: string;
      folderId: string | null;
    }) => {
      await api.post("/chats/create", { title, folderId });
    },
    onMutate: async ({ title, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        const tempChat = {
          _id: `temp-${Date.now()}`,
          title,
          folderId,
          type: "chat",
        };
        return [...old, tempChat];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["chats"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const { mutate: updateChat } = useMutation({
    mutationFn: async ({
      chatId,
      updates,
    }: {
      chatId: string;
      updates: { title?: string; folderId?: string | null };
    }) => {
      await api.patch(`/chats/${chatId}`, updates);
    },
    onMutate: async ({ chatId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.map((c: any) =>
          c._id === chatId ? { ...c, ...updates } : c,
        );
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["chats"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const { mutate: deleteChatMutate } = useMutation({
    mutationFn: async (chatId: string) => {
      await api.delete(`/chats/${chatId}`);
    },
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.filter((c: any) => c._id !== chatId);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["chats"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // --- Handlers ---

  const handleCreate = () => {
    if (newItemName.trim()) {
      if (isCreating === "folder") {
        createFolderMutate({ name: newItemName, parentId: node.id });
      } else {
        createChatMutate({ title: newItemName, folderId: node.id });
      }
      setNewItemName("");
      setIsCreating(null);
      setIsOpen(true);
    }
  };

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (isFolder) {
      updateFolder({ folderId: node.id, updates: { isExpanded: newState } });
    }
  };

  const handleRename = () => {
    if (renameItemName.trim() && renameItemName !== node.name) {
      if (isFolder) {
        updateFolder({ folderId: node.id, updates: { name: renameItemName } });
      } else {
        updateChat({ chatId: node.id, updates: { title: renameItemName } });
      }
    }
    setIsRenaming(null);
  };

  const handleDelete = () => {
    if (isFolder) {
      deleteFolderMutate(node.id);
    } else {
      deleteChatMutate(node.id);
    }
  };

  const handleRootSetting=()=>{
    dispatch(setActiveSidebarRootId(node.id));
  
  }

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!contextMenu) return;

    const close = () => setContextMenu(null);

    window.addEventListener("click", close);

    return () => window.removeEventListener("click", close);
  });

  const handleOpenWindow = (node: FileNode) => {
    if (node.type === "chat") {
      navigate(`/${node.id}`);
    }
  };

  return (
    <div className="select-none relative" onContextMenu={handleContextMenu}>
      <div className="group/item flex items-center justify-between py-1.25 px-2 mb-[1px] hover:bg-zinc-800/60 cursor-pointer text-zinc-400 hover:text-zinc-100 rounded-lg transition-all duration-200 border border-transparent hover:border-white/5">
        <div
          className={`${!isFolder && " -ml-3"} flex items-center gap-2 flex-1 min-w-0`}
          onClick={isFolder ? handleToggle : () => handleOpenWindow(node)}
        >
          {isFolder ? (
            <span className={`text-zinc-600 group-hover/item:text-zinc-400 transition-all duration-300 shrink-0 ${isOpen ? "rotate-0 text-cyan-500/80" : "-rotate-90"}`}>
               <ChevronDown size={13} strokeWidth={3} />
            </span>
          ) : (
            <span className="w-3" />
          )}

          {isFolder ? (
            node.isSystemFolder ? (() => {
              const getSystemStyle = () => {
                switch(node.name) {
                  case "Documents": return { color: "text-blue-400 text-opacity-90 fill-blue-500/10", suffix: <FileText size={7} className="text-blue-100" strokeWidth={3} />, suffixBg: "bg-blue-600" };
                  case "Media": return { color: "text-rose-400 text-opacity-90 fill-rose-500/10", suffix: <ImageIcon size={7} className="text-rose-100" strokeWidth={3} />, suffixBg: "bg-rose-600" };
                  case "Research": return { color: "text-amber-400 text-opacity-90 fill-amber-500/10", suffix: <BookOpen size={7} className="text-amber-100" strokeWidth={3} />, suffixBg: "bg-amber-600" };
                  case "Chats": return { color: "text-emerald-400 text-opacity-90 fill-emerald-500/10", suffix: <MessageCircle size={7} className="text-emerald-100" strokeWidth={3} />, suffixBg: "bg-emerald-600" };
                  default: return { color: "text-cyan-400", suffix: null, suffixBg: "" };
                }
              };
              const { color, suffix, suffixBg } = getSystemStyle();
              return (
                <div className="relative flex items-center justify-center transition-transform group-hover/item:scale-110 duration-200">
                  <Folder size={16} className={color} strokeWidth={2} />
                  {suffix && (
                    <div className={`absolute -bottom-[2px] -right-[2px] p-[2px] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-black/80 ${suffixBg} z-10 scale-[0.85]`}>
                      {suffix}
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="relative flex items-center justify-center transition-transform group-hover/item:scale-110 duration-200">
                <Folder size={16} className="text-cyan-500 fill-cyan-500/10 text-opacity-90" strokeWidth={2} />
              </div>
            )
          ) : (
            <div className="relative flex items-center justify-center px-0.5 transition-transform group-hover/item:scale-110 duration-200">
              <MessageSquare size={15} className="text-emerald-400/90 fill-emerald-500/10" strokeWidth={2} />
            </div>
          )}
          {isRenaming ? (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                className="bg-black/40 border border-cyan-500/50 focus:border-cyan-400 rounded-md text-[13px] font-medium text-gray-200 outline-none px-2 py-0.5 w-[130px] transition-all shadow-inner focus:shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)] placeholder:text-zinc-600"
                value={renameItemName}
                onChange={(e) => setRenameItemName(e.target.value)}
                onBlur={() => setIsRenaming(null)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
                className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-between min-w-0 pr-2">
              <div className={`text-[13px] tracking-wide truncate transition-colors group-hover/item:text-white font-medium`}>
                {node.name}
              </div>
              {!isFolder && (node.contextParents?.length || 0) > 0 && (
                <div 
                  className="flex items-center text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2 flex-shrink-0 border border-amber-500/20"
                  title={`${node.contextParents?.length} Inherited Contexts`}
                >
                  <GitBranch size={10} className="mr-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{node.contextParents?.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isFolder && (
          <div className="flex opacity-0 group-hover/item:opacity-100 items-center gap-0.5 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating("chat");
              }}
              className="p-1 hover:bg-zinc-700/60 rounded-md text-zinc-500 hover:text-emerald-400 transition-colors active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating("folder");
              }}
              className="p-1 hover:bg-zinc-700/60 rounded-md text-zinc-500 hover:text-cyan-400 transition-colors active:scale-95"
            >
              <FolderPlus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="ml-[22px] flex items-center gap-1.5 py-1.5 px-2 bg-black/30 rounded-lg border border-zinc-800/80 mb-1">
          <input
            autoFocus
            className="bg-black/40 border border-cyan-500/50 focus:border-cyan-400 rounded-md text-[13px] font-medium text-gray-200 outline-none px-2 py-0.5 w-[130px] transition-all shadow-inner focus:shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)] placeholder:text-zinc-600"
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
            className="p-1 shrink-0 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
      
      {isFolder && (
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="ml-[18px] pl-1.5 border-l border-zinc-800/80 hover:border-zinc-700/80 transition-colors mt-0.5 mb-1.5 space-y-[2px]">
              {node.children?.map((child) => (
                <FileItem key={child.id} node={child} />
              ))}
            </div>
          </div>
        </div>
      )}


      {contextMenu && (
        <>
          <div
            className=" fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          ></div>

          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 bg-[var(--theme-bg-surface)] border border-zinc-800 shadow-2xl rounded-xl py-1.5 w-48 text-sm text-gray-200 overflow-hidden"
          >
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating("chat");
                setContextMenu(null);
                setIsOpen(true);
              }}
            >
              <MessageSquare size={14} /> New Chat
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating("folder");
                setContextMenu(null);
                setIsOpen(true);
              }}
            >
              <FolderPlus size={14} /> New Folder
            </button>
             <button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRootSetting();
                setContextMenu(null);
                setIsOpen(true);
              }}
            >
              <FolderPlus size={14} /> Open With Folder
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-amber-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/graph/${node.id}`);
                setContextMenu(null);
              }}
            >
              <GitBranch size={14} /> Knowledge Graph
            </button>
            {!node.isSystemFolder && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming("folder");
                  setContextMenu(null);
                  setRenameItemName(node.name);
                }}
              >
                <Edit size={14} /> Rename
              </button>
            )}
            {node.id !== "root" && !node.isSystemFolder && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu(null);
                  handleDelete();
                }}
              >
                <Trash size={14} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
});
