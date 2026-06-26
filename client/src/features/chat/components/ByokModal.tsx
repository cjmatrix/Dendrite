import React, { useState } from "react";
import { X, Key, Plus, Trash2, Loader2, Info } from "lucide-react";
import api from "../../../lib/axios";

interface ByokModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ByokModal: React.FC<ByokModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddKey = () => {
    if (keys.length < 4) {
      setKeys([...keys, ""]);
    }
  };

  const handleRemoveKey = (index: number) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1);
    if (newKeys.length === 0) newKeys.push("");
    setKeys(newKeys);
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index] = value;
    setKeys(newKeys);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    const validKeys = keys.filter(k => k.trim() !== "");
    
    if (validKeys.length === 0) {
      setError("Please provide at least one API key.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/me/byok-keys", {
        provider: "gemini",
        keys: validKeys
      });
      setSuccess("Keys successfully uploaded and securely stored!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      let errorMsg = "Failed to upload keys.";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-(--theme-bg-primary) border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Key className="text-emerald-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-100">Upload BYOK Keys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-blue-200">
              <p className="font-medium mb-1">Bring Your Own Key (Gemini)</p>
              <p>Upload up to 4 Gemini API keys from Google AI Studio. We will automatically rotate them if you hit a rate limit.</p>
            </div>
          </div>

          <div className="space-y-3">
            {keys.map((key, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder={`Gemini API Key ${index + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={() => handleRemoveKey(index)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  disabled={keys.length === 1 && key === ""}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {keys.length < 4 && (
            <button
              onClick={handleAddKey}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus size={14} /> Add another key
            </button>
          )}

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
          {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
            Save Keys
          </button>
        </div>
      </div>
    </div>
  );
};
