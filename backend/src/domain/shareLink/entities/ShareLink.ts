export type ShareableType = 'chat' | 'folder';

export interface ISharedLink {
  creatorId: string;
  targetType: ShareableType;
  targetId: string;
  token: string; 
  behaviorSharingPolicy:'READ_ONLY'| 'READ_WRITE'|'INVISIBLE';
}