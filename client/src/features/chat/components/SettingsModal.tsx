import React, { useState, useEffect } from "react";
import { X, Key, User, Info, Loader2, ShieldCheck, Mail, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import { checkAuth } from "../../auth/store/authSlice";
import { createPortal } from "react-dom";
import { useUpdateByokKeys, useGetByokKeys } from "../hooks/useByokMutation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "profile" | "byok";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // 6 key slots initialized to empty strings
  const [keys, setKeys] = useState<string[]>(["", "", "", "", "", ""]);
  const [showKeys, setShowKeys] = useState<boolean[]>([false, false, false, false, false, false]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateByokMutation = useUpdateByokKeys();
  const { data: byokKeysData, isLoading: isLoadingKeys } = useGetByokKeys(
    "gemini",
    isOpen && activeTab === "byok" && user?.tier === "byok"
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && byokKeysData?.keys) {
      setKeys(byokKeysData.keys);
    }
  }, [isOpen, byokKeysData]);

  if (!isOpen) return null;

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index] = value;
    setKeys(newKeys);
  };

  const toggleShowKey = (index: number) => {
    const newShowKeys = [...showKeys];
    newShowKeys[index] = !newShowKeys[index];
    setShowKeys(newShowKeys);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
   
    const validKeys = keys.map(k => k.trim()).filter(k => k !== "");
    
    if (validKeys.length === 0) {
      setError("Please provide at least one Gemini API key.");
      return;
    }

    try {
      await updateByokMutation.mutateAsync({
        provider: "gemini",
        keys: validKeys
      });
      setSuccess("API keys successfully uploaded and securely stored!");
      

      await dispatch(checkAuth());
      
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      let errorMsg = "Failed to upload keys.";
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col md:flex-row bg-neutral-950 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl h-[550px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-zinc-900/30 border-r border-zinc-900 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Settings Center</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "profile"
                      ? "bg-zinc-800/60 text-white shadow-inner border border-zinc-700/50"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
                  }`}
                >
                  <User size={18} className={activeTab === "profile" ? "text-cyan-400" : ""} />
                  User Profile
                </button>
                <button
                  onClick={() => setActiveTab("byok")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "byok"
                      ? "bg-zinc-800/60 text-white shadow-inner border border-zinc-700/50"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20"
                  }`}
                >
                  <Key size={18} className={activeTab === "byok" ? "text-emerald-400" : ""} />
                  API Keys Settings
                </button>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="text-[10px] text-zinc-600 font-mono">
              Nurons Settings v1.0
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-neutral-950 p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
            <h2 className="text-xl font-bold text-zinc-100">
              {activeTab === "profile" ? "Profile Settings" : "API Keys Config"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 py-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-2xl shadow-lg shadow-cyan-500/5 select-none">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-200">{user?.name || "User"}</h4>
                    <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <Mail size={14} /> {user?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Account Status</span>
                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={16} /> Active / Verified
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Access Tier</span>
                    <div className="flex items-center mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                        user?.tier === "byok" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      }`}>
                        {user?.tier || "free"} Tier
                      </span>
                    </div>
                  </div>
                </div>

                {user?.tier === "byok" && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3">
                    <Info className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      <p className="font-semibold text-zinc-200 mb-1">BYOK Active Protection</p>
                      <p>You currently have <strong>{user.byokKeysCount || 0} keys</strong> uploaded. The system rotates requests among your keys automatically. If you hit a rate limit, the system switches instantly without disrupting your workflow.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "byok" && (
              <div className="space-y-4">
                {user?.tier !== "byok" ? (
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center text-center gap-3">
                    <AlertTriangle className="text-amber-500" size={32} />
                    <div className="space-y-1 max-w-md">
                      <h4 className="font-bold text-zinc-200">BYOK Key Management Locked</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        API Key uploading is only available to users subscribed to the <strong>BYOK (Bring Your Own Key)</strong> tier.
                        Please upgrade your subscription to manage your own keys and get infinite rate limits.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-start gap-3">
                      <Info className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-zinc-400 leading-relaxed">
                        <p className="font-medium text-emerald-300 mb-1">Gemini API Key pool</p>
                        <p>Upload up to <strong>6 Gemini API keys</strong>. At least one key must be filled. We encrypt keys at rest and cache them securely. Saving a new list will overwrite all previously saved keys.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                      {isLoadingKeys ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-10 gap-2 text-zinc-500">
                          <Loader2 className="animate-spin text-emerald-400" size={24} />
                          <span className="text-xs">Fetching secure API keys...</span>
                        </div>
                      ) : (
                        keys.map((key, index) => (
                          <div key={index} className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Key Slot {index + 1}</label>
                            <div className="relative flex items-center">
                              <input
                                type={showKeys[index] ? "text" : "password"}
                                value={key}
                                onChange={(e) => handleKeyChange(index, e.target.value)}
                                placeholder={`Gemini API Key ${index + 1}`}
                                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-3 pr-10 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowKey(index)}
                                className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                              >
                                {showKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {error && <p className="text-xs text-red-400 font-medium mt-2">{error}</p>}
                    {success && <p className="text-xs text-emerald-400 font-medium mt-2">{success}</p>}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {activeTab === "byok" && user?.tier === "byok" && (
              <button
                onClick={handleSave}
                disabled={updateByokMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
              >
                {updateByokMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Save Keys
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,document.body
  );
};
