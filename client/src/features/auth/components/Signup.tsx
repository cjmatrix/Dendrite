import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { clearError } from "../store/authSlice";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuthMutations } from "../hooks/useAuthMutations";
import DendritesLogo from "../../../components/DendritesLogo";
import type { SignupRequest } from "../types/auth.types";
import "../styles/auth.css";

const Signup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { error, isAuthenticated } = useAppSelector((state) => state.auth);
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
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0c10] text-gray-100 p-4">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none" />

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
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Join Dentrites AI & build your smart knowledge workspace
          </p>
        </div>

        {(error || signupMutation.error) && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">
              {(signupMutation.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message || (signupMutation.error as { message?: string } | null)?.message || error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className="w-full pl-11 pr-4 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="text-xs text-rose-400 mt-1 ml-0.5">{errors.name.message}</p>}
          </div>

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
                    message: "Invalid email address"
                  }
                })}
                className="w-full pl-11 pr-4 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-400 mt-1 ml-0.5">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-0.5 mb-1 block">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" }
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
            {errors.password && <p className="text-xs text-rose-400 mt-1 ml-0.5">{errors.password.message}</p>}
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
                  validate: (val: string | undefined) =>
                    watch("password") === val || "Your passwords do not match",
                })}
                className="w-full pl-11 pr-12 py-3 bg-[#181922] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-sm transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1 ml-0.5">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer mt-2"
          >
            {signupMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account
                <UserPlus className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <GoogleSignInButton />

        <p className="mt-8 text-center text-xs sm:text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

