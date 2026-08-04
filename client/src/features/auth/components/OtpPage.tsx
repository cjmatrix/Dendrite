import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, RotateCw, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../../lib/axios";
import DendritesLogo from "../../../components/DendritesLogo";
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
    } catch (err: unknown) {
      let errorMsg = "Failed to resend OTP";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMsg = response.data.message;
        }
      }
      setError(errorMsg);
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
    } catch (err: unknown) {
      let errorMsg = "Invalid or expired OTP";
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0b0c10] text-gray-100 p-4">
      {/* Visual Background Orbs */}
      <div className="absolute top-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none" />

      <div className="auth-card relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl border border-white/10 bg-[#121318]/90 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] my-6">
        <button
          onClick={() => navigate("/register")}
          className="group flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to signup
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="mb-4 cursor-pointer p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl hover:border-white/20 transition-all shadow-xl group"
            onClick={() => navigate("/")}
          >
            <DendritesLogo size={36} className="text-purple-400 group-hover:scale-105 transition-transform" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1.5 font-sans">
            Verify Email
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            We sent a 6-digit code to <span className="text-purple-400 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">{success}</p>
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
                className="w-12 h-14 text-center text-2xl font-bold bg-[#181922] border border-white/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white focus:outline-none transition-all"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all mt-6 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs sm:text-sm text-zinc-400">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isLoading}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:text-zinc-600 disabled:cursor-not-allowed inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
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

