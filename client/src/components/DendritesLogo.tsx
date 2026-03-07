import React from "react";

interface DendritesLogoProps {
  size?: number | string;
  className?: string;
  isRotate?: boolean;
}

const DendritesLogo: React.FC<DendritesLogoProps> = ({
  size = 46,
  className = "",
  isRotate = false,
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
        className="w-full h-full drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
      >
        <defs>
          <linearGradient
            id="dendriteGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
            <stop offset="50%" stopColor="#0ea5e9" /> {/* sky-500 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
          </linearGradient>
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cffafe" /> {/* cyan-100 */}
            <stop offset="100%" stopColor="#22d3ee" /> {/* cyan-400 */}
          </linearGradient>
          <filter
            id="glow-intense"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Symmetrical Star Branch */}
          <g id="starBranch">
            {/* Main Spine */}
            <path
              d="M 50 50 L 50 15"
              stroke="url(#dendriteGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 50 50 L 50 15"
              stroke="url(#coreGradient)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="1"
            />

            {/* Side Prongs */}
            <path
              d="M 50 35 L 40 25 M 50 35 L 60 25"
              stroke="url(#dendriteGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 50 35 L 40 25 M 50 35 L 60 25"
              stroke="url(#coreGradient)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="1"
            />

            {/* Terminal Nodes
            <circle
              cx="50"
              cy="15"
              r="2.5"
              fill="url(#coreGradient)"
              filter="url(#glow-intense)"
            />
            <circle
              cx="40"
              cy="25"
              r="2"
              fill="url(#coreGradient)"
              filter="url(#glow-intense)"
            />
            <circle
              cx="60"
              cy="25"
              r="2"
              fill="url(#coreGradient)"
              filter="url(#glow-intense)"
            /> */}
          </g>
        </defs>

        {/* Dynamic Star Container */}
        <g
          className={`${isRotate ? "animate-spin-slow" : ""} origin-center`}
          style={{ transformOrigin: "50px 50px" }}
        >
          {/* 6-Fold Symmetry Star Branches */}
          <use href="#starBranch" transform="rotate(0 50 50)" />
          <use href="#starBranch" transform="rotate(60 50 50)" />
          <use href="#starBranch" transform="rotate(120 50 50)" />
          <use href="#starBranch" transform="rotate(180 50 50)" />
          <use href="#starBranch" transform="rotate(240 50 50)" />
          <use href="#starBranch" transform="rotate(300 50 50)" />
        </g>

        {/* Glowing Central Star Core */}
        <g filter="url(#glow-intense)">
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#dendriteGradient)"
            opacity="0.8"
          />
          <circle cx="50" cy="50" r="5" fill="url(#coreGradient)" opacity="1" />
          <circle
            cx="50"
            cy="50"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
          />
        </g>
      </svg>
    </div>
  );
};

export default DendritesLogo;
