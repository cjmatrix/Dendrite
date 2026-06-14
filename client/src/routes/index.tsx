import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import ChatPage from "../layouts/ChatPage";
import AdminPage from "../layouts/AdminPage";
import Login from "../features/auth/components/Login";
import Signup from "../features/auth/components/Signup";
import OtpPage from "../features/auth/components/OtpPage";
import AdminLogin from "../features/auth/components/AdminLogin";
import ChatWindow from "../features/chat/components/ChatWindow";
import EmptyChatState from "../features/chat/components/EmptyChatState";
import AdminDashboardPage from "../features/admin/dashboard/AdminDashboardPage";
import UserManagementPage from "../features/admin/user/UserManagementPage";
import UserViewPage from "../features/admin/user/UserViewPage";
import KnowledgeGraphPage from "../features/graph/components/KnowledgeGraphPage";
import SplitFileViewer from "../features/chat/components/SplitFileViewer";

function SplitFileViewerWrapper() {
  const fileData = sessionStorage.getItem('splitViewFile');
  if (!fileData) {
    return <ChatWindow />;
  }
  const { url, name } = JSON.parse(fileData);
  return <SplitFileViewer fileUrl={url} fileName={name} />;
}

export const router = createBrowserRouter([
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
    path: "/share/:token",
    element: <ChatPage />,
    children: [
      {
        index: true,
        element: <EmptyChatState />,
      },
      {
        path: "chat/:id",
        element: <SplitFileViewerWrapper />,
      },
    ]
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ChatPage />,
        children: [
          {
            index: true,
            element: <EmptyChatState />
          },
          {
            path: "graph/:folderId",
            element: <KnowledgeGraphPage />
          },
          {
            path: "/:id/view-file",
            element: <SplitFileViewerWrapper />
          },
          {
            path: "/:id",
            element: <ChatWindow />
          }
        ]
      },
    ],
  },
]);
