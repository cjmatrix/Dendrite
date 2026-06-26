import api from "./axios";
import toast from "react-hot-toast";

export const streamingFetch = async (url: string, options: RequestInit = {}, controller?: AbortController): Promise<Response> => {
 
  let response = await fetch(url, {
    ...options,
    credentials: "include", 
    signal: controller?.signal
  });

  if (response.status === 401) {
    try {
      console.log("[StreamingFetch] 401 Detected. Attempting silent refresh...");
       
      await api.post("/auth/refresh");

      console.log("[StreamingFetch] Refresh successful. Retrying original request...");
     
      response = await fetch(url, {
        ...options,
        credentials: "include",
        signal: controller?.signal
      });
    } catch (refreshError) {
      console.error("[StreamingFetch] Silent refresh failed:", refreshError);
      return response;
    }
  }

  if (!response.ok) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      let errorMsg = "";
      if (data.error) {
        errorMsg = data.error;
      } else if (data.message) {
        errorMsg = data.message;
      } else if (Array.isArray(data.errors)) {
        errorMsg = data.errors.map((e: { message?: string } | string) => (typeof e === 'string' ? e : e?.message || String(e))).join(", ");
      } else {
        errorMsg = response.status === 429 
          ? "Daily usage limit reached. Please try again later."
          : `Request failed with status ${response.status}`;
      }
      toast.error(errorMsg,{
         style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid #3f3f46",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
          },
      });
    } catch {
      const fallbackMsg = response.status === 429
        ? "Daily usage limit reached. Please try again later."
        : `Request failed with status ${response.status} (${response.statusText || 'Error'})`;
      toast.error(fallbackMsg,{
         style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid #3f3f46",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
          },
      });
    }
  }

  return response;
};
