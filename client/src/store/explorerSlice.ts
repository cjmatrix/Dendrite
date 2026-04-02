import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FileNode } from '../types/types';

interface ExplorerState {
  tree: FileNode,
  activeSidebarRootId: string | null,
  isExplorerModalOpen: boolean
}

const initialState: ExplorerState = {
  tree: {
    id: 'root',
    name: 'PROJECT',
    type: 'folder',
    isExpanded: true,
    children: [],
  },
  activeSidebarRootId: localStorage.getItem("dendrites_active_folder") || null,
  isExplorerModalOpen: false
};

const explorerSlice = createSlice({
  name: 'explorer',
  initialState,
  reducers: {
    setTree: (state, action: PayloadAction<FileNode>) => {
      state.tree = action.payload;
    },
    setActiveSidebarRootId: (state, action: PayloadAction<string | null>) => {
      state.activeSidebarRootId = action.payload;
      if (action.payload) {
        localStorage.setItem("dendrites_active_folder", action.payload);
      } else {
        localStorage.removeItem("dendrites_active_folder");
      }
    },
    toggleExplorerModal: (state, action: PayloadAction<boolean | undefined>) => {
      if (action.payload !== undefined) {
        state.isExplorerModalOpen = action.payload;
      } else {
        state.isExplorerModalOpen = !state.isExplorerModalOpen;
      }
    }
  },
});

export const { setTree, setActiveSidebarRootId, toggleExplorerModal } = explorerSlice.actions;
export default explorerSlice.reducer;
