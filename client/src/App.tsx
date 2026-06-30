import { RouterProvider } from "react-router-dom";
import { useEffect, Suspense } from "react";
import { useAppDispatch } from "./store/store";
import { checkAuth, forceLogout, forceAdminLogout } from "./features/auth/store/authSlice";
import { messaging } from "./lib/firebase";
import { onMessage } from "firebase/messaging";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { router } from "./routes";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(forceLogout());
    };
    const handleAdminSessionExpired = () => {
      dispatch(forceAdminLogout());
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    window.addEventListener("admin-auth:session-expired", handleAdminSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      window.removeEventListener("admin-auth:session-expired", handleAdminSessionExpired);
    };
  }, [dispatch]);

  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
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
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient]);

  return (
    <>
     <Sentry.ErrorBoundary 
      fallback={<p>Something went wrong. Our team has been notified!</p>}
    >
     <Toaster />
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-zinc-950"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div></div>}>
        <RouterProvider router={router} />
      </Suspense>
    </Sentry.ErrorBoundary>
     
    </>
  );
}

export default App;
