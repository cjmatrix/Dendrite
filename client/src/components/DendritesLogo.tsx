import React from "react";

interface DendritesLogoProps {
  size?: number | string;
  className?: string;
  isRotate?: boolean;
  isLoading?: boolean;
}

const DendritesLogo: React.FC<DendritesLogoProps> = ({
  size = 46,
  className = "",
  isRotate = false,
  isLoading = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
      >
        <defs>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          <radialGradient id="sphereBody" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
            <stop offset="60%" stopColor="rgba(14, 165, 233, 0.05)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.2)" />
          </radialGradient>
          
          <linearGradient id="sphereHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="40%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shining Transparent Sphere - Always rendered, transitions smoothly */}
        <g className={`origin-center transition-all duration-1000 ease-out ${isLoading ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
          {/* The Sphere Body */}
          <circle 
            cx="50" cy="50" r="46" 
            fill="url(#sphereBody)" 
            stroke="rgba(34, 211, 238, 0.4)" 
            strokeWidth="0.5"
            className="animate-shimmer"
          />
          {/* Specular Highlight */}
          <circle 
            cx="50" cy="50" r="46" 
            fill="url(#sphereHighlight)" 
            className="animate-spin-slow opacity-40" 
            style={{ transformOrigin: '50px 50px' }}
          />
        </g>

        {/* Outer Orbital Rings - Always rendered, transitions smoothly */}
        <g className={`origin-center transition-all duration-1000 delay-100 ${isLoading ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"}`}>
          {/* Rapid Spinning Neural Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#neuralGradient)" 
            strokeWidth="1.5" 
            strokeDasharray="30 150" 
            strokeLinecap="round"
            className="animate-spin-fast opacity-60" 
          />
          {/* Outer dotted ring */}
          <circle cx="50" cy="50" r="48" stroke="url(#neuralGradient)" strokeWidth="0.5" strokeDasharray="4 4" className="animate-spin-slow opacity-20" />
          {/* Pulse wave */}
          <circle cx="50" cy="50" r="40" stroke="url(#neuralGradient)" strokeWidth="1" className="animate-[ping_2s_linear_infinite] opacity-15" />
        </g>

        {/* Brain/Neural Cluster Container */}
        <g 
          className={`origin-center transition-all duration-700 ${
            isLoading ? "animate-living-neural-fast scale-90" : 
            isRotate ? "animate-living-neural scale-100" : "scale-100"
          }`}
        >
          {/* Orbiting Particle */}
          <g className={`origin-center transition-opacity duration-700 ${isLoading ? "opacity-100 animate-spin-fast" : "opacity-0"}`} style={{ transformOrigin: '50px 50px' }}>
            <circle cx="50" cy="10" r="3" fill="#22d3ee" filter="url(#nodeGlow)" className="animate-pulse" />
          </g>

          {/* Main Branches */}
          <g className="opacity-80">
            <path d="M 50 50 L 50 20 L 40 10" stroke="url(#neuralGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <circle cx="40" cy="10" r="2.5" fill="#22d3ee" filter="url(#nodeGlow)" className={isLoading ? "animate-synapse-fire" : ""} />
            
            <path d="M 50 50 L 75 40 L 85 45" stroke="url(#neuralGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <circle cx="85" cy="45" r="2" fill="#0ea5e9" filter="url(#nodeGlow)" className={isLoading ? "animate-synapse-fire [animation-delay:200ms]" : ""} />
            
            <path d="M 50 50 L 65 75 L 60 85" stroke="url(#neuralGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <circle cx="60" cy="85" r="3" fill="#3b82f6" filter="url(#nodeGlow)" className={isLoading ? "animate-synapse-fire [animation-delay:400ms]" : "animate-pulse"} />
            
            <path d="M 50 50 L 25 65 L 15 60" stroke="url(#neuralGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <circle cx="15" cy="60" r="2" fill="#22d3ee" filter="url(#nodeGlow)" className={isLoading ? "animate-synapse-fire [animation-delay:600ms]" : ""} />
            
            <path d="M 50 50 L 20 40 L 10 45" stroke="url(#neuralGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <circle cx="10" cy="45" r="1.5" fill="#22d3ee" filter="url(#nodeGlow)" className={isLoading ? "animate-synapse-fire [animation-delay:800ms]" : ""} />

            <path d="M 50 35 L 60 25" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M 68 52 L 80 65" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M 35 60 L 25 80" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </g>

          {/* Central Nucleus */}
          <g>
             <circle cx="50" cy="50" r="10" fill="url(#neuralGradient)" opacity="0.2" className="animate-pulse" />
             <circle 
              cx="50" 
              cy="50" 
              r="6" 
              fill="url(#neuralGradient)" 
              className={`transition-all duration-700 ${isLoading ? "animate-nucleus-breathing-fast shadow-[0_0_20px_#22d3ee]" : "animate-nucleus-breathing"}`} 
             />
             <circle cx="50" cy="50" r="2" fill="white" className="animate-ping opacity-60" style={{ animationDuration: '2s' }} />
          </g>
        </g>
      </svg>

      <style>{`
        @keyframes living-neural {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.05); }
        }
        @keyframes living-neural-fast {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(12deg) scale(1.1); }
        }
        @keyframes synapse-fire {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.5); filter: brightness(2) blur(1px); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.8; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        .animate-living-neural { animation: living-neural 8s ease-in-out infinite; }
        .animate-living-neural-fast { animation: living-neural-fast 2.5s ease-in-out infinite; }
        .animate-synapse-fire { animation: synapse-fire 1s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        
        @keyframes nucleus-breathing {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; filter: brightness(1.2); }
        }
        @keyframes nucleus-breathing-fast {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; filter: brightness(1.8); }
        }
        .animate-nucleus-breathing { transform-origin: center; animation: nucleus-breathing 4s ease-in-out infinite; }
        .animate-nucleus-breathing-fast { transform-origin: center; animation: nucleus-breathing-fast 1.2s ease-in-out infinite; }
        
        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-fast { animation: spin-fast 1.5s linear infinite; }
        .animate-spin-slow { animation: spin-fast 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default DendritesLogo;
