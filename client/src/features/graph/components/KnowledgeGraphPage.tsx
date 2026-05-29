import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/store";
import type { FileNode } from "../../explorer/types/types";
import KnowledgeGraph from "./KnowledgeGraph";
import { GitBranch } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";

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

  const queryClient = useQueryClient();

  const graphMutation = useMutation({
    mutationFn: async ({ sourceId, targetId, sourceHandle, targetHandle }: { sourceId: string; targetId: string; sourceHandle: string; targetHandle: string }) => {
      return await api.post("/graph/inherit", { sourceId, targetId, sourceHandle, targetHandle });
    },
    onSuccess: (data) => {
      console.log("Connected:", data.data);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      return await api.post("/graph/disconnect", { sourceId, targetId });
    },
    onSuccess: (data) => {
      console.log("Disconnected:", data.data);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

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
        onConnect={(sourceId, targetId, sourceHandle, targetHandle) => {
          graphMutation.mutate({ sourceId, targetId, sourceHandle, targetHandle });
        }}
        onDisconnect={(sourceId, targetId) => {
          disconnectMutation.mutate({ sourceId, targetId });
        }}
      />
    </div>
  );
}
