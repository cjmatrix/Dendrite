import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/store";
import { forceAdminLogout } from "../store/authSlice";
import { authApi } from "../api/auth.api";

export const useAdminLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.adminLogout(),
    onSuccess: () => {
      dispatch(forceAdminLogout());
      navigate("/admin/login");
    },
    onError: () => {
      dispatch(forceAdminLogout());
      navigate("/admin/login");
    },
  });
};