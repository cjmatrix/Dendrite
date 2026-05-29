
import { ApiChatRepository } from "./infrastructure/repositories/ApiChatRepository";
import { ApiRecallRepository } from "./infrastructure/repositories/ApiRecallRepository";
import { ApiBranchRepository } from "./infrastructure/repositories/ApiBranchRepository";
import { ApiFolderRepository, ApiChatListRepository, ApiRecallCountRepository } from "./infrastructure/repositories/ApiExplorerRepository";
import { ApiQuickChatRepository } from "./infrastructure/repositories/ApiQuickChatRepository";

import type { IChatRepository, IRecallRepository, IBranchRepository } from "./domain/repositories/IChatRepository";
import type { IFolderRepository, IChatListRepository, IRecallCountRepository } from "./domain/repositories/IExplorerRepository";
import type { IQuickChatRepository } from "./domain/repositories/IQuickChatRepository";

export const chatRepository: IChatRepository = new ApiChatRepository();
export const recallRepository: IRecallRepository = new ApiRecallRepository();
export const branchRepository: IBranchRepository = new ApiBranchRepository();
export const folderRepository: IFolderRepository = new ApiFolderRepository();
export const chatListRepository: IChatListRepository = new ApiChatListRepository();
export const recallCountRepository: IRecallCountRepository = new ApiRecallCountRepository();
export const quickChatRepository: IQuickChatRepository = new ApiQuickChatRepository();
