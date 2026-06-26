import React, { useState, useMemo } from "react";
import {
  Users,
  Activity,
  UserCheck,
  UserMinus,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Shield,
  Cpu,
  Calendar
} from "lucide-react";
import { useGetAdminDashboardStats } from "./hook/useGetAdminDashboardStats";
import { SubscriptionStatsCard } from "./components/SubscriptionStatsCard";

function StatCardSkeleton() {
  return (
    <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-zinc-800 rounded"></div>
        <div className="h-10 w-10 bg-zinc-800 rounded-xl"></div>
      </div>
      <div className="h-8 w-16 bg-zinc-800 rounded mt-4"></div>
      <div className="h-3 w-32 bg-zinc-800/60 rounded mt-2"></div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
  isLive?: boolean;
}

function StatCard({
  label,
  value,
  description,
  icon,
  colorClass,
  glowClass,
  isLive = false
}: StatCardProps) {
  return (
    <div className="group relative bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${glowClass}`}></div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{label}</span>
        <div className={`p-2.5 rounded-xl border bg-zinc-900/80 ${colorClass}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">
          {value.toLocaleString()}
        </span>
        {isLive && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-1.5 font-medium">{description}</p>
    </div>
  );
}

type CategoryData = { name: string; key: string; stroke: string; data?: { total?: number; input?: number; output?: number } };
function DonutChart({ categories, totalTokens }: { categories: CategoryData[]; totalTokens: number }) {
  let accumulatedPercent = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-10">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-zinc-900 fill-none"
            strokeWidth="16"
          />
          {categories.map((cat) => {
            const val = cat.data?.total || 0;
            const pct = totalTokens > 0 ? val / totalTokens : 0;
            if (pct <= 0) return null;

            const strokeLength = pct * circumference;
            const rotationOffset = (accumulatedPercent / 100) * circumference;
            accumulatedPercent += pct * 100;

            return (
              <circle
                key={cat.key}
                cx="80"
                cy="80"
                r={radius}
                className="fill-none transition-all duration-500 hover:stroke-[18px]"
                stroke={cat.stroke}
                strokeWidth="14"
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={-rotationOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total tokens</span>
          <span className="text-2xl font-extrabold text-white mt-0.5">
            {totalTokens >= 1e6 ? `${(totalTokens / 1e6).toFixed(2)}M` : totalTokens.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {categories.map((cat) => {
          const val = cat.data?.total || 0;
          const pct = totalTokens > 0 ? (val / totalTokens) * 100 : 0;
          const inputPct = val > 0 ? ((cat.data?.input || 0) / val) * 100 : 0;
          const outputPct = val > 0 ? ((cat.data?.output || 0) / val) * 100 : 0;

          return (
            <div key={cat.key} className="bg-zinc-900/35 border border-zinc-850/60 rounded-xl p-4 transition-all hover:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: cat.stroke }}></span>
                  <span className="text-sm font-semibold text-zinc-200">{cat.name}</span>
                </div>
                <span className="text-xs font-bold text-zinc-400">{pct.toFixed(1)}%</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between text-xs text-zinc-400">
                <span>Total: <strong className="text-zinc-200">{val.toLocaleString()}</strong></span>
                <span className="text-[10px] text-zinc-500">In: {cat.data?.input?.toLocaleString()} | Out: {cat.data?.output?.toLocaleString()}</span>
              </div>

              {/* Stacked input/output bar */}
              <div className="mt-2.5 h-1.5 w-full rounded-full overflow-hidden bg-zinc-900 flex">
                <div style={{ width: `${inputPct}%`, backgroundColor: cat.stroke }} className="opacity-95" title="Input"></div>
                <div style={{ width: `${outputPct}%`, backgroundColor: cat.stroke }} className="opacity-40" title="Output"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "12m" | "custom" | "all">("all");
  const [tier, setTier] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const filterParams = useMemo(() => ({
    timeframe,
    tier,
    provider,
    customStartDate,
    customEndDate
  }), [timeframe, tier, provider, customStartDate, customEndDate]);

  const { data, isLoading, error, refetch, isFetching } = useGetAdminDashboardStats(filterParams);

  const totalTokens = data?.tokenUsage?.totalTokens || 0;
  const categories = [
    { name: "Main Chat", key: "mainChat", stroke: "#3b82f6", data: data?.tokenUsage?.mainChat },
    { name: "Chat Summary", key: "chatSummary", stroke: "#f59e0b", data: data?.tokenUsage?.chatSummary },
    { name: "Code Description", key: "codeDescription", stroke: "#8b5cf6", data: data?.tokenUsage?.codeDescription },
    { name: "P5 Visualization", key: "p5Visualization", stroke: "#10b981", data: data?.tokenUsage?.p5Visualization },
    { name: "Quick Chat", key: "quickChat", stroke: "#f43f5e", data: data?.tokenUsage?.quickChat },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-white">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Admin Overview
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Monitor real-time system metrics, session trackers, and aggregated token volumes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Buttons */}
          <div className="flex bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl">
            {(["24h", "7d", "30d", "12m", "custom", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === t
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "24h" ? "24H" : t === "7d" ? "7D" : t === "30d" ? "30D" : t === "12m" ? "12M" : t === "custom" ? "Custom" : "All"}
              </button>
            ))}
          </div>

          {/* Custom Date Picker (Visible when timeframe is 'custom') */}
          {timeframe === "custom" && (
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 p-1 px-2.5 rounded-xl text-xs">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent border-none text-zinc-300 outline-none w-24 [color-scheme:dark]"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent border-none text-zinc-300 outline-none w-24 [color-scheme:dark]"
              />
            </div>
          )}

          {/* Tier Selector */}
          <div className="flex bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl">
            {(["all", "free", "pro", "enterprise", "byok"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  tier === t
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "all" ? "All Tiers" : t === "free" ? "Free" : t === "pro" ? "Pro" : t === "enterprise" ? "Enterprise" : "BYOK"}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="p-2.5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center border border-red-500/10 bg-red-500/5 rounded-2xl p-10 text-center max-w-md mx-auto mt-10">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Failed to retrieve metrics</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-xs">
            There was an error communicating with the dashboard stats server. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-4.5 py-2 bg-red-500 hover:bg-red-650 text-sm font-semibold rounded-xl text-white transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 h-64 animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatCard
              label="Total Users"
              value={data?.totalUsers ?? 0}
              description="Platform registrations"
              colorClass="border-blue-500/20 text-blue-400"
              glowClass="bg-blue-500"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Active Now"
              value={data?.activeNow ?? 0}
              description="Session count (5m window)"
              colorClass="border-emerald-500/20 text-emerald-400"
              glowClass="bg-emerald-500"
              isLive={true}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label="Active Today"
              value={data?.activeToday ?? 0}
              description="Daily unique session activity"
              colorClass="border-fuchsia-500/20 text-fuchsia-400"
              glowClass="bg-fuchsia-500"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Approvals"
              value={data?.pendingApprovals ?? 0}
              description="Awaiting administrator review"
              colorClass="border-amber-500/20 text-amber-400"
              glowClass="bg-amber-500"
              icon={<UserCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Suspended"
              value={data?.suspendedUsers ?? 0}
              description="Banned or suspended accounts"
              colorClass="border-red-500/20 text-red-400"
              glowClass="bg-red-500"
              icon={<UserMinus className="h-5 w-5" />}
            />
            <StatCard
              label="Total Tokens"
              value={totalTokens}
              description="Excludes BYOK key usage"
              colorClass="border-violet-500/20 text-violet-400"
              glowClass="bg-violet-500"
              icon={<Cpu className="h-5 w-5" />}
            />
          </div>

          {/* Token Usage Diagram */}
          <div className="bg-zinc-950/45 border border-zinc-850 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-zinc-400" />
                  Token Consumption Analytics
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Aggregated platform costs and API volumes across all non-BYOK users.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 focus:outline-none focus:border-zinc-700 transition-all cursor-pointer"
                >
                  <option value="all">All Providers</option>
                  <option value="google">Gemini (Google)</option>
                  <option value="anthropic">Claude (Anthropic)</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq</option>
                  <option value="mistral">Mistral</option>
                </select>
                <div className="text-xs text-zinc-500 font-semibold bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-lg">
                  Tier exclusions: BYOK Accounts
                </div>
              </div>
            </div>

            <DonutChart categories={categories} totalTokens={totalTokens} />
          </div>

          {/* Subscription Stats Ledger & Charts */}
          <SubscriptionStatsCard filter={filterParams} />
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
