import axiosInstance from "../../../lib/axios";

export const submitFeedback = async (data: { content: string; rating?: number }) => {
  const response = await axiosInstance.post("/feedback", data);
  return response.data;
};
