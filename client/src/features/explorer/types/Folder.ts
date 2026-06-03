export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  type: "folder";
  isExpanded: boolean;
  isSystemFolder?: boolean;
  children?: Folder[];
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
