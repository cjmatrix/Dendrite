import React, { useEffect, useState } from "react";
import type { FileNode, FileType } from "../types/types";
import {
  Folder,
  ChevronDown,
  MessageSquare,
  FolderPlus,
  Check,
  Edit,
  Trash,
  FileText,
  Image as ImageIcon,
  BookOpen,
  MessageCircle,
  GitBranch,
  Move,
  Share,
  Brain,
  Search,
  ArrowUpRight,
  MoreVertical,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { setActiveSidebarRootId } from "../store/explorerSlice";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { setIsExpandedTracker } from "../store/explorerSlice";

import { useFileItemMutations } from "../hooks/useFileItemMutations";
import { FolderBehaviorModal } from "./FolderBehaviorModal";
import { MoveItemModal } from "./MoveItemModal";
import { ShareLinkModal } from "./ShareLinkModal";
import { ActionModal } from "../../../components/common/ActionModal";

interface FileItemProps {
  node: FileNode;
}

export const FileItem: React.FC<FileItemProps> = React.memo(({ node }) => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => {
    const v = state.explorer.isExpandedTracker[node.id];
    return v !== undefined ? v : !!node.isExpanded;
  });
  const isShareMode = useAppSelector((state) => state.explorer.isShareMode);
  const [isCreating, setIsCreating] = useState<
    "chat" | "folder" | "agent" | null
  >(null);
  const [isRenaming, setIsRenaming] = useState<FileType | null>(null);
  const [isBehaviorOpen, setIsBehaviorOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");
  const navigate = useNavigate();
  const isFolder = node.type === "folder";
  const isChat = node.type === "chat";
  const { id: activeChatId } = useParams<{ id?: string }>();
  const isSelected =
    !isFolder && node.type === "chat" && node.id === activeChatId;
  const isAgent = node.chatType === "agent";

  const {
    createFolder,
    updateFolder,
    deleteFolder,
    createChat,
    updateChat,
    deleteChat,
  } = useFileItemMutations();

  const handleCreate = () => {
    if (newItemName.trim()) {
      if (isCreating === "folder") {
        createFolder({ name: newItemName, parentId: node.id });
      } else if (isCreating === "agent") {
        createChat({ title: newItemName, folderId: node.id, type: "agent" });
      } else {
        createChat({ title: newItemName, folderId: node.id });
      }
      setNewItemName("");
      setIsCreating(null);
      if (!isOpen) dispatch(setIsExpandedTracker(node.id));
    }
  };

  const handleToggle = () => {
    if (isFolder) {
      dispatch(setIsExpandedTracker(node.id));
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
      deleteFolder(node.id);
    } else {
      deleteChat(node.id);
    }
    setIsDeleteModalOpen(false);
  };

  const { token } = useParams<{ token?: string }>();
  const handleOpenWindow = (node: FileNode) => {
    if (node.type === "chat") {
      if (isShareMode && token) {
        navigate(`/share/${token}/chat/${node.id}`);
      } else {
        navigate(`/${node.id}`);
      }
    }
  };

  const handleRootSetting = () => {
    dispatch(setActiveSidebarRootId(node.id));
  };

  const isPending = String(node.id).startsWith("temp-");

  const handleRowClick = () => {
    if (isRenaming || isPending) return;
    if (isFolder) {
      handleToggle();
      return;
    }
    handleOpenWindow(node);
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShareMode || isPending) return;
    const menuWidth = 192; 
    const menuHeight = 380; 
    const x = e.clientX + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 10) : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 10) : e.clientY;
    setContextMenu({ x, y });
  };

  const handleThreeDotsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
   
    setContextMenu({ x: Math.max(e.clientX - 200, 10), y: e.clientY });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  });

  const selectedClass = isSelected
    ? isAgent
      ? "bg-amber-500/10 border-amber-500/20 text-amber-200 font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.3)]"
      : "bg-zinc-800/80 border-black  font-medium "
    : "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 border-transparent hover:border-white/5";

  const pendingClass = isPending ? "opacity-50 pointer-events-none cursor-not-allowed select-none" : "";

  return (
    <div className="select-none relative" onContextMenu={handleContextMenu}>
      <div
        className={`group/item flex w-full items-center justify-between py-1.25 px-2 mb-[1px] cursor-pointer rounded-lg transition-all duration-200 border ${selectedClass} ${pendingClass}`}
        onClick={handleRowClick}
      >
        <div
          className={`${!isFolder && " -ml-3"} flex items-center gap-2 flex-1 min-w-0`}
        >
          {isFolder ? (
            <span
              className={`text-zinc-600 group-hover/item:text-zinc-400 transition-all duration-300 shrink-0 ${isOpen ? "rotate-0 text-cyan-500/80" : "-rotate-90"}`}
            >
              <ChevronDown size={13} strokeWidth={3} />
            </span>
          ) : (
            <span className="w-3" />
          )}

          {isFolder ? (
            node.isSystemFolder ? (
              (() => {
                const getSystemStyle = () => {
                  switch (node.name) {
                    case "Documents":
                      return {
                        color: "text-blue-400 text-opacity-90 fill-blue-500/10",
                        suffix: (
                          <FileText
                            size={7}
                            className="text-blue-100"
                            strokeWidth={3}
                          />
                        ),
                        suffixBg: "bg-blue-600",
                      };
                    case "Media":
                      return {
                        color: "text-rose-400 text-opacity-90 fill-rose-500/10",
                        suffix: (
                          <ImageIcon
                            size={7}
                            className="text-rose-100"
                            strokeWidth={3}
                          />
                        ),
                        suffixBg: "bg-rose-600",
                      };
                    case "Research":
                      return {
                        color:
                          "text-amber-400 text-opacity-90 fill-amber-500/10",
                        suffix: (
                          <BookOpen
                            size={7}
                            className="text-amber-100"
                            strokeWidth={3}
                          />
                        ),
                        suffixBg: "bg-amber-600",
                      };
                    case "Chats":
                      return {
                        color:
                          "text-emerald-400 text-opacity-90 fill-emerald-500/10",
                        suffix: (
                          <MessageCircle
                            size={7}
                            className="text-emerald-100"
                            strokeWidth={3}
                          />
                        ),
                        suffixBg: "bg-emerald-600",
                      };
                    default:
                      return {
                        color: "text-cyan-400",
                        suffix: null,
                        suffixBg: "",
                      };
                  }
                };
                const { color, suffix, suffixBg } = getSystemStyle();
                return (
                  <div className="relative flex items-center justify-center transition-transform group-hover/item:scale-110 duration-200">
                    <Folder size={16} className={color} strokeWidth={2} />
                    {suffix && (
                      <div
                        className={`absolute -bottom-[2px] -right-[2px] p-[2px] rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-black/80 ${suffixBg} z-10 scale-[0.85]`}
                      >
                        {suffix}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="relative flex items-center justify-center transition-transform group-hover/item:scale-110 duration-200">
                <Folder
                  size={16}
                  className="text-cyan-500 fill-cyan-500/10 text-opacity-90"
                  strokeWidth={2}
                />
              </div>
            )
          ) : (
            <div className="relative flex items-center justify-center px-0.5 transition-transform group-hover/item:scale-110 duration-200">
              {node.chatType === "agent" ? (
                <Brain
                  size={15}
                  className="text-amber-400 fill-amber-500/10"
                  strokeWidth={2}
                />
              ) : (
                <MessageSquare
                  size={15}
                  className="text-emerald-400/90 fill-emerald-500/10"
                  strokeWidth={2}
                />
              )}
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
              <div
                className={`text-[13px] tracking-wide truncate transition-colors font-medium group-hover/item:text-white`}
              >
                {node.name}
              </div>
              {!isFolder && (node.contextParents?.length || 0) > 0 && (
                <div
                  className="flex items-center text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2 flex-shrink-0 border border-amber-500/20"
                  title={`${node.contextParents?.length} Inherited Contexts`}
                >
                  <GitBranch size={10} className="mr-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {node.contextParents?.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 pointer-events-auto lg:pointer-events-none group-hover/item:pointer-events-auto group-hover/item:opacity-100 transition-opacity duration-200">
          {!isFolder && node.chatType !== "agent" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent("insert-chat-name", {
                    detail: { name: node.name },
                  }),
                );
              }}
              className="p-1 hover:bg-zinc-700/60 rounded-md text-zinc-500 hover:text-cyan-400 transition-colors active:scale-95"
              title="Reference chat name in composer"
            >
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={handleThreeDotsClick}
            className="p-1 hover:bg-zinc-700/60 rounded-md text-zinc-500 hover:text-cyan-400 transition-colors active:scale-95"
            title="Options"
          >
            <MoreVertical size={14} strokeWidth={2.5} />
          </button>
        </div>
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

      {isFolder && isOpen && (
        <div className="ml-[18px] pl-1.5 border-l border-zinc-800/80 hover:border-zinc-700/80 transition-colors mt-0.5 mb-1.5 space-y-[2px]">
          {node.children?.map((child) => (
            <FileItem key={child.id} node={child} />
          ))}
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          ></div>
          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 bg-[var(--theme-bg-surface)] border border-zinc-800 shadow-2xl rounded-xl py-1.5 w-48 text-sm text-gray-200 overflow-hidden"
          >
            {!isChat && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating("chat");
                  setContextMenu(null);
                  if (!isOpen) dispatch(setIsExpandedTracker(node.id));
                }}
              >
                <MessageSquare size={14} /> New Chat
              </button>
            )}

            {!isChat&&<button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating("folder");
                setContextMenu(null);
                if (!isOpen) dispatch(setIsExpandedTracker(node.id));
              }}
            >
              <FolderPlus size={14} /> New Folder
            </button>}
            {!isChat && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating("agent");
                  setContextMenu(null);
                  if (!isOpen) dispatch(setIsExpandedTracker(node.id));
                }}
              >
                <Brain size={14} /> New Agent
              </button>
            )}
            {!isChat&&<button
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRootSetting();
                setContextMenu(null);
                if (!isOpen) dispatch(setIsExpandedTracker(node.id));
              }}
            >
              <FolderPlus size={14} /> Open With Folder
            </button>
          }
            {node.id !== "root" &&!isChat && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu(null);
                  window.dispatchEvent(
                    new CustomEvent("open-search-modal", {
                      detail: { folderId: node.id },
                    }),
                  );
                }}
              >
                <Search size={14} /> Search in Folder
              </button>
            )}
            {!isChat&&<button
              className="w-full text-left px-3 py-1.5 hover:bg-amber-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/graph/${node.id}`);
                setContextMenu(null);
              }}
            >
              <GitBranch size={14} /> Knowledge Graph
            </button>
          }
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
            {!isChat&&<button
              className="w-full text-left px-3 py-1.5 hover:bg-amber-600 hover:text-white flex items-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsBehaviorOpen(true);
                setContextMenu(null);
              }}
            >
              <GitBranch size={14} /> Behaviour
            </button>}
            {node.id !== "root" && !node.isSystemFolder && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareOpen(true);
                  setContextMenu(null);
                }}
              >
                <Share size={14} /> Share
              </button>
            )}
            {node.id !== "root" && !node.isSystemFolder && (
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoveOpen(true);
                  setContextMenu(null);
                }}
              >
                <Move size={14} /> Move
              </button>
            )}
            {node.id !== "root" && !node.isSystemFolder && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-red-500/20 hover:text-red-300 flex items-center gap-2 text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenu(null);
                  setIsDeleteModalOpen(true);
                }}
              >
                <Trash size={14} /> Delete
              </button>
            )}
          </div>
        </>
      )}
      {isBehaviorOpen && (
        <FolderBehaviorModal
          isOpen={isBehaviorOpen}
          onClose={() => setIsBehaviorOpen(false)}
          folder={node}
        />
      )}
      {isMoveOpen && (
        <MoveItemModal
          isOpen={isMoveOpen}
          onClose={() => setIsMoveOpen(false)}
          itemToMove={{
            id: node.id,
            name: node.name,
            type: node.type,
          }}
          onMove={(destFolderId) => {
            if (isFolder) {
              updateFolder({
                folderId: node.id,
                updates: { parentId: destFolderId },
              });
            } else {
              updateChat({
                chatId: node.id,
                updates: { folderId: destFolderId },
              });
            }
          }}
        />
      )}
      {isShareOpen && (
        <ShareLinkModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          targetId={node.id}
          targetType={isFolder ? "folder" : "chat"}
          targetName={node.name}
        />
      )}
      <ActionModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${isFolder ? "Folder" : "Chat"}`}
        description={`Are you sure you want to delete "${node.name}"? This action cannot be undone.`}
        variant="warning"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
});
