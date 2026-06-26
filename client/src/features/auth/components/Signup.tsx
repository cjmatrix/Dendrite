import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { clearError } from "../store/authSlice";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuthMutations } from "../hooks/useAuthMutations";
import type { SignupRequest } from "../types/auth.types";
import "../styles/auth.css";

const Signup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { error ,isAuthenticated} = useAppSelector((state) => state.auth);
  const { signupMutation } = useAuthMutations();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupRequest>();

  useEffect(() => {
      if (isAuthenticated) {
        navigate("/");
      }
    }, [isAuthenticated, navigate]);

  const onSubmit = (data: SignupRequest) => {
    dispatch(clearError());
    signupMutation.mutate(data);
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--theme-bg-base)]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-white/10 bg-[var(--theme-bg-surface)]/80 backdrop-blur-xl shadow-2xl my-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Create Account
          </h1>
          <p className="text-gray-400">Join Dentrites AI today</p>
        </div>

        {(error || signupMutation.error) && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              {(signupMutation.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message || (signupMutation.error as { message?: string } | null)?.message || error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className="w-full pl-11 pr-4 py-3 bg-[var(--theme-bg-elevated)] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="email"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                className="w-full pl-11 pr-4 py-3 bg-[var(--theme-bg-elevated)] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
                })}
                className="w-full pl-11 pr-12 py-3 bg-[var(--theme-bg-elevated)] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", { 
                  required: "Please confirm your password",
                  validate: (val: string | undefined) =>
                    watch("password") === val || "Your passwords do not match",
                })}
                className="w-full pl-11 pr-12 py-3 bg-[var(--theme-bg-elevated)] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full py-3.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {signupMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account
                <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              <span className="px-4 bg-[var(--theme-bg-surface)] text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton />
        </div>

        <p className="mt-8 text-center text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
