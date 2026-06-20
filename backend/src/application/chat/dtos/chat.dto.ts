import { z } from "zod";
import { ChatDocument, IChat } from "../../../domain/chat/entities/Chat";

// ─── Input Schemas for Request Body Validation ───────────────────

export const CreateChatBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  folderId: z.string().trim().nullable().optional(),
  type:z.string().optional()
});

export const UpdateChatBodySchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").optional(),
  folderId: z.string().trim().nullable().optional(),
}).refine(data => data.title !== undefined || data.folderId !== undefined, {
  message: "At least one of title or folderId must be provided",
});

export const SendMessageBodySchema = z.object({
  message: z.string().trim().nullable().optional(),
  mode: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  imageUrl: z.string().trim().nullable().optional(),
  fileUrl: z.string().trim().nullable().optional(),
  fileName: z.string().trim().nullable().optional(),
}).refine(data => data.message || data.imageUrl || data.fileUrl, {
  message: "At least one of message, imageUrl, or fileUrl must be provided",
});

export const StreamQuickChatBodySchema = z.object({
  anchorMessageId: z.string().trim().min(1, "Anchor message ID is required"),
  highlightedText: z.string().trim().nullable().optional(),
  quickChatHistory: z.array(z.any()).optional(),
  model: z.string().trim().nullable().optional(),
});

export const SaveSubChatBodySchema = z.object({
  subChatId: z.string().trim().nullable().optional(),
  anchorMessageId: z.string().trim().min(1, "Anchor message ID is required"),
  highlightedText: z.string().trim().nullable().optional(),
  messages: z.array(z.any()),
  relativeY: z.number(),
});


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
  type?:string
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
  model?: string;
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
  parentSummary: string | null;
  model?: string;
}

export interface SaveModelReplyInputDTO {
  chatId: string;
  userId: string;
  modelReply: string;
  parentContext: Map<any, any>;
  parentSummary:string|null;
  promptTokens?: number;
  responseTokens?: number;
  contents?: any[];
  model?: string;
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

export interface StreamQuickChatInputDTO {
  userId: string;
  chatId: string;
  anchorMessageId: string;
  highlightedText: string;
  quickChatHistory: any[];
  userTier?: string;
  model?: string;
}

export interface UploadDocumentInputDTO {
  userId: string;
  chatId: string;
  filePath: string;
  fileName: string;
}

export interface UploadDocumentOutputDTO {
  documentId: string;
  fileName: string;
  status: string;
}

export interface ValidateChatAccessInputDTO {
  userId: string;
  chatId: string;
}



export class ChatMapper {
  static toChatOutput(raw: any): ChatOutputDTO {
    return {
      _id: raw._id?.toString() || raw.id,
      // id: raw._id?.toString() || raw.id,
      userId: raw.userId?.toString(),
      folderId: raw.folderId?.toString() || null,
      title: raw.title,
      type:raw.type,
      contextParent: raw.contextParent
        ? (typeof raw.contextParent === 'object' && raw.contextParent._id
          ? { _id: raw.contextParent._id.toString(), title: raw.contextParent.title || null }
          : { _id: raw.contextParent.toString(), title: null })
        : null,
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
