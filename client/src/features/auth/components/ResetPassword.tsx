import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuthMutations } from "../hooks/useAuthMutations";
import DendritesLogo from "../../../components/DendritesLogo";
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
    } catch (err: unknown) {
      let errorMsg = "Failed to reset password.";
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
      setError(errorMsg);
    }
  };

  if (!email || !token) {
    return (
      <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0c10] text-gray-100 p-4">
        <div className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full bg-rose-950/20 blur-[150px] pointer-events-none" />
        <div className="auth-card relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl border border-white/10 bg-[#121318]/90 backdrop-blur-2xl shadow-2xl text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
            This password reset link is invalid, incomplete, or has expired. Please request a new link from the Sign In page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl border border-zinc-700 transition-all cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Enter your new secure password below
          </p>
        </div>

        {success ? (
          <div className="text-center py-2">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Password Reset Complete
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
              {success}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
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
                    className="w-full pl-11 pr-12 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1 ml-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (val) => val === password || "Passwords do not match",
                    })}
                    className="w-full pl-11 pr-12 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1 ml-0.5">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
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

