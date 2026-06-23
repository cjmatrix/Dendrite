import {
  BrainCircuit,
  GitBranch,
  Layers,
  Sparkles,
  Eye,
  MessageSquareQuote,
  RotateCcw,
} from "lucide-react";
import DendritesLogo from "../../../components/DendritesLogo";

interface Feature {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  desc: string;
  color: "cyan" | "blue" | "purple" | "emerald" | "amber" | "rose";
}

const features: Feature[] = [
  {
    icon: BrainCircuit,
    title: "Adaptive Intelligence",
    desc: "A learning memory that retains context across long-term research sessions.",
    color: "cyan",
  },
  {
    icon: GitBranch,
    title: "Infinite Branching",
    desc: "Seamlessly fork conversations to explore alternative paths without losing history.",
    color: "blue",
  },
  {
    icon: Eye,
    title: "Dynamic Visuals",
    desc: "Instantly transform abstract concepts into interactive, live visualizations.",
    color: "purple",
  },
  {
    icon: MessageSquareQuote,
    title: "Deep Dives",
    desc: "Select any part of a response to drill down into the finest sub-details.",
    color: "emerald",
  },
  {
    icon: Layers,
    title: "Semantic Insights",
    desc: "Historic facts and snippets are cross-referenced to provide relevant context.",
    color: "amber",
  },
  {
    icon: RotateCcw,
    title: "Active Retention",
    desc: "Convert critical knowledge into spaced-repetition reviews to make it stick.",
    color: "rose",
  },
];

const colorMap = {
  cyan:    { text: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    hoverBorder: "hover:border-cyan-500/40" },
  blue:    { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    hoverBorder: "hover:border-blue-500/40" },
  purple:  { text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  hoverBorder: "hover:border-purple-500/40" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hoverBorder: "hover:border-emerald-500/40" },
  amber:   { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   hoverBorder: "hover:border-amber-500/40" },
  rose:    { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    hoverBorder: "hover:border-rose-500/40" },
};

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-900 relative overflow-hidden min-h-screen w-full px-6 lg:px-12">
      
      {/* Immersive Ambient Background */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-purple-500/1 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen" />
      </div> */}

      <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20">
        
        {/* Left Column: Brand & Messaging */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">
          <div className="inline-flex items-center justify-center lg:justify-start gap-4 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all duration-700" />
              <div className="relative p-2 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
                <DendritesLogo size={48} isRotate={false} />
              </div>
            </div>
            <span className="text-xl font-semibold tracking-wide text-zinc-200">Dendrites</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-300 to-zinc-600 mb-6">
            Connect <br className="hidden lg:block" /> the Dots.
          </h1>
          
          <p className="text-base lg:text-lg text-zinc-400 leading-relaxed font-light max-w-md mx-auto lg:mx-0 mb-10">
            Elevate your research workflow with an intelligent companion designed to map complex data patterns and preserve critical contexts.
          </p>

          <div className="inline-flex items-center justify-center lg:justify-start gap-3 text-sm text-zinc-500 bg-zinc-900/30 w-fit mx-auto lg:mx-0 py-2 px-4 rounded-full border border-zinc-800/50 backdrop-blur-md">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            <span>Type a prompt below to initialize a session</span>
          </div>
        </div>

        {/* Right Column: Feature Grid */}
        <div className="w-full lg:w-7/12 flex items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              const IconComponent = f.icon;
              
              return (
                <div
                  key={i}
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 ${c.hoverBorder}`}
                  style={{ animationFillMode: 'both', animationDelay: `${i * 100}ms` }}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out`}>
                    <IconComponent size={18} className={`${c.text}`} />
                  </div>
                  
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 tracking-wide group-hover:text-white transition-colors duration-300">
                      {f.title}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-light group-hover:text-zinc-400 transition-colors duration-300">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}