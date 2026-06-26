export type FileType = 'folder' | 'chat';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  chatType?: 'normal' | 'agent';
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

export interface FolderBehaviorData {
  currentBehavior: {
    current?: {
      content: string;
      updatedAt?: string;
    };
    history: Array<{
      content: string;
      archivedAt: string;
    }>;
  };
  parentBehavior?: {
    parentContent: string;
    parentName: string;
  };
}

export interface SearchItem {
  id: string;
  name: string;
  type: "folder" | "chat" | "agent";
  isSystemFolder?: boolean;
  breadcrumbs: Array<{
    id: string;
    name: string;
  }>;
}