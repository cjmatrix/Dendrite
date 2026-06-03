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
  ownerId?: string;
  behavior?: {
    current: {
      content: string;
      updatedAt: string;
    };
    history: Array<{
      content: string;
      archivedAt: string;
    }>;
    settings?: {
      sharingPolicy: string;
    };
  };
}