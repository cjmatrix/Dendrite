import api from "./axios";


export const streamingFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
 
  const response = await fetch(url, {
    ...options,
    credentials: "include", 
  });

  if (response.status === 401) {
    try {
      console.log("[StreamingFetch] 401 Detected. Attempting silent refresh...");
       
      await api.post("/auth/refresh");

      console.log("[StreamingFetch] Refresh successful. Retrying original request...");
     
      return await fetch(url, {
        ...options,
        credentials: "include",
      });
    } catch (refreshError) {
      console.error("[StreamingFetch] Silent refresh failed:", refreshError);
      return response;
    }
  }

  return response;
};
