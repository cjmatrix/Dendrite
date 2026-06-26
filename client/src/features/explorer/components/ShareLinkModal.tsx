import React, { useState } from "react";
import { X, Copy, Check, Link, Shield } from "lucide-react";
import { createSharedLink } from "../api/shareLinkApi";
import { createPortal } from "react-dom";
interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "chat" | "folder";
  targetName: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetName,
}) => {
  const [sharingPolicy, setSharingPolicy] = useState<"READ_ONLY" | "READ_WRITE" | "INVISIBLE">("READ_ONLY");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const linkData = await createSharedLink({
        targetId,
        targetType,
        behaviorSharingPolicy: sharingPolicy,
      });
      const origin = window.location.origin;
      setGeneratedLink(`${origin}/share/${linkData.token}`);
    } catch (err: unknown) {
      console.error(err);
      let errorMsg = "Failed to generate shared link";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMsg = response.data.message;
        }
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Link size={18} className="text-cyan-400" />
          Share {targetType === "chat" ? "Chat" : "Folder"}
        </h3>
        <p className="text-xs text-zinc-500 mb-6 truncate">
          {targetName}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        {!generatedLink ? (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Sharing Policy
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSharingPolicy("READ_ONLY")}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    sharingPolicy === "READ_ONLY"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-white"
                      : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <Shield size={16} className={`mt-0.5 ${sharingPolicy === "READ_ONLY" ? "text-cyan-400" : "text-zinc-500"}`} />
                  <div>
                    <div className="text-xs font-bold">Read Only</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      Recipients can view the content, messages, and layout, but cannot chat or run custom prompt workflows.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-900/20 active:scale-98"
            >
              {isLoading ? "Generating Link..." : "Create Shareable Link"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Link Created (Expires in 30 days)
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-300 font-medium"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 rounded-lg border border-zinc-800 transition-colors shrink-0 flex items-center justify-center"
                  title="Copy link to clipboard"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setGeneratedLink(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-all"
              >
                Create New Link
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,document.body
  );
};
