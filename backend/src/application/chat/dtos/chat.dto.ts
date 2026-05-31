import { ChatDocument, IChat } from "../../../domain/chat/entities/Chat";

// ─── Output DTOs ────────────────────────────────────────────────

export interface ChatOutputDTO extends IChat {
  id?: string;
}

export interface DeleteChatOutputDTO {
  deleted: true;
}

export interface GetChatMessagesOutputDTO {
  messages: any[];
  nextCursor: string | null;
}

// ─── Input DTOs ─────────────────────────────────────────────────

export interface CreateChatInputDTO {
  userId: string;
  title: string;
  folderId?: string | null;
}

export interface GetChatsInputDTO {
  userId: string;
}

export interface GetChatByIdInputDTO {
  chatId: string;
  userId: string;
}

export interface UpdateChatInputDTO {
  chatId: string;
  userId: string;
  title?: string;
  folderId?: string | null;
}

export interface DeleteChatInputDTO {
  chatId: string;
  userId: string;
}

export interface GetChatMessagesInputDTO {
  chatId: string;
  userId: string;
  limit: number;
  cursor: string | null;
}

export interface PrepareMessageInputDTO {
  chatId: string;
  userId: string;
  userMessage: string;
  mode?: string;
  codeQueryVector?: number[];
  descQueryVector?: number[];
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface PrepareMessageOutputDTO {
  contents: any[];
  userMessageId: string;
  parentContext: Map<any, any>;
}

export interface SaveModelReplyInputDTO {
  chatId: string;
  userId: string;
  modelReply: string;
  parentContext: Map<any, any>;
}

export interface SaveModelReplyOutputDTO {
  modelMessageId: string | null;
}

export interface GetSubChatInputDTO {
  chatId: string;
  subChatId: string;
  userId: string;
}

export interface SaveSubChatInputDTO {
  chatId: string;
  userId: string;
  subChatId?: string;
  anchorMessageId: string;
  highlightedText?: string;
  messages: any[];
  relativeY: number;
}

export interface UploadChatImageInputDTO {
  userId: string;
  chatId: string;
  file: {
    buffer: Buffer;
    mimetype: string;
  };
}

export interface UploadChatImageOutputDTO {
  url: string;
}

export interface RemoveDocumentInputDTO {
  userId: string;
  chatId: string;
  fileUrl: string;
}

// ─── Mapper ─────────────────────────────────────────────────────

export class ChatMapper {
  static toChatOutput(raw: any): ChatOutputDTO {
    return {
      _id: raw._id?.toString() || raw.id,
      // id: raw._id?.toString() || raw.id,
      userId: raw.userId?.toString(),
      folderId: raw.folderId?.toString() || null,
      title: raw.title,
      contextParent: raw.contextParent?.toString() || null,
      summary: raw.summary || null,
      tokenCount: raw.tokenCount || 0,
      unsummarizedCount: raw.unsummarizedCount || 0,
      documents: raw.documents || [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toChatOutputList(rawList: any[]): ChatOutputDTO[] {
    return rawList.map((raw) => ChatMapper.toChatOutput(raw));
  }

  static toMessagesOutput(messages: any[], limit: number): GetChatMessagesOutputDTO {
    const nextCursor = messages.length === limit ? messages[0]._id.toString() : null;
    return { messages, nextCursor };
  }
}
