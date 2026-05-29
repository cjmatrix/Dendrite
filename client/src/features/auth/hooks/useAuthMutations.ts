import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/store";
import { login as loginAction, adminLogin as adminLoginAction } from "../store/authSlice";
import { authApi } from "../api/auth.api";
import type { LoginRequest, SignupRequest, AdminLoginRequest } from "../types/auth.types";

export const useAuthMutations = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const signupMutation = useMutation({
        mutationFn: (data: SignupRequest) => authApi.signup(data),
        onSuccess: (_response, variables) => {
            const email = variables.email;
            sessionStorage.setItem("pending_signup", JSON.stringify({ email }));
            
            const cooldownEnd = Date.now() + 60 * 1000;
            localStorage.setItem(`otp_cooldown_end:${email}`, cooldownEnd.toString());

            navigate("/verify-otp", { state: { email } });
        }
    });

    const loginMutation = useMutation({
        mutationFn: (credentials: LoginRequest) => 
            dispatch(loginAction(credentials)).unwrap(),
        onSuccess: () => {
            navigate("/");
        }
    });

    const adminLoginMutation = useMutation({
        mutationFn: (credentials: AdminLoginRequest) => 
            dispatch(adminLoginAction(credentials)).unwrap(),
        onSuccess: () => {
            navigate("/admin");
        }
    });

    return {
        signupMutation,
        loginMutation,
        adminLoginMutation
    };
};

