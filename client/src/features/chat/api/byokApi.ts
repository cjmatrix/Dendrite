import api from "../../../lib/axios";

export interface UpdateByokKeysParams {
  provider: string;
  keys: string[];
}

export const updateByokKeys = async ({ provider, keys }: UpdateByokKeysParams): Promise<{ success: boolean; message?: string; [key: string]: unknown }> => {
  const res = await api.post("/auth/me/byok-keys", {
    provider,
    keys,
  });
  return res.data;
};

export const getByokKeys = async (provider: string = "gemini"): Promise<{ provider: string; keys: string[]; [key: string]: unknown }> => {
  const res = await api.get(`/auth/me/byok-keys?provider=${provider}`);
  return res.data.data;
};
