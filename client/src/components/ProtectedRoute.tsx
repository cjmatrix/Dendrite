import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/store";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1c]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/home" replace/>;
};

export default ProtectedRoute;
