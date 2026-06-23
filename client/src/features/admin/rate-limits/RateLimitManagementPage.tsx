import { useState, useEffect } from "react";
import { useGetRateLimits } from "./hook/useGetRateLimits";
import { useUpdateRateLimit } from "./hook/useUpdateRateLimit";
import { ShieldAlert, Save, RefreshCw, Layers, Cpu, ShieldCheck } from "lucide-react";

export default function RateLimitManagementPage() {
  const { data: rateLimits, isLoading, isError, refetch } = useGetRateLimits();
  const updateRateLimitMutation = useUpdateRateLimit();

  const [activeTab, setActiveTab] = useState<"counts" | "models" | "defaults">("counts");

  // Local states for editing
  const [dailyCounts, setDailyCounts] = useState<any>(null);
  const [modelTokens, setModelTokens] = useState<any>(null);
  const [defaultTokens, setDefaultTokens] = useState<any>(null);
  
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    if (rateLimits) {
      setDailyCounts(JSON.parse(JSON.stringify(rateLimits.daily_count_limits)));
      setModelTokens(JSON.parse(JSON.stringify(rateLimits.model_token_limits)));
      setDefaultTokens(JSON.parse(JSON.stringify(rateLimits.default_model_token_limits)));
      
      const models = Object.keys(rateLimits.model_token_limits);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
      }
    }
  }, [rateLimits]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <p className="text-zinc-400 text-sm tracking-wide font-medium">Loading rate limit configurations...</p>
      </div>
    );
  }

  if (isError || !dailyCounts || !modelTokens || !defaultTokens) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="text-red-500" size={48} />
        <p className="text-zinc-300 text-base font-semibold">Failed to load rate limits</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleDailyCountChange = (tier: string, category: string, val: string) => {
    const numVal = val === "" ? 0 : parseInt(val, 10);
    setDailyCounts((prev: any) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [category]: isNaN(numVal) ? 0 : numVal,
      },
    }));
  };

  const handleDefaultTokenChange = (tier: string, val: string) => {
    const numVal = val === "" ? 0 : parseInt(val, 10);
    setDefaultTokens((prev: any) => ({
      ...prev,
      [tier]: isNaN(numVal) ? 0 : numVal,
    }));
  };

  const handleModelTokenChange = (model: string, tier: string, val: string) => {
    const numVal = val === "" ? 0 : parseInt(val, 10);
    setModelTokens((prev: any) => ({
      ...prev,
      [model]: {
        ...prev[model],
        [tier]: isNaN(numVal) ? 0 : numVal,
      },
    }));
  };

  const saveDailyCounts = () => {
    updateRateLimitMutation.mutate({
      key: "daily_count_limits",
      value: dailyCounts,
    });
  };

  const saveDefaultTokens = () => {
    updateRateLimitMutation.mutate({
      key: "default_model_token_limits",
      value: defaultTokens,
    });
  };

  const saveModelTokens = () => {
    updateRateLimitMutation.mutate({
      key: "model_token_limits",
      value: modelTokens,
    });
  };

  const tiers = ["free", "pro", "enterprise", "byok"];
  const countCategories = [
    "mainQueries",
    "quickChats",
    "recallCards",
    "p5Visualizations",
    "documentUploads",
    "agentWorkspaces",
    "imageUploads"
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="text-blue-500" size={28} />
            Rate Limits & Quota Settings
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure daily operation limits and token allocations across user tiers.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
        >
          <RefreshCw size={14} />
          Reload Data
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-800/80 mb-8 p-1 gap-2 bg-zinc-950/40 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab("counts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === "counts"
              ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
              : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/55"
          }`}
        >
          <Layers size={14} />
          Daily Quotas
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === "models"
              ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
              : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/55"
          }`}
        >
          <Cpu size={14} />
          Model Tokens
        </button>
        <button
          onClick={() => setActiveTab("defaults")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            activeTab === "defaults"
              ? "bg-blue-600/15 border border-blue-500/30 text-blue-400"
              : "text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900/55"
          }`}
        >
          <ShieldCheck size={14} />
          Default Tokens
        </button>
      </div>

      {/* TAB CONTENT: DAILY COUNTS */}
      {activeTab === "counts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier}
                className="relative bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl hover:border-zinc-700/50 transition-all group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 blur-[50px] pointer-events-none group-hover:bg-blue-500/8 transition-all" />
                <h3 className="text-sm font-bold tracking-wider uppercase text-blue-400 mb-6 flex items-center justify-between">
                  <span>{tier} plan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 normal-case font-normal border border-zinc-850">
                    daily operations
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countCategories.map((category) => (
                    <div key={category} className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        {category.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={dailyCounts[tier]?.[category] ?? 0}
                          onChange={(e) => handleDailyCountChange(tier, category, e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-all focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase pointer-events-none">
                          {dailyCounts[tier]?.[category] === -1 ? "unlimited" : "req/day"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-900">
            <button
              onClick={saveDailyCounts}
              disabled={updateRateLimitMutation.isPending}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/10 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save size={16} />
              {updateRateLimitMutation.isPending ? "Saving Daily Quotas..." : "Save Daily Quotas"}
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MODEL TOKENS */}
      {activeTab === "models" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-base font-bold text-white">Model Specific Token Limits</h3>
                <p className="text-xs text-zinc-400 mt-1">Select an AI model to edit its maximum token limits per user request.</p>
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-750 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-zinc-300 font-semibold transition-all focus:outline-none"
                >
                  {Object.keys(modelTokens).map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedModel && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tiers.map((tier) => (
                  <div
                    key={tier}
                    className="flex flex-col gap-2 p-5 bg-zinc-950/50 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-all"
                  >
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">{tier} tier</span>
                    <div className="relative mt-2">
                      <input
                        type="number"
                        value={modelTokens[selectedModel]?.[tier] ?? 0}
                        onChange={(e) => handleModelTokenChange(selectedModel, tier, e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-all focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase pointer-events-none">
                        {modelTokens[selectedModel]?.[tier] === -1 ? "unlimited" : "tokens"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-900">
            <button
              onClick={saveModelTokens}
              disabled={updateRateLimitMutation.isPending}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/10 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save size={16} />
              {updateRateLimitMutation.isPending ? "Saving Model Tokens..." : "Save Model Tokens"}
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEFAULT TOKENS */}
      {activeTab === "defaults" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h3 className="text-base font-bold text-white font-semibold">Fallback Token Limits</h3>
              <p className="text-xs text-zinc-400 mt-1">These settings apply when an AI model doesn't specify its own limits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier) => (
                <div
                  key={tier}
                  className="flex flex-col gap-2 p-5 bg-zinc-950/50 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-all"
                >
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">{tier} tier</span>
                  <div className="relative mt-2">
                    <input
                      type="number"
                      value={defaultTokens[tier] ?? 0}
                      onChange={(e) => handleDefaultTokenChange(tier, e.target.value)}
                      className="w-full bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-all focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase pointer-events-none">
                      {defaultTokens[tier] === -1 ? "unlimited" : "tokens"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-900">
            <button
              onClick={saveDefaultTokens}
              disabled={updateRateLimitMutation.isPending}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/10 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save size={16} />
              {updateRateLimitMutation.isPending ? "Saving Default Tokens..." : "Save Default Tokens"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
