import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getChats, getDueCount, createFolder as apiCreateFolder, createChat as apiCreateChat } from "../api/explorerApi";
import { useEffect } from "react";
import { useAppDispatch } from "../../../store/store";
import { setTree } from "../store/explorerSlice";
import type { FileNode } from "../types/types";


import { useParams } from "react-router-dom";

export function useFileTree() {
  const dispatch = useAppDispatch();
  const { token } = useParams<{ token?: string }>();

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getFolders(),
    enabled: !token,
  });

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: () => getChats(),
    enabled: !token,
  });

  const { data: recallCount, refetch: refetchRecallCount } = useQuery({
    queryKey: ["recallCount"],
    queryFn: () => getDueCount(),
    enabled: !token,
  });



  useEffect(() => {
    const handleRecallNotification = () => {
      refetchRecallCount();
    };

    window.addEventListener("recall:notification-pushed", handleRecallNotification);
    return () => window.removeEventListener("recall:notification-pushed", handleRecallNotification);
  }, [refetchRecallCount]);

  
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
          chatType: chat.type,
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
              if (node.type === "folder" && node.children && addToFolder(node.children)) return true;
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
  }, [folders, chats, dispatch]);

  return { recallCount: recallCount ?? 0 };
}


//  Mutations for creating folders and chats at the root / sidebar level.
 
export function useExplorerMutations() {
  const queryClient = useQueryClient();

  const { mutate: createFolder } = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      apiCreateFolder(name, parentId),
    onMutate: async ({ name, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const temp = { id: `temp-${Date.now()}`, name, type: "folder", parentId, children: [], isExpanded: false };
        const addChild = (nodes: any[]): any[] =>
          nodes.map((n: any) =>
            n.id === parentId
              ? { ...n, children: [...(n.children || []), temp] }
              : { ...n, children: n.children ? addChild(n.children) : [] },
          );
        return parentId ? addChild(old) : [...old, temp];
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["folders"], ctx.previous); },
    onSettled: () =>{ queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["workspaceFoldersOnly"] });
  },
  });

  const { mutate: createChat } = useMutation({
    mutationFn: ({ title, folderId ,type}: { title: string; folderId: string | null,type?:string }) =>
      type&&type==="agent"?apiCreateChat(title, folderId,type):apiCreateChat(title, folderId),
    
    onMutate: async ({ title, folderId, type }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        const temp = { _id: `temp-${Date.now()}`, title, folderId, type: type || "normal" };
        const addChild = (nodes: any[]): any[] =>
          nodes.map((n: any) =>
            n.id === folderId
              ? { ...n, children: [...(n.children || []), temp] }
              : { ...n, children: n.children ? addChild(n.children) : [] },
          );
        return folderId ? addChild(old) : [...old, temp];
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["chats"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  return { createFolder, createChat };
}
