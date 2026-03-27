import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/store";
import type { FileNode } from "../types/types";
import KnowledgeGraph from "../components/KnowledgeGraph";
import { GitBranch } from "lucide-react";

function findNodeById(node: FileNode, id: string): FileNode | null {
  if (node.id === id) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export default function KnowledgeGraphPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { tree } = useAppSelector((state) => state.explorer);

  const folderNode = folderId ? findNodeById(tree, folderId) : null;

  if (!folderNode || folderNode.type !== "folder") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
        <GitBranch size={48} className="text-zinc-700" />
        <p className="text-[14px] font-medium">Folder not found or still loading...</p>
        <button
          onClick={() => navigate("/explorer")}
          className="px-4 py-2 text-[12px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
        >
          Back to Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <KnowledgeGraph
        folderNode={folderNode}
        onClose={() => navigate(-1)}
        onConnect={(sourceId, targetId) => {
          console.log(`[KnowledgeGraph] Inherit context: ${sourceId} → ${targetId}`);
          // TODO: Call backend API to persist this inheritance link
        }}
      />
    </div>
  );
}
