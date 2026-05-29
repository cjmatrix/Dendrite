export interface Chat {
  _id: string;
  title: string;
  folderId?: string;
  contextParents?: {
    chatId: string;
    sourceHandle: string;
    targetHandle: string;
  }[];
}
