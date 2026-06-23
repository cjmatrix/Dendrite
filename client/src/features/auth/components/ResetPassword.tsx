import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuthMutations } from "../hooks/useAuthMutations";
import type { ResetPasswordRequest } from "../types/auth.types";
import "../styles/auth.css";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPasswordMutation } = useAuthMutations();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    defaultValues: {
      email: email || "",
      token: token || "",
    }
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordRequest) => {
    setError(null);
    setSuccess(null);
    if (!email || !token) {
      setError("Invalid password reset link. Missing email or token.");
      return;
    }
    try {
      const res = await resetPasswordMutation.mutateAsync({
        email,
        token,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      setSuccess(res.message || "Your password has been successfully reset.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to reset password.");
    }
  };

  if (!email || !token) {
    return (
      <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-(--theme-bg-base)">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-white/10 bg-(--theme-bg-surface)/80 backdrop-blur-xl shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invalid Reset Link</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            This password reset link is invalid, incomplete, or has expired. Please request a new link from the Sign In page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-white/5 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-(--theme-bg-base)">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-white/10 bg-(--theme-bg-surface)/80 backdrop-blur-xl shadow-2xl">
        {success ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Password Reset Complete
            </h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {success}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Reset Password
              </h1>
              <p className="text-gray-400 text-sm">Enter your new secure password below</p>
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
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    className="w-full pl-11 pr-12 py-3 bg-(--theme-bg-elevated) border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (val) => val === password || "Passwords do not match",
                    })}
                    className="w-full pl-11 pr-12 py-3 bg-(--theme-bg-elevated) border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
