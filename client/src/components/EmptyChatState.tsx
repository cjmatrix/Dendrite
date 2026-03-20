import { Sparkles, BookOpen, BrainCircuit } from "lucide-react";
import DendritesLogo from "./DendritesLogo";

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--theme-bg-base)] relative overflow-hidden h-screen w-full">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6 text-center">
        {/* Animated Logo Container */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-700 animate-pulse" />
          <div className="relative animate-float">
            <DendritesLogo size={120} isRotate={true} />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-100 via-gray-300 to-gray-500 tracking-tight">
            Connect the Dots.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-lg mx-auto leading-relaxed italic">
            "Knowledge is not just data, it's the pattern between them."
          </p>
          <div className="h-px w-24 bg-linear-to-r from-transparent via-zinc-700 to-transparent mx-auto mt-8" />
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
           <div className="group p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm hover:border-cyan-500/30 hover:bg-zinc-800/40 transition-all duration-300 text-left">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <BrainCircuit size={18} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 mb-1">Semantic Memory</h3>
              <p className="text-xs text-gray-500 leading-relaxed">AI automatically builds long-term context from your research path.</p>
           </div>

           <div className="group p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm hover:border-blue-500/30 hover:bg-zinc-800/40 transition-all duration-300 text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <Sparkles size={18} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 mb-1">Deep Context</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Highlight any text to start a sub-chat without losing focus.</p>
           </div>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center gap-3 text-sm text-gray-500 animate-in fade-in duration-1000 delay-700">
          <BookOpen size={16} />
          <span>Select a project from the sidebar to begin.</span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

