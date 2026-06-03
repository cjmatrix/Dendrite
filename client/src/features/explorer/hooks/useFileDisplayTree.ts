import { useMemo } from "react";
import type { FileNode } from "../types/types";


export function useFileDisplayTree(tree: FileNode, activeFolderId: string | null | undefined) {
  return useMemo(() => {
    let target = tree;
    let currentPath: FileNode[] = [{ ...tree, id: "root", name: "Root" }];

    if (activeFolderId && activeFolderId !== "root") {
      const dfs = (
        node: FileNode,
        targetId: string,
        branch: FileNode[],
      ): { found: FileNode | null; path: FileNode[] } => {
        if (node.id === targetId) return { found: node, path: [...branch, node] };
        if (!node.children) return { found: null, path: [] };
        for (const child of node.children) {
          const res = dfs(child, targetId, [...branch, node]);
          if (res.found) return res;
        }
        return { found: null, path: [] };
      };

      const result = dfs(tree, activeFolderId, []);
      if (result.found) {
        target = result.found;
        currentPath = result.path;
      }
    }


    if (target.id === "root") {
      currentPath = [{ ...tree, id: "root", name: "Root" }];
    } else if (currentPath[0]) {
      currentPath[0] = { ...currentPath[0], name: "Root" };
    }

    return { currentFolder: target, path: currentPath };
  }, [tree, activeFolderId]);
}
