import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAppDispatch } from "./store/store";
import { checkAuth, forceLogout } from "./store/authSlice";
import { onMessageListener } from "./firebase";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import ChatWindow from "./components/ChatWindow";
import EmptyChatState from "./components/EmptyChatState";
import RecallPage from "./pages/RecallPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import SplitFileViewer from "./components/SplitFileViewer";
import { useQueryClient } from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Signup />,
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
          
          // Dispatch global event for animations (Tracer/Count)
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
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
