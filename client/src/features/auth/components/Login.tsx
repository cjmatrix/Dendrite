import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, LogIn, AlertCircle, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { clearError } from "../store/authSlice";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuthMutations } from "../hooks/useAuthMutations";
import DendritesLogo from "../../../components/DendritesLogo";
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
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (err: unknown) {
      let errorMsg = "Failed to send reset link";
      if (err && typeof err === "object") {
        if ("response" in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          if (response?.data?.message) {
            errorMsg = response.data.message;
          }
        } else if ("message" in err) {
          errorMsg = (err as { message: string }).message;
        }
      }
      setForgotError(errorMsg);
    }
  };
  
  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0c10] text-gray-100 p-4">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl border border-white/10 bg-[#121318]/90 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] my-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="mb-4 cursor-pointer p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl hover:border-white/20 transition-all shadow-xl group"
            onClick={() => navigate("/")}
          >
            <DendritesLogo size={36} className="text-purple-400 group-hover:scale-105 transition-transform" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1.5 font-sans">
            {isForgotPassword ? "Forgot Password" : "Welcome back"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            {isForgotPassword
              ? "Enter your email to receive a password reset link"
              : "Sign in to access your Dentrites AI workspace"}
          </p>
        </div>

        {isForgotPassword ? (
          forgotSuccess ? (
            <div className="text-center py-2">
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Reset Link Sent
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
                {forgotSuccess}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotSuccess(null);
                  setForgotError(null);
                }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <div>
              {forgotError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">{forgotError}</p>
                </div>
              )}

              <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
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
                      className="w-full pl-11 pr-4 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  {forgotErrors.email && (
                    <p className="text-xs text-rose-400 mt-1 ml-0.5">
                      {forgotErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                className="mt-5 w-full py-3 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          )
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
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
                    className="w-full pl-11 pr-4 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1 ml-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-0.5 mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      dispatch(clearError());
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="w-full pl-11 pr-12 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1 ml-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
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

            <GoogleSignInButton />

            <p className="mt-8 text-center text-xs sm:text-sm text-zinc-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                Create account
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

