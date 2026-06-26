import { useState, useMemo, useRef } from "react";
import { useGetSubscriptionStats } from "../hook/useGetSubscriptionStats";
import type { SubscriptionStatsFilter } from "../hook/useGetSubscriptionStats";
import { TrendingUp, CreditCard, Loader2 } from "lucide-react";

interface SubscriptionStatsCardProps {
  filter: SubscriptionStatsFilter;
}

export function SubscriptionStatsCard({ filter }: SubscriptionStatsCardProps) {
  const [activeMetric, setActiveMetric] = useState<"revenue" | "transactions">("revenue");
  
  // Hover/Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    count: number;
    revenue: number;
    x: number;
    y: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const { data, isLoading } = useGetSubscriptionStats(filter);

  // Chart Rendering Math
  const chartWidth = 800;
  const chartHeight = 280;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const points = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) return [];
    
    const chartData = data.chartData;
    const maxVal = Math.max(
      ...chartData.map((d) => (activeMetric === "revenue" ? d.revenue : d.count)),
      1 // avoid division by 0
    );

    return chartData.map((d, index) => {
      const x =
        paddingLeft +
        (index / Math.max(1, chartData.length - 1)) *
          (chartWidth - paddingLeft - paddingRight);
      
      const val = activeMetric === "revenue" ? d.revenue : d.count;
      const y =
        chartHeight -
        paddingBottom -
        (val / maxVal) * (chartHeight - paddingTop - paddingBottom);

      return {
        x,
        y,
        date: d.date,
        count: d.count,
        revenue: d.revenue,
      };
    });
  }, [data, activeMetric]);

  // Construct SVG Path strings
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return { linePath: pathD, areaPath: areaD };
  }, [points]);

  // Handle SVG Mouse Move to show Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || points.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find the closest point in the points array based on x-coordinate
    let closest = points[0];
    let minDiff = Math.abs(points[0].x - mouseX);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }

    setHoveredPoint(closest);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Y-Axis Ticks
  const yTicks = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) return [0, 25, 50, 75, 100];
    const maxVal = Math.max(
      ...data.chartData.map((d) => (activeMetric === "revenue" ? d.revenue : d.count)),
      1
    );
    return [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  }, [data, activeMetric]);

  return (
    <div className="bg-zinc-950/45 border border-zinc-850 rounded-2xl p-6 shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-zinc-400" />
            Subscription & Checkout Ledger
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Analyze paddle upgrades and revenue streams with dynamic date ranges.
          </p>
        </div>
      </div>

      {/* Main content grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-80 bg-zinc-950/20 rounded-2xl border border-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Summary Cards */}
          <div className="space-y-4">
            {/* Metric Toggle */}
            <div className="grid grid-cols-2 bg-zinc-900/40 border border-zinc-850 p-1 rounded-xl">
              <button
                onClick={() => setActiveMetric("revenue")}
                className={`py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  activeMetric === "revenue"
                    ? "bg-zinc-800 text-zinc-200 font-semibold"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveMetric("transactions")}
                className={`py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  activeMetric === "transactions"
                    ? "bg-zinc-800 text-zinc-200 font-semibold"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
              >
                Transactions
              </button>
            </div>

            {/* Total Revenue card */}
            <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-4.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Revenue</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1.5">
                ${(data?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Sum of completed upgrades</p>
            </div>

            {/* Total checkouts card */}
            <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-4.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Checkouts</span>
                <CreditCard className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1.5">
                {(data?.totalTransactions || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Total completed payments</p>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-4 relative">
            {points.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 text-sm">
                No checkout data found for this time period.
              </div>
            ) : (
              <div className="relative">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto cursor-crosshair overflow-visible"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    {/* Gradient below the line */}
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {yTicks.map((tick, i) => {
                    const maxVal = yTicks[yTicks.length - 1];
                    const y =
                      chartHeight -
                      paddingBottom -
                      (tick / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    
                    return (
                      <g key={i} className="opacity-40">
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#27272a"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        {/* Y-Axis Label */}
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-zinc-500 text-[10px] font-medium font-mono"
                        >
                          {activeMetric === "revenue"
                            ? `$${tick.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : tick.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-Axis ticks / labels */}
                  {points.map((p, i) => {
                    // Show labels at reasonable intervals to avoid crowding
                    const labelInterval = Math.max(1, Math.floor(points.length / 6));
                    if (i % labelInterval !== 0 && i !== points.length - 1) return null;

                    return (
                      <text
                        key={i}
                        x={p.x}
                        y={chartHeight - 15}
                        textAnchor="middle"
                        className="fill-zinc-500 text-[10px] font-medium font-mono"
                      >
                        {p.date}
                      </text>
                    );
                  })}

                  {/* Area below the line */}
                  <path d={areaPath} fill="url(#chartGradient)" />

                  {/* Main Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all"
                  />

                  {/* Hover Tracker Line */}
                  {hoveredPoint && (
                    <g>
                      <line
                        x1={hoveredPoint.x}
                        y1={paddingTop}
                        x2={hoveredPoint.x}
                        y2={chartHeight - paddingBottom}
                        stroke="#3f3f46"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {/* Hover Dot */}
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.y}
                        r="6"
                        className="fill-blue-500 stroke-zinc-950 stroke-2"
                      />
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.y}
                        r="12"
                        className="fill-blue-500/20 animate-pulse"
                      />
                    </g>
                  )}
                </svg>

                {/* Custom Tooltip Card */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-zinc-900/95 border border-zinc-800 rounded-xl p-3 shadow-2xl pointer-events-none text-xs transition-all duration-100 z-10"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${((hoveredPoint.y - 85) / chartHeight) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{hoveredPoint.date}</p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-zinc-400">Revenue:</span>
                        <span className="font-semibold text-white">${hoveredPoint.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-zinc-400">Checkouts:</span>
                        <span className="font-semibold text-white">{hoveredPoint.count}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
