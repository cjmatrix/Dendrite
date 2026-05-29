export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  type: "folder";
  isExpanded: boolean;
  isSystemFolder?: boolean;
  children?: Folder[];
}
