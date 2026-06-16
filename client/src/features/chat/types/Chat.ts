export interface Chat {
  _id: string;
  title: string;
  folderId?: string;
  type:"normal"|"agent"
  contextParent?: { _id: string; title: string | null } | null;
  contextParents?: {
    chatId: string;
    sourceHandle: string;
    targetHandle: string;
  }[];
}
