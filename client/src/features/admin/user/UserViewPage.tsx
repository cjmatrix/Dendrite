import { Link, useParams } from "react-router-dom";
import { ArrowLeft, UserCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useGetUserById } from "./hook/useGetUserById";
import { useState } from "react";
import { useSuspendUser } from "./hook/useSuspendUser";
import { useUnsuspendUser } from "./hook/useUnsuspendUser";
import { useToggleBan } from "./hook/useToggleBan";
import { ActionModal } from "../../../components/common/ActionModal";
import { useGetUserRateLimitUsage } from "./hook/useGetUserRateLimitUsage";
import { useResetUserRateLimits } from "./hook/useResetUserRateLimits";

function UserViewPage() {
  const { id } = useParams();
  const [showSuspendOptions, setShowSuspendOptions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | null
    | {
        type: "suspend";
        durationInSeconds: number;
        label: string;
      }
    | {
        type: "ban";
      }
  >(null);
  const secondsMap = {
    0: 86400,
    1: 259200,
    2: 604800,
    3: 2592000,
  };
  const { data: user, isLoading, error } = useGetUserById(id || "");
  const { mutate, isPending } = useSuspendUser();
  const { mutate: unsuspend, isPending: isUnsuspending } = useUnsuspendUser();
  const { mutate: toggleBan, isPending: isBanning } = useToggleBan();
  const { data: usageData, isLoading: isUsageLoading } = useGetUserRateLimitUsage(id || "");
  const resetRateLimitsMutation = useResetUserRateLimits();

  const handleResetLimits = () => {
    if (id) {
      resetRateLimitsMutation.mutate(id);
    }
  };

  const handleSuspend = (seconds: number) => {
    mutate(
      { userId: id, payload:{ durationInSeconds: seconds } },
      {
        onSuccess: () => {
          setShowSuspendOptions(false);
        },
      }
    );
  };

  const handleUnsuspend = () => {
    if (id) {
      unsuspend(id);
    }
  };

  const handleToggleBan = () => {
    if (id) {
      toggleBan(id);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "suspend") {
      handleSuspend(confirmAction.durationInSeconds);
    }

    if (confirmAction.type === "ban") {
      handleToggleBan();
    }

    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-white flex items-center justify-center min-h-96">
        <div className="animate-pulse text-zinc-500 uppercase tracking-widest text-sm">
          Loading User Data...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 text-white">
        <Link
          to="/admin/users"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to users
        </Link>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-blue-200">
          Error loading user details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/admin/users"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to users
        </Link>
      </div>

      <div className="bg-zinc-900/60 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-semibold">{user.name}</h2>
                <span className="text-[11px] uppercase tracking-wider bg-zinc-900/70 border border-blue-500/20 rounded-full px-2 py-1 text-zinc-400">
                  ID: {user._id}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 uppercase tracking-wider">
                  {user.tier} tier
                </span>
                <span
                  className={`px-3 py-1 rounded-full uppercase tracking-wider ${
                    user.status === "active"
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "bg-blue-500/10 text-blue-200"
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>
          {/* <button className="self-start lg:self-center px-4 py-2 rounded-lg border border-red-500/30 text-xs uppercase tracking-wider text-red-200 hover:bg-red-500/10 transition-all flex items-center gap-2">
            <Download size={14} />
            Download Audit Log
          </button> */}
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
          <span className="text-lg">✧</span>
          Token Usage Metrics
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-zinc-900/60 border border-blue-500/20 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Total Cumulative Usage
            </p>
            <p className="text-3xl font-semibold mt-3">
              {(user.tokensUsed || 0).toLocaleString()}
            </p>
          </div>
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Main Chat", value: user.tokenUsage.mainChat },
              { label: "Chat Summary", value: user.tokenUsage.chatSummary },
              { label: "Compressed Chat", value: user.tokenUsage.compressedChat },
              { label: "Code Description", value: user.tokenUsage.codeDescription },
              { label: "P5 Visualization", value: user.tokenUsage.p5Visualization },
              { label: "Quick Chat", value: user.tokenUsage.quickChat },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-zinc-900/60 border border-blue-500/10 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-400">
                    {metric.label}
                  </p>
                  <p className="text-lg mt-2 font-semibold">
                    {(metric.value?.total ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 mt-2 border-t border-zinc-800/50 pt-2">
                  <span>In: {(metric.value?.input ?? 0).toLocaleString()}</span>
                  <span>Out: {(metric.value?.output ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="text-lg">✧</span>
            Daily Quotas & Token Usage
          </div>
          <button
            onClick={handleResetLimits}
            disabled={resetRateLimitsMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-[11px] uppercase tracking-wider text-red-200 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <RotateCcw size={12} />
            {resetRateLimitsMutation.isPending ? "Resetting..." : "Reset Daily Limits"}
          </button>
        </div>

        {isUsageLoading ? (
          <div className="bg-zinc-900/60 border border-blue-500/10 rounded-2xl p-6 flex justify-center items-center h-48">
            <RefreshCw className="animate-spin text-blue-500" size={24} />
          </div>
        ) : !usageData ? (
          <div className="bg-zinc-900/60 border border-blue-500/10 rounded-2xl p-6 text-center text-zinc-400 text-sm">
            No active usage data found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Counts Section */}
            <div className="bg-zinc-900/60 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-4 font-semibold">
                Daily Operations Quota
              </h4>
              <div className="space-y-4">
                {Object.entries(usageData.counts).map(([category, { current, limit }]) => {
                  const percent = limit === -1 ? 0 : Math.min(100, (current / limit) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-300 capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="text-zinc-400 font-medium">
                          {current} / {limit === -1 ? "∞" : limit}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent > 90
                              ? "bg-red-500/80"
                              : percent > 75
                              ? "bg-yellow-500/80"
                              : "bg-blue-500/80"
                          }`}
                          style={{ width: limit === -1 ? "0%" : `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Tokens Section */}
            <div className="bg-zinc-900/60 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-4 font-semibold">
                Model Token Allocations
              </h4>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {Object.entries(usageData.tokens).map(([model, { current, limit }]) => {
                  if (limit === 0) return null; // Model is not available for this tier
                  const percent = limit === -1 ? 0 : Math.min(100, (current / limit) * 100);
                  return (
                    <div key={model} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-300 font-mono text-[11px]">{model}</span>
                        <span className="text-zinc-400 font-medium">
                          {current.toLocaleString()} / {limit === -1 ? "∞" : limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent > 90
                              ? "bg-red-500/80"
                              : percent > 75
                              ? "bg-yellow-500/80"
                              : "bg-blue-500/80"
                          }`}
                          style={{ width: limit === -1 ? "0%" : `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3">
            <span className="text-lg">✧</span>
            User Node Configuration
          </div>
          {/* <div className="bg-zinc-950/70 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5 space-y-4 text-sm text-zinc-300">
            {[
              { label: "Global Memory", enabled: user.settings.global },
              { label: "Inline Prediction", enabled: user.settings.inline },
              { label: "Diagram Engine", enabled: user.settings.diagram },
              { label: "Save History", enabled: user.settings.saveHistory },
            ].map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between bg-zinc-900/60 border border-blue-500/10 rounded-xl px-4 py-3"
              >
                <span>{setting.label}</span>
                <div
                  className={`w-10 h-6 rounded-full ${
                    setting.enabled ? "bg-cyan-400/80" : "bg-zinc-700"
                  } flex items-center px-1 transition-colors`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      setting.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div> */}
        </div>

      </section>

      <div className="mt-10 border-t border-blue-500/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {user.status === "suspended" ? (
            <button
              onClick={handleUnsuspend}
              disabled={isUnsuspending}
              className="px-4 py-2 rounded-lg border border-emerald-500/30 text-xs uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
            >
              {isUnsuspending ? "Activating..." : "Unsuspend User"}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowSuspendOptions(!showSuspendOptions)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border border-blue-500/30 text-xs uppercase tracking-wider text-blue-200 hover:bg-blue-500/10 transition-all disabled:opacity-50"
              >
                {showSuspendOptions ? "Cancel" : "Suspend User"}
              </button>
              {showSuspendOptions && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-zinc-950 border border-blue-500/20 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl">
                  <div className="p-2 border-b border-blue-500/10 bg-blue-500/5">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 px-2">
                      Select Duration
                    </span>
                  </div>
                  {[
                    // ... (durations are same, just styled buttons)
                    {
                      label: "1 Day (24 Hours)",
                      desc: "Good for minor rule-breaking or giving a user a \"cool-down\" period.",
                    },
                    {
                      label: "3 Days",
                      desc: "Best for repeat warnings or weekend blocks.",
                    },
                    {
                      label: "1 Week (7 Days)",
                      desc: "The standard penalty for breaking chatbot guidelines.",
                    },
                    {
                      label: "1 Month (30 Days)",
                      desc: "Extended suspension for severe or persistent violations.",
                    },
                  ].map((option, i) => (
                    <button
                      key={option.label}
                      className="w-full text-left px-4 py-3 hover:bg-blue-500/10 transition-all border-b border-blue-500/5 last:border-0 group"
                    disabled={isPending}
                      onClick={() => {
                        setShowSuspendOptions(false);
                        setConfirmAction({
                          type: "suspend",
                          durationInSeconds: secondsMap[i as keyof typeof secondsMap],
                          label: option.label,
                        });
                      }}
                    >
                      <div className="text-xs font-medium text-blue-200 group-hover:text-white transition-colors">
                        {option.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => {
              if (user.status === "banned") {
                handleToggleBan();
                return;
              }
              setConfirmAction({ type: "ban" });
            }}
            disabled={isBanning}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all border disabled:opacity-50 ${
            user.status === "banned" 
              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30" 
              : "bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30"
          }`}>
            {isBanning ? "Processing..." : user.status === "banned" ? "Unban User" : "Ban User"}
          </button>
        </div>
      </div>
      <ActionModal
        isOpen={!!confirmAction}
        variant="warning"
        title={
          confirmAction?.type === "suspend"
            ? "Confirm Suspension"
            : "Confirm Ban"
        }
        description={
          confirmAction?.type === "suspend"
            ? `This will suspend the user for ${confirmAction.label}.`
            : "This will immediately ban the user and restrict access."
        }
        confirmLabel={
          confirmAction?.type === "suspend" ? "Suspend user" : "Ban user"
        }
        cancelLabel="Cancel"
        isLoading={isPending || isBanning}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

export default UserViewPage;
