import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/axios";
import { useAppDispatch } from "../../../store/store";
import { checkAuth } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleSignInButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Dynamically inject the Google client script if not already present
    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        setError(null);
        // Send the Google idToken to backend
        await api.post("/auth/google", { idToken: response.credential });
        
        // Sync user state in Redux
        await dispatch(checkAuth()).unwrap();
        
        // Redirect to homepage
        navigate("/");
      } catch (err: any) {
        console.error("Google authentication failed", err);
        setError(err.response?.data?.message || "Google authentication failed. Please try again.");
      }
    };

    const initializeGoogleSignIn = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn("VITE_GOOGLE_CLIENT_ID environment variable is missing.");
        return;
      }

      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "filled_black",
            size: "large",
            width: 320,
            shape: "rectangular",
          });
        }
      }
    };

    // Initialize once script is loaded
    const checkGoogleInterval = setInterval(() => {
      if (window.google) {
        initializeGoogleSignIn();
        clearInterval(checkGoogleInterval);
      }
    }, 100);

    return () => clearInterval(checkGoogleInterval);
  }, [dispatch, navigate]);

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-6">
      <div className="flex items-center w-full gap-3">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs uppercase tracking-wider text-gray-500 font-bold select-none">
          or continue with
        </span>
        <div className="h-px bg-white/10 flex-1" />
      </div>
      
      {error && (
        <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div ref={buttonRef} className="w-full min-h-[44px] flex justify-center items-center overflow-hidden rounded-xl" />
    </div>
  );
};
