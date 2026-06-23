export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'admin';
    status: string;
}

export interface LoginRequest {
    email: string;
    password?: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        user: User;
        accessToken: string;
    };
    message: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password?: string;
    confirmPassword?: string;
}

export interface SignupResponse {
    success: boolean;
    data: {
        email: string;
    };
    message: string;
}

export interface AdminLoginRequest {
    email: string;
    password?: string;
}

export interface AdminLoginResponse {
    success: boolean;
    data: {
        admin: AdminUser;
        accessToken: string;
    };
    message: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    password?: string;
    confirmPassword?: string;
}
