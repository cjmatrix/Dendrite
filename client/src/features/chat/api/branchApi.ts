import api from "../../../lib/axios";

export const inheritContext = async (chatId: string, contextParentId: string): Promise<void> => {
  await api.patch(`/branch/inherit/${chatId}`, { contextParentId });
};

export const unlinkInheritance = async (chatId: string): Promise<void> => {
  await api.patch(`/branch/unlink/${chatId}`);
};
