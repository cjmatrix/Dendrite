import {
  CreateChatInputDTO,
  GetChatMessagesInputDTO,
  PrepareMessageInputDTO,
  PrepareMessageOutputDTO,
  SaveModelReplyInputDTO,
  SaveModelReplyOutputDTO,
  UpdateChatInputDTO,
  SaveSubChatInputDTO,
  ChatOutputDTO,
  DeleteChatOutputDTO,
  GetChatMessagesOutputDTO,
  UploadChatImageInputDTO,
  UploadChatImageOutputDTO,
  RemoveDocumentInputDTO,
  StreamQuickChatInputDTO,
  UploadDocumentInputDTO,
  UploadDocumentOutputDTO,
  ValidateChatAccessInputDTO
} from "../dtos/chat.dto";
import { ChatDocument, IChat } from "../../../domain/chat/entities/Chat";

export interface ICreateChatUseCase {
  execute(input: CreateChatInputDTO): Promise<ChatOutputDTO>;
}

export interface IGetChatsUseCase {
  execute(userId: string): Promise<ChatOutputDTO[]>;
}

export interface IGetChatByIdUseCase {
  execute(chatId: string, userId: string): Promise<ChatOutputDTO>;
}

export interface IGetChatMessagesUseCase {
  execute(input: GetChatMessagesInputDTO): Promise<GetChatMessagesOutputDTO>;
}

export interface IUpdateChatUseCase {
  execute(input: UpdateChatInputDTO): Promise<ChatOutputDTO>;
}

export interface IDeleteChatUseCase {
  execute(chatId: string, userId: string): Promise<DeleteChatOutputDTO>;
}

export interface IPrepareMessageUseCase {
  execute(input: PrepareMessageInputDTO): Promise<PrepareMessageOutputDTO>;
}

export interface ISaveModelReplyUseCase {
  execute(input: SaveModelReplyInputDTO): Promise<SaveModelReplyOutputDTO>;
}

export interface IGetSubChatUseCase {
  execute(chatId: string, subChatId: string, userId: string): Promise<any>;
}

export interface ISaveSubChatUseCase {
  execute(input: SaveSubChatInputDTO): Promise<any>;
}

export interface IGetChatDocumentsUseCase {
  execute(chatId: string, userId: string): Promise<{ documents: ChatDocument[] }>;
}

export interface IRemoveDocumentUseCase {
  execute(input: RemoveDocumentInputDTO): Promise<{ message: string }>;
}

export interface IUploadChatImageUseCase {
  execute(input: UploadChatImageInputDTO): Promise<UploadChatImageOutputDTO>;
}

export interface IStreamQuickChatUseCase {
  execute(input: StreamQuickChatInputDTO): Promise<AsyncIterable<any>>;
}

export interface IUploadDocumentUseCase {
  execute(input: UploadDocumentInputDTO): Promise<UploadDocumentOutputDTO>;
}

export interface IValidateChatAccessUseCase {
  execute(input: ValidateChatAccessInputDTO): Promise<ChatOutputDTO>;
}
