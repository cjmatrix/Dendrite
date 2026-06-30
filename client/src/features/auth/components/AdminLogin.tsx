import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { clearAdminError } from "../store/authSlice";
import { useAuthMutations } from "../hooks/useAuthMutations";
import type { AdminLoginRequest } from "../types/auth.types";
import "../styles/auth.css";

const AdminLogin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAdminError, isAdminAuthenticated, admin } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { adminLoginMutation } = useAuthMutations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginRequest>();

  useEffect(() => {
    dispatch(clearAdminError());
  }, [dispatch]);

  useEffect(() => {
    if (isAdminAuthenticated && admin?.role === "admin") {
      navigate("/admin");
    }
  }, [isAdminAuthenticated, admin, navigate]);

  const onSubmit = (data: AdminLoginRequest) => {
    dispatch(clearAdminError());
    adminLoginMutation.mutate(data);
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510]">
      {/* Visual background orbs specialized for Admin Portal */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[130px] animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse duration-[6s]" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-blue-500/20 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-blue-500/5">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Admin Console
          </h1>
          <p className="text-zinc-400 text-sm">Secure Terminal Sign In</p>
        </div>

        {isAdminError && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-400">{isAdminError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 ml-1">
              Terminal Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                {...register("email", { 
                  required: "Terminal email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email format"
                  }
                })}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono text-sm"
                placeholder="admin@dentrites.ai"
              />
            </div>
            {errors.email && <p className="text-[10px] text-blue-500 mt-1 ml-1 font-mono uppercase">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 ml-1">
              Access Code
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                {...register("password", { required: "Access code is required" })}
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-[10px] text-blue-500 mt-1 ml-1 font-mono uppercase">{errors.password.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={adminLoginMutation.isPending}
              className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] border border-blue-500/30 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {adminLoginMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Login In
                  <ShieldAlert className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
