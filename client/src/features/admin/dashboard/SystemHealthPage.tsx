import { useGetSystemHealth} from "./hook/useGetSystemHealth";
import type { SystemHealthReport } from "./hook/useGetSystemHealth";
import {
  Activity,
  Database,
  Cpu,
  Mail,
  Cloud,
  Layers,
  Server,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
} from "lucide-react";

export function SystemHealthPage() {
  const { data, isLoading, isFetching, refetch, error } = useGetSystemHealth();

  const handleRefresh = () => {
    refetch();
  };

  const getServiceConfig = (key: string) => {
    switch (key) {
      case "mongodb":
        return {
          name: "MongoDB Connection",
          desc: "Main database cluster storing users, rate-limits, and logs.",
          icon: Database,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          glow: "bg-emerald-500",
        };
      case "redis":
        return {
          name: "Redis Cache Store",
          desc: "High-speed key-value cache, session tracker, and rate limiter.",
          icon: Server,
          color: "text-red-500 bg-red-500/10 border-red-500/20",
          glow: "bg-red-500",
        };
      case "qdrant":
        return {
          name: "Qdrant Vector Database",
          desc: "Indexes chunks, BM25, and dense vectors for active recall/retrieval.",
          icon: Layers,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          glow: "bg-blue-500",
        };
      case "embedding":
        return {
          name: "Voyage AI Embeddings",
          desc: "Upstream API converting context queries to multi-dimensional vectors.",
          icon: Cpu,
          color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
          glow: "bg-violet-500",
        };
      case "email":
        return {
          name: "SMTP Email Service",
          desc: "Transporter used to deliver sign-up OTPs and password resets.",
          icon: Mail,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          glow: "bg-amber-500",
        };
      case "storage":
        return {
          name: "Cloudinary Document Store",
          desc: "Asset bucket storing chat-uploaded images and documents.",
          icon: Cloud,
          color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
          glow: "bg-sky-500",
        };
      default:
        return {
          name: key,
          desc: "External connection link.",
          icon: Activity,
          color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
          glow: "bg-zinc-500",
        };
    }
  };

  const isHealthy = data?.overall === "healthy";
  const isDegraded = data?.overall === "degraded";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            System Diagnostics
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">
            Live infrastructure checks, service latency measurements, and API connections.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isFetching}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 text-sm font-semibold rounded-xl text-zinc-200 transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : (
            <RefreshCw className="h-4 w-4 text-zinc-400" />
          )}
          Ping Services
        </button>
      </div>

      {/* Main Status Panel */}
      {isLoading ? (
        <div className="flex justify-center items-center h-80 bg-zinc-950/20 rounded-2xl border border-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center border border-red-500/10 bg-red-500/5 rounded-2xl p-10 text-center max-w-md mx-auto">
          <ShieldAlert className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-white">Diagnostics offline</h3>
          <p className="text-sm text-zinc-400 mt-1">
            Could not communicate with the health server. Verify backend connectivity.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Large Overall Status Header */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 backdrop-blur-md ${
              isHealthy
                ? "bg-emerald-950/20 border-emerald-500/15"
                : isDegraded
                ? "bg-amber-950/20 border-amber-500/15"
                : "bg-red-950/20 border-red-500/15"
            }`}
          >
            {/* Soft decorative background glows */}
            <div
              className={`absolute -right-24 -bottom-24 w-80 h-80 rounded-full blur-3xl opacity-10 ${
                isHealthy ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500"
              }`}
            ></div>

            <div className="flex items-center gap-4.5 z-10">
              <div
                className={`p-3 rounded-2xl border ${
                  isHealthy
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : isDegraded
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {isHealthy ? (
                  <ShieldCheck className="h-8 w-8" />
                ) : isDegraded ? (
                  <AlertTriangle className="h-8 w-8" />
                ) : (
                  <ShieldAlert className="h-8 w-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  {isHealthy
                    ? "All Infrastructure Operational"
                    : isDegraded
                    ? "Degraded Performance Detected"
                    : "System Service Outage"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isHealthy
                    ? "All database endpoints, vector caches, and email connectors returned success status."
                    : isDegraded
                    ? "One or more third party modules are running slower than normal."
                    : "Critical backend clusters failed their checks. Actions required."}
                </p>
              </div>
            </div>

            <div className="z-10">
              <span
                className={`px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  isHealthy
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : isDegraded
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {data?.overall}
              </span>
            </div>
          </div>

          {/* Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data?.services || {}).map(([key, service]: [string, { status: string; latencyMs?: number; error?: string }]) => {
              const cfg = getServiceConfig(key);
              const ServiceIcon = cfg.icon;
              const isOk = service.status === "healthy";

              return (
                <div
                  key={key}
                  className="group relative bg-zinc-950/40 border border-zinc-850 hover:border-zinc-750 rounded-2xl p-5.5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${cfg.color}`}>
                          <ServiceIcon className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-zinc-200 text-sm tracking-wide">
                          {cfg.name}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-1 rounded-lg">
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isOk ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              isOk ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          ></span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isOk ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isOk ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-medium">
                      {cfg.desc}
                    </p>
                  </div>

                  {/* Latency & Errors */}
                  <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Response Time
                      </span>
                      <span className={`font-mono font-bold ${isOk ? "text-zinc-300" : "text-red-500"}`}>
                        {isOk && service.latencyMs !== undefined
                          ? `${service.latencyMs}ms`
                          : "—"}
                      </span>
                    </div>

                    {!isOk && service.error && (
                      <div className="mt-2 bg-red-950/10 border border-red-500/10 rounded-xl p-3 text-[10px] text-red-400 font-mono break-all leading-normal">
                        <strong>Error:</strong> {service.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Console Debug Log */}
          <div className="bg-zinc-950/45 border border-zinc-850 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Live Debug Payload
            </h3>
            <pre className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl text-xs text-zinc-400 overflow-x-auto font-mono max-h-64">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
