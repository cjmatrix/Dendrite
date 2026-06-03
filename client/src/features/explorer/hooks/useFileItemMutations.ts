import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFolder as apiCreateFolder, updateFolder as apiUpdateFolder, deleteFolder as apiDeleteFolder, createChat as apiCreateChat, updateChat as apiUpdateChat, deleteChat as apiDeleteChat } from "../api/explorerApi";

export function useFileItemMutations() {
  const queryClient = useQueryClient();

  // ── Folder mutations ──────────────────────────────────────────────



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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["folders"] }),
  });


  const { mutate: updateFolder } = useMutation({
    mutationFn: ({ folderId, updates }: { folderId: string; updates: { name?: string; isExpanded?: boolean } }) =>
      apiUpdateFolder(folderId, updates),
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
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["folders"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["folders"] }),
  });

  const { mutate: deleteFolder } = useMutation({
    mutationFn: (folderId: string) => apiDeleteFolder(folderId),
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["folders"] });
      const previous = queryClient.getQueryData(["folders"]);
      queryClient.setQueryData(["folders"], (old: any[]) => {
        if (!old) return old;
        const removeNode = (nodes: any[]): any[] =>
          nodes
            .filter((n: any) => n.id !== folderId)
            .map((n: any) => ({ ...n, children: n.children ? removeNode(n.children) : [] }));
        return removeNode(old);
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["folders"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["folders"] }),
  });












  // ── Chat mutations ───────────────────────────────────────────────────────


  

  const { mutate: createChat } = useMutation({
    mutationFn: ({ title, folderId }: { title: string; folderId: string | null }) =>
      apiCreateChat(title, folderId),
    onMutate: async ({ title, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        const temp = { _id: `temp-${Date.now()}`, title, folderId, type: "chat" };
        return [...old, temp];
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["chats"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  const { mutate: updateChat } = useMutation({
    mutationFn: ({ chatId, updates }: { chatId: string; updates: { title?: string; folderId?: string | null } }) =>
      apiUpdateChat(chatId, updates),
    onMutate: async ({ chatId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.map((c: any) => (c._id === chatId ? { ...c, ...updates } : c));
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["chats"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  const { mutate: deleteChat } = useMutation({
    mutationFn: (chatId: string) => apiDeleteChat(chatId),
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previous = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (old: any[]) => {
        if (!old) return old;
        return old.filter((c: any) => c._id !== chatId);
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(["chats"], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  return { createFolder, updateFolder, deleteFolder, createChat, updateChat, deleteChat };
}
