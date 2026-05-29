import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/store";

const AdminProtectedRoute: React.FC = () => {
  const { isAdminAuthenticated, isAdminLoading } = useAppSelector((state) => state.auth);

  if (isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1c]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return isAdminAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;
