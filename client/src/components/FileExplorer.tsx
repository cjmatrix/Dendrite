import { useRef, useState, useEffect } from "react";
import { Plus, FolderPlus, MessageSquare, Check } from "lucide-react";

import type { FileNode, FileType } from "../types/types";
import { FileItem } from "./FileItem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAppDispatch, useAppSelector } from "../store/store";
import { setTree } from "../store/explorerSlice";

export default function FileExplorer() {
  const queryClient = useQueryClient();

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await api.get("/folders");
      return res.data.data;
    },
  });

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data.data;
    },
  });

  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.explorer.tree);

  useEffect(() => {
    if (!folders) return;

    const folderNodes: FileNode[] = JSON.parse(JSON.stringify(folders));

    if (chats) {
      const rootChats: FileNode[] = [];

      for (const chat of chats) {
        const chatNode: FileNode = {
          id: chat._id,
          name: chat.title,
          type: "chat",
          isExpanded: false,
          children: [],
        };
        if (chat.folderId) {
          const addToFolder = (nodes: FileNode[]): boolean => {
            for (const node of nodes) {
              if (node.id === chat.folderId) {
                node.children = [...(node.children || []), chatNode];
                return true;
              }
              if (node.children && addToFolder(node.children)) return true;
            }
            return false;
          };
          addToFolder(folderNodes);
        } else {
          rootChats.push(chatNode);
        }
      }

      folderNodes.push(...rootChats);
    }
    dispatch(
      setTree({
        id: "root",
        name: "PROJECT",
        type: "folder",
        isExpanded: true,
        children: folderNodes,
      }),
    );
  }, [folders, chats]);
  const [width, setWidth] = useState(256);

  const [isResizing, setIsResizing] = useState(false);

  const [rootCreating, setRootCreating] = useState<FileType | null>(null);
  const [rootNewName, setRootNewName] = useState("");

  const [blankContextMenu, setBlankContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth =
        e.clientX - sidebarRef.current.getBoundingClientRect().left;

      if (newWidth > 150 && newWidth < 1280) {
        setWidth(newWidth);
      }
    }
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!blankContextMenu) return;
    const close = () => setBlankContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [blankContextMenu]);

  const startRootCreate = (type: FileType) => {
    setRootCreating(type);
    setRootNewName("");
  };

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
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const tempFolder = {
          id: `temp-${Date.now()}`,
          name,
          type: "folder",
          parentId: null,
          children: [],
          isExpanded: false,
        };
        return [...old, tempFolder];
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
    onMutate: async ({ title }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        const tempChat = {
          _id: `temp-${Date.now()}`,
          title,
          folderId: null,
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

  const handleRootCreate = () => {
    if (rootNewName.trim()) {
      if (rootCreating === "folder") {
        createFolderMutate({ name: rootNewName, parentId: null });
      } else {
        createChatMutate({ title: rootNewName, folderId: null });
      }
    }

    setRootCreating(null);
    setRootNewName("");
  };

  const handleBlankContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setBlankContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="relative h-screen bg-neutral-950 border-r border-zinc-900 flex-shrink-0 flex flex-col pt-2"
    >
      {/* Header with action icons */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase">
          Explorer
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => startRootCreate("chat")}
            className="p-1 text-gray-500 hover:text-gray-200 hover:bg-zinc-900 rounded transition-colors"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => startRootCreate("folder")}
            className="p-1 text-gray-500 hover:text-gray-200 hover:bg-zinc-900 rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      {/* File tree + blank area (right-clickable) */}
      <div
        className="flex-1 overflow-y-auto px-2"
        onContextMenu={handleBlankContextMenu}
      >
        {data.children?.map((child) => (
          <FileItem key={child.id} node={child} />
        ))}

        {/* Root-level inline input */}
        {rootCreating && (
          <div className="flex items-center gap-1 py-1 px-2 ml-4">
            {rootCreating === "folder" ? (
              <FolderPlus size={16} className="text-indigo-400 flex-shrink-0" />
            ) : (
              <MessageSquare
                size={16}
                className="text-emerald-400 flex-shrink-0"
              />
            )}
            <input
              autoFocus
              placeholder={
                rootCreating === "folder" ? "Folder name" : "Chat name"
              }
              className="bg-[var(--theme-bg-surface)] border border-indigo-500/50 focus:border-indigo-500 rounded text-[15px] text-gray-200 outline-none px-2 py-0.5 w-[140px] transition-colors"
              value={rootNewName}
              onChange={(e) => setRootNewName(e.target.value)}
              onBlur={() => {
                setRootCreating(null);
                setRootNewName("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRootCreate();
                if (e.key === "Escape") {
                  setRootCreating(null);
                  setRootNewName("");
                }
              }}
            />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleRootCreate();
              }}
              className="p-1 text-gray-500 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Blank-area context menu */}
      {blankContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setBlankContextMenu(null)}
          />
          <div
            style={{ top: blankContextMenu.y, left: blankContextMenu.x }}
            className="fixed z-50 bg-[var(--theme-bg-surface)] border border-zinc-800 shadow-2xl rounded-xl py-1.5 w-48 text-sm text-gray-200 overflow-hidden"
          >
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startRootCreate("chat");
                setBlankContextMenu(null);
              }}
            >
              <MessageSquare size={14} /> New Chat
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startRootCreate("folder");
                setBlankContextMenu(null);
              }}
            >
              <FolderPlus size={14} /> New Folder
            </button>
          </div>
        </>
      )}

      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 bg-zinc-800 z-10 transition-colors duration-200"
        onMouseDown={startResizing}
      />
    </div>
  );
}
