import React, { useEffect, useState } from "react";
import type { FileNode, FileType } from "../types/types";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Plus,
  FolderPlus,
  Check,
  Edit,
  Trash,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

interface FileItemProps {
  node: FileNode;
}

export const FileItem: React.FC<FileItemProps> = ({ node }) => {
  const [isOpen, setIsOpen] = useState(node.isExpanded);
  const [isCreating, setIsCreating] = useState<FileType | null>(null);
  const [isRenaming, setIsRenaming] = useState<FileType | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");
  const navigate = useNavigate();
  const isFolder = node.type === "folder";
  const queryClient = useQueryClient();

  // --- Folder mutations with optimistic updates ---

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

  // --- Chat mutations with optimistic updates ---

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
    <div className="select-none" onContextMenu={handleContextMenu}>
      <div className="group flex items-center justify-between py-1 px-2 hover:bg-zinc-900 cursor-pointer text-gray-200 rounded-md transition-colors">
        <div
          className={`${!isFolder && " -ml-4"} flex items-center gap-2 flex-1`}
          onClick={handleToggle}
        >
          {isFolder ? (
            <span className="text-gray-500">
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          ) : (
            <span className="w-4" />
          )}

          {isFolder ? (
            <Folder size={19} className="text-indigo-400" />
          ) : (
            <MessageSquare size={19} className="text-emerald-400" />
          )}
          {isRenaming ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                className="bg-[var(--theme-bg-surface)] border border-indigo-500/50 focus:border-indigo-500 rounded text-[15px] text-gray-200 outline-none px-2 py-0.5 w-[140px] transition-colors"
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
                className="p-1 text-gray-500 hover:text-emerald-400 hover:bg-[var(--theme-bg-elevated)] rounded transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div
              className={`text-[15px] truncate w-full`}
              onClick={(e) => {
                if (!isFolder) {
                  e.stopPropagation();
                  handleOpenWindow(node);
                }
              }}
            >
              {node.name}
            </div>
          )}
        </div>

        {isFolder && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={() => setIsCreating("chat")}
              className="p-1 hover:bg-[var(--theme-bg-elevated)] text-gray-500"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setIsCreating("folder")}
              className="p-1 hover:bg-[var(--theme-bg-elevated)] text-gray-500"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="ml-6 flex items-center gap-1 py-1 px-2">
          <input
            autoFocus
            className="bg-[var(--theme-bg-surface)] border border-indigo-500/50 focus:border-indigo-500 rounded text-[15px] text-gray-200 outline-none px-2 py-0.5 w-[140px] transition-colors"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={() => setIsCreating(null)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="p-1 text-gray-500 hover:text-emerald-400 hover:bg-[var(--theme-bg-elevated)] rounded transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      )}
      {isFolder && isOpen && node.children && (
        <div className="ml-4 border-l border-zinc-800">
          {node.children.map((child) => (
            <FileItem key={child.id} node={child} />
          ))}
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
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
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
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
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
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming("folder");
                setContextMenu(null);
                setRenameItemName(node.name);
              }}
            >
              <Edit size={14} /> Rename
            </button>
            {node.id !== "root" && (
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
};
