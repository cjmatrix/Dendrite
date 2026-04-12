import { useMemo } from "react";
import type { Message } from "../core/domain/entities/Message";
import type { FileNode } from "../types/types";

/**
 * Flattens paginated infinite query data into a flat message list
 * and computes the Virtuoso firstItemIndex for prepend support.
 */
export function useFlattenedMessages(messagesData: any) {
  return useMemo(() => {
    if (!messagesData) return { messages: [] as Message[], firstItemIndex: 10000 };

    const allPagesReversed = [...messagesData.pages].reverse();
    const mergedMessages: Message[] = allPagesReversed.flatMap((p: any) => p.messages);

    let prepended = 0;
    for (let i = 1; i < messagesData.pages.length; i++) {
      prepended += messagesData.pages[i].messages?.length || 0;
    }

    return {
      messages: mergedMessages,
      firstItemIndex: Math.max(0, 10000 - prepended),
    };
  }, [messagesData]);
}

/**
 * Computes breadcrumb path from file tree to the current chat id.
 */
export function useBreadcrumbs(tree: FileNode, chatId: string | undefined) {
  return useMemo(() => {
    const path: { id: string; name: string }[] = [];

    function findPath(node: FileNode): boolean {
      if (node.type === "folder" && node.id !== "root") {
        path.push({ id: node.id, name: node.name });
      }
      if (node.id === chatId) return true;

      for (const child of node.children || []) {
        if (findPath(child)) return true;
      }

      if (node.type === "folder" && node.id !== "root") {
        path.pop();
      }
      return false;
    }

    findPath(tree);
    return path;
  }, [tree, chatId]);
}
