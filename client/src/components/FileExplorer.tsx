
import { useRef, useState, useEffect } from "react";
import { Plus, FolderPlus, MessageSquare, Check, Folder, ChevronLeft, Sparkles, Brain, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FileNode, FileType } from "../types/types";
import { FileItem } from "./FileItem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAppDispatch, useAppSelector } from "../store/store";
import { setTree, setActiveSidebarRootId, toggleExplorerModal } from "../store/explorerSlice";
import DendritesLogo from "./DendritesLogo";

export default function FileExplorer() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tree, activeSidebarRootId } = useAppSelector((state) => state.explorer);

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await api.get("/folders");
      return res.data.data;
    },
  });
  console.log("explorer rendrering")
  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data.data;
    },
  });

  const { data: recallCountData } = useQuery({
    queryKey: ["recallCount"],
    queryFn: async () => {
      const res = await api.get("/recall/count");
      return res.data.count;
    },
    
  });

  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const triggerAnimation = () => {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 1250);
    };

    window.addEventListener('recall:notification-pushed', triggerAnimation);
    return () => window.removeEventListener('recall:notification-pushed', triggerAnimation);
  }, []);

  const dispatch = useAppDispatch();


  const findNode = (node: FileNode, targetId: string): FileNode | null => {
    if (node.id === targetId) return node;
    if (!node.children) return null;
    
    for (const child of node.children) {
      const found = findNode(child, targetId);
      if (found) return found;
    }
    return null;
  };

  const displayTree = activeSidebarRootId ? findNode(tree, activeSidebarRootId) || tree : tree;

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
          contextParents: chat.contextParents || [],
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

  

  const [width, setWidth] = useState(380);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isResizing, setIsResizing] = useState(false);

  const [rootCreating, setRootCreating] = useState<FileType | null>(null);
  const [rootNewName, setRootNewName] = useState("");

  const [blankContextMenu, setBlankContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    if (isCollapsed) return; // don't resize when collapsed
    e.preventDefault();
    setIsResizing(true);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current && !isCollapsed) {
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
    onMutate: async ({ name, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const tempFolder = {
          id: `temp-${Date.now()}`,
          name,
          type: "folder",
          parentId: parentId,
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
          folderId: folderId,
          type: "chat",
        };
        
        const addChild = (nodes: any[]): any[] =>
          nodes.map((n: any) =>
            n.id === folderId
              ? { ...n, children: [...(n.children || []), tempChat] }
              : { ...n, children: n.children ? addChild(n.children) : [] },
          );
        return folderId ? addChild(old) : [...old, tempChat];
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
    const targetParentId = activeSidebarRootId ? activeSidebarRootId : null;

    if (rootNewName.trim()) {
      if (rootCreating === "folder") {
        createFolderMutate({ name: rootNewName, parentId: targetParentId });
      } else {
        createChatMutate({ title: rootNewName, folderId: targetParentId });
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
    <div className=" flex ">
      <div
        className="relative h-[100vh] z-40 flex items-center justify-center bg-neutral-950/70 border-2 border-zinc-900 "
        style={{ width: 50 }}
      >
        <button
          onClick={() => setIsCollapsed((s) => !s)}
          className=" absolute top-2 w-8 h-8 rounded-md text-zinc-200 flex items-center justify-center bg"
          title={isCollapsed ? "Open Explorer" : "Collapse Explorer"}
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>    
    
    <div
      ref={sidebarRef}
      style={{ width: `${isCollapsed ? 0 : width}px` }}
      className="relative h-screen  bg-neutral-950/70 border-r border-zinc-800/90 shrink-0 flex flex-col pt-0 z-20 shadow-2xl backdrop-blur-3xl"
    >
      {/* Collapse / Expand handle (20px wide) */}
   

      { !isCollapsed && (
        <>
      {/* Logo at the very top */}
      <div className="h-13 flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/40 bg-zinc-900/20 backdrop-blur-md">
        <DendritesLogo size={28} />
        <span className="text-[18px] font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-200 to-sky-200/40 drop-shadow-sm select-none">
          Dendrites
        </span>
      </div>

      {/* Header with action icons and prominent folder/project title */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="flex flex-col gap-0.5">
          {activeSidebarRootId && (
            <button
               onClick={() => dispatch(setActiveSidebarRootId(null))}
               className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 hover:text-cyan-400 transition-colors w-fit"
               title="Back to Root"
            >
               <ChevronLeft size={12} strokeWidth={3} /> BACK
            </button>
          )}
          <span className="truncate max-w-[160px] text-[10px] font-extrabold uppercase tracking-[0.15em] text-zinc-400/80">
            {activeSidebarRootId ? displayTree.name : "WORKSPACE"}
          </span>
        </h2>
        <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/50 shadow-inner">
          <button
            onClick={() => startRootCreate("chat")}
            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title="New Chat"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
          <div className="w-px h-3.5 bg-zinc-700/50 mx-0.5"></div>
          <button
            onClick={() => startRootCreate("folder")}
            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title="New Folder"
          >
            <FolderPlus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* File tree + blank area (right-clickable) */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700 scrollbar-track-transparent space-y-[2px]"
        onContextMenu={handleBlankContextMenu}
      >
        {displayTree.children?.map((child) => (
          <FileItem key={child.id} node={child} />
        ))}

        {/* Root-level inline input */}
        {rootCreating && (
          <div className="mx-3 mb-3 px-3 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black text-cyan-500/80 uppercase tracking-widest px-1">Initialising {rootCreating}...</span>
            <Sparkles size={10} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="flex-1 bg-black/40 border border-zinc-700/50 focus:border-cyan-500/50 rounded-lg text-[12.5px] font-medium text-white outline-none px-2.5 py-1.5 transition-all shadow-inner placeholder:text-zinc-600"
              placeholder={`Enter ${rootCreating} name...`}
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
              className="p-1 text-emerald-400 hover:text-white hover:bg-emerald-600/80 rounded transition-colors"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      )}
      </div>

     
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
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startRootCreate("chat");
                setBlankContextMenu(null);
              }}
            >
              <MessageSquare size={14} /> New Chat
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
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

      {/* Bottom Action Bar */}
      <div className="px-4 py-4 bg-zinc-900/40 border-t border-zinc-800/50 backdrop-blur-md relative z-10 before:absolute before:inset-0 before:bg-linear-to-t before:from-[#09090b] before:to-transparent before:-z-10">
        
        {/* Total Recall Count Label */}
       

        <button 
          onClick={() => navigate('/recall')}
          className=" relative group w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-linear-to-r from-purple-600/10 to-indigo-600/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-purple-400 hover:text-purple-300 transition-all border border-purple-500/20 hover:border-purple-400/50 text-[12px] font-bold shadow-[0_4px_20px_-10px_rgba(168,85,247,0.3)] hover:shadow-[0_4px_20px_-8px_rgba(168,85,247,0.5)] active:scale-[0.98] mb-2"
        >
          <Brain size={14} strokeWidth={2.5} className="text-purple-500 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all" />
          <p>Active Recall</p>
           <div className=" absolute right-4 top-2 flex items-center justify-between px-1 mb-2">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 ${shouldAnimate ? 'animate-bounce-pop border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}`}>
            <span className="text-[11px] font-black text-purple-300 tabular-nums">
              {recallCountData ?? 0}
            </span>
            <div className={`w-1 h-1 rounded-full bg-purple-500 ${shouldAnimate ? 'animate-pulse scale-150' : ''}`} />
          </div>
        </div>
        </button>
        
        <button 
          onClick={() => dispatch(toggleExplorerModal())}
          className="group w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-linear-to-r from-cyan-600/10 to-sky-600/10 hover:from-cyan-500/20 hover:to-sky-500/20 text-cyan-400 hover:text-cyan-300 transition-all border border-cyan-500/20 hover:border-cyan-400/50 text-[12px] font-bold shadow-[0_4px_20px_-10px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_20px_-8px_rgba(6,182,212,0.5)] active:scale-[0.98]"
        >
          <Folder size={14} strokeWidth={2.5} className="text-cyan-500 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all" />
          Full Explorer Center
        </button>
      </div>

        </>
      )}

      <div
        className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-cyan-500/50 z-30 transition-colors duration-300 delay-100"
        onMouseDown={startResizing}
      />
    </div>
    </div>
  );
}
