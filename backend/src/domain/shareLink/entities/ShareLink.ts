import { IChat } from "../../chat/entities/Chat";
import { IMessage } from "../../chat/entities/Message";
import { IFolder } from "../../folder/entities/Folder";

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
    folders?: Partial<IFolder>[];
    chats?: Partial<IChat>[];
    messages?: Partial<IMessage>[];
    chat?: Partial<IChat>;
  };
}