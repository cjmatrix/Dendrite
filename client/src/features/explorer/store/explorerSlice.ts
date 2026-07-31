import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FileNode } from "../types/types";

interface ExplorerState {
  tree: FileNode;
  activeSidebarRootId: string | null;
  systemChatsFolderId: string | null;
  isExplorerModalOpen: boolean;
  isRecallOverlayOpen: boolean;
  isShareMode: boolean;
  isExpandedTracker: Record<string,boolean>;
}

const initialState: ExplorerState = {
  tree: {
    id: "root",
    name: "PROJECT",
    type: "folder",
    isExpanded: true,
    children: [],
  },
  activeSidebarRootId: localStorage.getItem("dendrites_active_folder") || null,
  systemChatsFolderId: null,
  isExplorerModalOpen: false,
  isRecallOverlayOpen: false,
  isShareMode: false,
  isExpandedTracker:
    JSON.parse(localStorage.getItem("dendrites_expanded_folder") || "{}"),
};

const explorerSlice = createSlice({
  name: "explorer",
  initialState,
  reducers: {
    setTree: (state, action: PayloadAction<FileNode>) => {
      state.tree = action.payload;
    },
    setSystemChatsFolderId: (state, action: PayloadAction<string | null>) => {
      state.systemChatsFolderId = action.payload;
    },
    setActiveSidebarRootId: (state, action: PayloadAction<string | null>) => {
      state.activeSidebarRootId = action.payload;
      if (action.payload) {
        localStorage.setItem("dendrites_active_folder", action.payload);
      } else {
        localStorage.removeItem("dendrites_active_folder");
      }
    },
    toggleExplorerModal: (
      state,
      action: PayloadAction<boolean | undefined>,
    ) => {
      if (action.payload !== undefined) {
        state.isExplorerModalOpen = action.payload;
      } else {
        state.isExplorerModalOpen = !state.isExplorerModalOpen;
      }
    },
    toggleRecallOverlay: (
      state,
      action: PayloadAction<boolean | undefined>,
    ) => {
      if (action.payload !== undefined) {
        state.isRecallOverlayOpen = action.payload;
      } else {
        state.isRecallOverlayOpen = !state.isRecallOverlayOpen;
      }
    },
    setIsShareMode: (state, action: PayloadAction<boolean>) => {
      state.isShareMode = action.payload;
    },
    setIsExpandedTracker: (state, action: PayloadAction<string>) => {
      state.isExpandedTracker[action.payload] =
        !state.isExpandedTracker[action.payload];

      localStorage.setItem(
        "dendrites_expanded_folder",
        JSON.stringify(state.isExpandedTracker),
      );
    },
    expandFolderTemporarily: (state, action: PayloadAction<string>) => {
      state.isExpandedTracker[action.payload] = true;
    },
    collapseAllFolders: (state) => {
      const newTracker: Record<string, boolean> = {};
      const traverse = (node: FileNode) => {
        if (node.type === "folder") {
          newTracker[node.id] = false;
          node.children?.forEach(traverse);
        }
      };
      traverse(state.tree);
      state.isExpandedTracker = newTracker;
      localStorage.setItem(
        "dendrites_expanded_folder",
        JSON.stringify(newTracker),
      );
    },
  },
});

export const {
  setTree,
  setSystemChatsFolderId,
  setActiveSidebarRootId,
  toggleExplorerModal,
  toggleRecallOverlay,
  setIsShareMode,
  setIsExpandedTracker,
  expandFolderTemporarily,
  collapseAllFolders,
} = explorerSlice.actions;
export default explorerSlice.reducer;
