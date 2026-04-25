import {
  BrainCircuit,
  GitBranch,
  Layers,
  Sparkles,
  Eye,
  MessageSquareQuote,
  RotateCcw,
} from "lucide-react";
import DendritesLogo from "./DendritesLogo";

const features = [
  {
    icon: BrainCircuit,
    title: "Adaptive Intelligence",
    desc: "A learning memory that retains context across long-term research sessions, so you never have to repeat yourself.",
    color: "cyan",
  },
  {
    icon: GitBranch,
    title: "Infinite Branching",
    desc: "Seamlessly fork conversations to explore new ideas or alternative paths without losing your primary history.",
    color: "blue",
  },
  {
    icon: Eye,
    title: "Dynamic Visuals",
    desc: "Instantly transform abstract concepts into interactive, live visualizations to understand data at a glance.",
    color: "purple",
  },
  {
    icon: MessageSquareQuote,
    title: "Deep Dives",
    desc: "Select any part of a response to open a focused sub-chat, allowing you to drill down into the finest details.",
    color: "emerald",
  },
  {
    icon: Layers,
    title: "Semantic Insights",
    desc: "Historic facts and code snippets are automatically cross-referenced to provide relevant context when you need it.",
    color: "amber",
  },
  {
    icon: RotateCcw,
    title: "Active Retention",
    desc: "Convert critical knowledge into spaced-repetition reviews, ensuring your most important findings stick.",
    color: "rose",
  },
];

const colorMap: Record<string, { icon: string; border: string; bg: string; glow: string }> = {
  cyan:    { icon: "text-cyan-400",    border: "hover:border-cyan-500/30",    bg: "bg-cyan-500/10",    glow: "group-hover:shadow-cyan-500/5" },
  blue:    { icon: "text-blue-400",    border: "hover:border-blue-500/30",    bg: "bg-blue-500/10",    glow: "group-hover:shadow-blue-500/5" },
  purple:  { icon: "text-purple-400",  border: "hover:border-purple-500/30",  bg: "bg-purple-500/10",  glow: "group-hover:shadow-purple-500/5" },
  emerald: { icon: "text-emerald-400", border: "hover:border-emerald-500/30", bg: "bg-emerald-500/10", glow: "group-hover:shadow-emerald-500/5" },
  amber:   { icon: "text-amber-400",   border: "hover:border-amber-500/30",   bg: "bg-amber-500/10",   glow: "group-hover:shadow-amber-500/5" },
  rose:    { icon: "text-rose-400",    border: "hover:border-rose-500/30",    bg: "bg-rose-500/10",    glow: "group-hover:shadow-rose-500/5" },
};

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--theme-bg-base)] relative overflow-hidden h-screen w-full">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/8 rounded-full blur-[140px] animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-3xl px-6 text-center">
        {/* Logo */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-3xl group-hover:bg-cyan-500/25 transition-all duration-700 animate-pulse" />
          <div className="relative ">
            <DendritesLogo size={100} isRotate={false} />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-100 via-gray-300 to-gray-500 tracking-tight">
            Connect the Dots.
          </h1>
          <p className="text-base text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
            Elevate your research with a companion that understands complex patterns and preserves every insight you discover.
          </p>
          <div className="h-px w-20 bg-linear-to-r from-transparent via-zinc-700 to-transparent mx-auto mt-6" />
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {features.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <div
                key={i}
                className={`group p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm ${c.border} hover:bg-zinc-800/40 transition-all duration-300 text-left hover:shadow-lg ${c.glow}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon size={16} className={c.icon} />
                </div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 text-sm text-gray-600 animate-in fade-in duration-1000 delay-700">
          <Sparkles size={14} className="text-cyan-500/60" />
          <span>Select a chat from the sidebar or create a new one to begin.</span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
