import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/store";
import { checkAdminAuth } from "../features/auth/store/authSlice";

const AdminProtectedRoute: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAdminAuthenticated, isAdminLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAdminAuthenticated && isAdminLoading) {
      dispatch(checkAdminAuth());
    }
  }, [isAdminAuthenticated, isAdminLoading, dispatch]);

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
