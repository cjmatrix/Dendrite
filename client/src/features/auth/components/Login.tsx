import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, LogIn, AlertCircle, Loader2, Key, ArrowLeft, CheckCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { clearError } from "../store/authSlice";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuthMutations } from "../hooks/useAuthMutations";
import type { LoginRequest } from "../types/auth.types";
import "../styles/auth.css";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const { error, isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { loginMutation, forgotPasswordMutation } = useAuthMutations();

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgotForm,
  } = useForm<{ email: string }>();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data: LoginRequest) => {
    dispatch(clearError());
    loginMutation.mutate(data);
  };

  const onForgotSubmit = async (data: { email: string }) => {
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await forgotPasswordMutation.mutateAsync(data.email);
      setForgotSuccess(res.message || "Reset link sent successfully!");
      resetForgotForm();
    } catch (err: any) {
      setForgotError(err?.response?.data?.message || err?.message || "Failed to send reset link");
    }
  };
  
  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-(--theme-bg-base)">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-white/10 bg-(--theme-bg-surface)/80 backdrop-blur-xl shadow-2xl">
        
        {isForgotPassword ? (
          forgotSuccess ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Reset Link Sent
              </h1>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                {forgotSuccess}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotSuccess(null);
                  setForgotError(null);
                }}
                className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Key className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Forgot Password
                </h1>
                <p className="text-gray-400">Enter your email to receive a password reset link</p>
              </div>

              {forgotError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{forgotError}</p>
                </div>
              )}

              <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      {...registerForgot("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className="w-full pl-11 pr-4 py-3 bg-(--theme-bg-elevated) border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      {forgotErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {forgotPasswordMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotSuccess(null);
                  setForgotError(null);
                }}
                className="mt-6 w-full py-3 bg-zinc-900/60 hover:bg-zinc-800/60 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          )
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-gray-400">Sign in to access your Dentrites AI</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-(--theme-bg-elevated) border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-(--theme-bg-elevated) border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.password.message}
                  </p>
                )}
                
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      dispatch(clearError());
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-(--theme-bg-surface) text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <GoogleSignInButton />
            </div>

            <p className="mt-8 text-center text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
