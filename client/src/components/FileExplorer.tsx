import { useRef, useState, useEffect } from "react";

import type { FileNode, FileType } from "../types/types";
import { FileItem } from "./FileItem";
import { AddNewNode, RenameNode, DeleteNode } from "./AddNewNode";

const INITIAL_DATA: FileNode = {
  id: "root",
  name: "PROJECT",
  type: "folder",
  children: [
    {
      id: "1",
      name: "mongodb",
      type: "folder",
      children: [],
    },
  ],
};

export default function FileExplorer() {
  const [data, setData] = useState<FileNode>(INITIAL_DATA);
  const [width, setWidth] = useState(256);

  const [isResizing, setIsResizing] = useState(false);

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

  const onAdd = (parentId: string, type: FileType, name: string) => {
    const updatedTree = AddNewNode(data, parentId, type, name);
    setData(updatedTree);
  };

  const onRename = (nodeId: string, newName: string) => {
    const updatedTree = RenameNode(data, nodeId, newName);
    setData(updatedTree);
  };

  const onDelete = (nodeId: string) => {
    if (nodeId === "root") return;
    const updatedTree = DeleteNode(data, nodeId);
    setData(updatedTree);
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="relative h-screen bg-[#0d0d12] border-r border-slate-800/50 flex-shrink-0 flex flex-col pt-2"
    >
      <h2 className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2">
        Explorer
      </h2>

      <div className="flex-1 overflow-y-auto px-2">
        <FileItem
          node={data}
          onAdd={onAdd}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 bg-slate-800/50 z-10 transition-colors duration-200"
        onMouseDown={startResizing}
      />
    </div>
  );
}
