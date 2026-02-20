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

interface FileItemProps {
  node: FileNode;
  onAdd: (parentId: string, type: FileType, name: string) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  node,
  onAdd,
  onRename,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState<FileType | null>(null);
  const [isRenaming, setIsRenaming] = useState<FileType | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameItemName, setRenameItemName] = useState("");

  const isFolder = node.type === "folder";

  const handleCreate = () => {
    if (newItemName.trim()) {
      onAdd(node.id, isCreating!, newItemName);
      setNewItemName("");
      setIsCreating(null);
      setIsOpen(true);
    }
  };

  const handleRename = () => {
    if (renameItemName.trim() && renameItemName !== node.name) {
      onRename(node.id, renameItemName);
    }
    setIsRenaming(null);
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

  return (
    <div className="select-none" onContextMenu={handleContextMenu}>
      <div className="group flex items-center justify-between py-1 px-2 hover:bg-[#1e1e26] cursor-pointer text-slate-200 rounded-md transition-colors">
        <div
          className={`${!isFolder && " -ml-4"} flex items-center gap-2 flex-1`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isFolder ? (
            <span className="text-slate-500">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-4" />
          )}

          {isFolder ? (
            <Folder size={16} className="text-indigo-400" />
          ) : (
            <MessageSquare size={16} className="text-emerald-400" />
          )}
          {isRenaming ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                className="bg-[#16161e] border border-indigo-500/50 focus:border-indigo-500 rounded text-sm text-slate-200 outline-none px-2 py-0.5 w-[140px] transition-colors"
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
                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <span className={`text-sm truncate`}>{node.name}</span>
          )}
        </div>

        {isFolder && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={() => setIsCreating("chat")}
              className="p-1 hover:bg-slate-700 text-slate-400"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => setIsCreating("folder")}
              className="p-1 hover:bg-slate-700 text-slate-400"
            >
              <FolderPlus size={12} />
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="ml-6 flex items-center gap-1 py-1 px-2">
          <input
            autoFocus
            className="bg-[#16161e] border border-indigo-500/50 focus:border-indigo-500 rounded text-sm text-slate-200 outline-none px-2 py-0.5 w-[140px] transition-colors"
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
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      )}
      {isFolder && isOpen && node.children && (
        <div className="ml-4 border-l border-slate-700/50">
          {node.children.map((child) => (
            <FileItem
              key={child.id}
              node={child}
              onAdd={onAdd}
              onRename={onRename}
              onDelete={onDelete}
            />
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
            className="fixed z-50 bg-[#1e1e26] border border-slate-700/50 shadow-2xl rounded-xl py-1.5 w-48 text-sm text-slate-200 overflow-hidden"
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
                  onDelete(node.id);
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
