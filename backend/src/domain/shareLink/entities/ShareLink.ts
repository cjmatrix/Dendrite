export type ShareableType = 'chat' | 'folder';

export interface ISharedLink {
  creatorId: string;
  targetType: ShareableType;
  targetId: string;
  token: string; 
  behaviorSharingPolicy:'READ_ONLY'| 'READ_WRITE'|'INVISIBLE';
  shareRepo?: {
    targetType: ShareableType;
    behaviorSharingPolicy?: 'READ_ONLY'| 'READ_WRITE'|'INVISIBLE';
    folders?: any[];
    chats?: any[];
    messages?: any[];
    chat?: any;
  };
}