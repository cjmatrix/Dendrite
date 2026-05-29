import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ChatPage from "./layouts/ChatPage";
import AdminPage from "./layouts/AdminPage";
import Login from "./features/auth/components/Login";
import Signup from "./features/auth/components/Signup";
import OtpPage from "./features/auth/components/OtpPage";
import AdminLogin from "./features/auth/components/AdminLogin";
import { useAppDispatch } from "./store/store";
import { checkAuth, checkAdminAuth, forceLogout } from "./features/auth/store/authSlice";
import { onMessageListener } from "./lib/firebase";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import ChatWindow from "./features/chat/components/ChatWindow";
import EmptyChatState from "./features/chat/components/EmptyChatState";
import AdminDashboardPage from "./features/admin/dashboard/AdminDashboardPage";
import UserManagementPage from "./features/admin/user/UserManagementPage";
import UserViewPage from "./features/admin/user/UserViewPage";

import KnowledgeGraphPage from "./features/graph/components/KnowledgeGraphPage";
import SplitFileViewer from "./features/chat/components/SplitFileViewer";
import { useQueryClient } from "@tanstack/react-query";

import * as Sentry from "@sentry/react";


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/admin",
    element: <AdminProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminPage />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: "users",
            element: <UserManagementPage />,
          },
          {
            path: "users/:id",
            element: <UserViewPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/register",
    element: <Signup />,
  },
  {
    path: "/verify-otp",
    element: <OtpPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ChatPage />,
        children:[
          {
            index:true,
            element:<EmptyChatState></EmptyChatState>
          },
         
          {
            path: "graph/:folderId",
            element: <KnowledgeGraphPage />
          },
          {
            path:"/:id/view-file",
            element:<SplitFileViewerWrapper></SplitFileViewerWrapper>
          },
          {
            path:"/:id",
            element:<ChatWindow></ChatWindow>
          }
        ]
        
      },
    ],
  },
]);

function SplitFileViewerWrapper() {
  const fileData = sessionStorage.getItem('splitViewFile');
  if (!fileData) {
    return <ChatWindow />;
  }
  const { url, name } = JSON.parse(fileData);
  return <SplitFileViewer fileUrl={url} fileName={name} />;
}

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
