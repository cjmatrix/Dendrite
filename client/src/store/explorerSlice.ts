import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FileNode } from '../types/types';

interface ExplorerState {
  tree: FileNode;
}

const initialState: ExplorerState = {
  tree: {
    id: 'root',
    name: 'PROJECT',
    type: 'folder',
    isExpanded: true,
    children: [],
  },
};

const explorerSlice = createSlice({
  name: 'explorer',
  initialState,
  reducers: {
    setTree: (state, action: PayloadAction<FileNode>) => {
      state.tree = action.payload;
    },
  },
});

export const { setTree } = explorerSlice.actions;
export default explorerSlice.reducer;
