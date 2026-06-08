import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch } from "./store/store";
import { checkAuth, checkAdminAuth, forceLogout } from "./features/auth/store/authSlice";
import { onMessageListener } from "./lib/firebase";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { router } from "./routes";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkAdminAuth());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(forceLogout());
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [dispatch]);

   const queryClient = useQueryClient();
  useEffect(() => {
    const listenForMessages = async () => {
      try {
        const payload: any = await onMessageListener();
        if (payload?.notification) {
          queryClient.invalidateQueries({queryKey:["dueCards"]});

          toast.success(`${payload.notification.body}`, {
            duration: 6000,
            position: "bottom-right",
            icon: "🧠",
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
          
          queryClient.invalidateQueries({ queryKey: ["recallCount"] });
          window.dispatchEvent(new CustomEvent('recall:notification-pushed'));
        }
      
        listenForMessages();
      } catch (err) {
        console.error("Error in foreground message listener:", err);
      }
    };

    listenForMessages();
  }, []);

  return (
    <>
     <Sentry.ErrorBoundary 
      fallback={<p>Something went wrong. Our team has been notified!</p>}
    >
     <Toaster />
      <RouterProvider router={router} />
      
    </Sentry.ErrorBoundary>
     
    </>
  );
}

export default App;
