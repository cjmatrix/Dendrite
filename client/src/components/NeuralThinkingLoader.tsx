import React from "react";

interface NeuralThinkingLoaderProps {
  compact?: boolean;
  status?: string;
  className?: string;
}

export const NeuralThinkingLoader: React.FC<NeuralThinkingLoaderProps> = ({ 
  compact = false, 
  status = "Thinking",
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-4 animate-in fade-in duration-500 ${!compact ? "mt-6" : ""} ${className}`}>
      <div className={`relative ${compact ? "w-6 h-6" : "w-10 h-10"} flex items-center justify-center`}>
        {/* Central Hub */}
        <div className={`absolute ${compact ? "w-1 h-1" : "w-2 h-2"} bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-pulse`} />
        
        {/* Orbital Rings / Neural Waves */}
        <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-[ping_3s_linear_infinite]" />
        {!compact && (
          <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-[ping_3s_linear_infinite] delay-1000" />
        )}
        
        {/* Orbiting Particles */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${compact ? "w-1 h-1" : "w-1.5 h-1.5"} bg-cyan-400 rounded-full blur-[1px] shadow-[0_0_8px_#22d3ee]`} />
        </div>
        {!compact && (
          <div className="absolute inset-0 animate-spin-reverse-slow">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full blur-[1px] shadow-[0_0_8px_#3b82f6]" />
          </div>
        )}
      </div>
      
      {!compact && (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-gray-300 tracking-wider uppercase flex items-center gap-2">
            {status}
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
            </span>
          </span>
          <span className="text-[11px] text-gray-500 font-medium italic">
            Mapping neural pathways...
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse 4s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

