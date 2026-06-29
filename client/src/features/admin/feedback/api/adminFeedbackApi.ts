import axiosInstance from "../../../../lib/axios";

export interface IFeedback {
  _id: string;
  userId: { _id: string; username: string; email: string };
  content: string;
  rating?: number;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: string;
}

export const getAllFeedback = async (): Promise<IFeedback[]> => {
  const response = await axiosInstance.get("/admin/feedback");
  return response.data.data;
};

export const updateFeedbackStatus = async (id: string, status: 'new' | 'reviewed' | 'resolved'): Promise<IFeedback> => {
  const response = await axiosInstance.put(`/admin/feedback/${id}/status`, { status });
  return response.data.data;
};
