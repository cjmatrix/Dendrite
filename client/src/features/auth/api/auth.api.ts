import api from "../../../lib/axios";
import type { 
    LoginRequest, 
    LoginResponse, 
    SignupRequest, 
    SignupResponse,
    AdminLoginRequest,
    AdminLoginResponse,
    ResetPasswordRequest
} from "../types/auth.types";

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post("/auth/login", credentials);
        return response.data;
    },
    
    signup: async (userData: SignupRequest): Promise<SignupResponse> => {
        const response = await api.post("/auth/register", userData);
        return response.data;
    },

    adminLogin: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
        const response = await api.post("/auth/admin/login", credentials);
        return response.data;
    },

    adminLogout: async (): Promise<void> => {
        await api.post("/admin/auth/logout");
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post("/auth/forgot-password", { email });
        return response.data;
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.post("/auth/reset-password", data);
        return response.data;
    },
};
