import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, RotateCw, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../../lib/axios";
import "../styles/auth.css";

const OtpPage: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  
  const pendingData = location.state || JSON.parse(sessionStorage.getItem("pending_signup") || "null");
  const email = pendingData?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    inputRefs.current[0]?.focus();

   
    const savedCooldownEnd = localStorage.getItem(`otp_cooldown_end:${email}`);
    if (savedCooldownEnd) {
      const remaining = Math.ceil((Number(savedCooldownEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, [email, navigate]);


  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; 

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const newOtp = pasteData.split("");
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/auth/send-otp", { email });
      setSuccess("A fresh OTP has been sent to your email!");
      
      const cooldownEnd = Date.now() + 60 * 1000;
      localStorage.setItem(`otp_cooldown_end:${email}`, cooldownEnd.toString());
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      
      await api.post("/auth/verify-otp", { email, otp: otpString });

    
      sessionStorage.removeItem("pending_signup");
      localStorage.removeItem(`otp_cooldown_end:${email}`);


      setSuccess("Account activated successfully! Redirecting you to login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--theme-bg-base)]">
      {/* Visual Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[120px]" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl border border-white/10 bg-[var(--theme-bg-surface)]/80 backdrop-blur-xl shadow-2xl my-8">
        <button
          onClick={() => navigate("/register")}
          className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to signup
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-gray-400 text-sm">
            We sent a verification code to <span className="text-indigo-400 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 max-w-xs mx-auto">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el: HTMLInputElement | null) => {
                  if (el) inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold bg-[var(--theme-bg-elevated)] border border-white/5 focus:border-indigo-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full py-3 px-4 bg-linear-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all mt-6 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isLoading}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:text-gray-600 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                Resend Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
