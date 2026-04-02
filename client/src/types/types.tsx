export type FileType = 'folder' | 'chat';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  children?: FileNode[];
  isExpanded: boolean;
  isSystemFolder?: boolean;
  contextParents?: {
    chatId: string;
    sourceHandle: string;
    targetHandle: string;
  }[];
}