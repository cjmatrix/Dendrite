import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProtectedRoute from "../components/AdminProtectedRoute";

const ChatPage = lazy(() => import("../layouts/ChatPage"));
const AdminPage = lazy(() => import("../layouts/AdminPage"));
const Login = lazy(() => import("../features/auth/components/Login"));
const Signup = lazy(() => import("../features/auth/components/Signup"));
const OtpPage = lazy(() => import("../features/auth/components/OtpPage"));
const AdminLogin = lazy(() => import("../features/auth/components/AdminLogin"));
const ResetPassword = lazy(() => import("../features/auth/components/ResetPassword"));
const ChatWindow = lazy(() => import("../features/chat/components/ChatWindow"));
const EmptyChatState = lazy(() => import("../features/chat/components/EmptyChatState"));
const AdminDashboardPage = lazy(() => import("../features/admin/dashboard/AdminDashboardPage"));
const SystemHealthPage = lazy(() => import("../features/admin/dashboard/SystemHealthPage").then(module => ({ default: module.SystemHealthPage })));
const UserManagementPage = lazy(() => import("../features/admin/user/UserManagementPage"));
const UserViewPage = lazy(() => import("../features/admin/user/UserViewPage"));
const RateLimitManagementPage = lazy(() => import("../features/admin/rate-limits/RateLimitManagementPage"));
const FeedbackManagementPage = lazy(() => import("../features/admin/feedback/FeedbackManagementPage"));
const KnowledgeGraphPage = lazy(() => import("../features/graph/components/KnowledgeGraphPage"));
const SplitFileViewer = lazy(() => import("../features/chat/components/SplitFileViewer"));
const BillingPage = lazy(() => import("../features/billing/components/BillingPage"));
const DendritesLanding = lazy(() => import("../features/Landing/DendritesLanding").then(module => ({ default: module.DendritesLanding })));

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
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
     path:"/home",
     element:<DendritesLanding></DendritesLanding>
  }
 ,

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
          {
            path: "rate-limits",
            element: <RateLimitManagementPage />,
          },
          {
            path: "health",
            element: <SystemHealthPage />,
          },
          {
            path: "feedback",
            element: <FeedbackManagementPage />,
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
      {
        path: "/billing",
        element: <BillingPage />,
      },
    ],
  },
]);
