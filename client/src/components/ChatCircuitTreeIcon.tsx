import React from 'react';

// Defining props for customization, allowing standard SVG and HTML props.
interface TechNetworkIconProps extends React.SVGProps<SVGSVGElement> {
  // Option to set a primary color theme, defaulting to the original blue gradient if not provided.
  primaryColor?: string;
}

const TechNetworkIcon: React.FC<TechNetworkIconProps> = ({ primaryColor, ...props }) => {
  // Use provided primaryColor or fall back to the dynamic gradient logic
  const strokeColor = primaryColor || "url(#techNetworkGrad)";

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      // Default size, adjustable via props
      width="200"
      height="200"
      {...props} // Spread standard props (style, className, etc.)
    >
      <defs>
        {/* Blue to Teal gradient for the main lines */}
        <linearGradient id="techNetworkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#33CCFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#003366', stopOpacity: 1 }} />
        </linearGradient>

        {/* Lighter Cyan gradient for chat bubbles */}
        <linearGradient id="chatBubbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#66FFFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0099CC', stopOpacity: 1 }} />
        </linearGradient>

        {/* Filter for 3D beveled edges and inner depth - essential for reproducing the original look */}
        <filter id="bevelEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" result="composite" />
          <feColorMatrix in="composite" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          <feMerge>
            <feMergeNode in="offsetBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Reuseable elements */}
        {/* A simple square leaf node */}
        <rect id="network_node" x="-6" y="-6" width="12" height="12" rx="1.5" fill="#66FFFF" filter="url(#bevelEffect)"/>
        
        {/* A complete chat bubble with three dots inside */}
        <g id="chat_bubble_element">
          <circle cx="0" cy="0" r="28" fill="url(#chatBubbleGrad)" filter="url(#bevelEffect)"/>
          {/* Chat dots */}
          <circle cx="-12" cy="0" r="3" fill="#003366" />
          <circle cx="0" cy="0" r="3" fill="#003366" />
          <circle cx="12" cy="0" r="3" fill="#003366" />
        </g>
      </defs>

      {/* Main network structure (lines and central trunk) */}
      <g fill="none" stroke={strokeColor} strokeWidth="12" strokeLinejoin="round" filter="url(#bevelEffect)">
        {/* Vertical Trunk */}
        <polyline points="256,430 256,220" />

        {/* Root System (stacked bases) */}
        <path d="M 230 430 H 282 V 480 Q 282 490, 272 490 H 240 Q 230 490, 230 480 V 430 Z" />
        <rect x="230" y="440" width="52" height="10" />
        <rect x="230" y="455" width="52" height="10" />
        <rect x="230" y="470" width="52" height="10" />

        {/* Main left branch cluster */}
        <polyline points="256,280 180,280 180,180 100,180" />
        <polyline points="180,220 120,220" />
        <polyline points="180,250 140,250" />

        {/* Secondary left branches */}
        <polyline points="256,330 140,330 140,280" />
        <polyline points="256,370 110,370 110,320" />
        <polyline points="110,350 70,350" />

        {/* Far left upper branch */}
        <polyline points="180,180 180,120 140,120" />
        <polyline points="180,150 200,150" />

        {/* Main right branch cluster */}
        <polyline points="256,280 332,280 332,180 412,180" />
        <polyline points="332,220 392,220" />
        <polyline points="332,250 372,250" />

        {/* Secondary right branches */}
        <polyline points="256,330 372,330 372,280" />
        <polyline points="256,370 402,370 402,320" />
        <polyline points="402,350 442,350" />

        {/* Central upper structure */}
        <polyline points="256,220 256,120 220,120" />
        <polyline points="256,150 292,150 292,100" />

        {/* Minor central inner branch */}
        <polyline points="256,180 230,180 230,150" />
      </g>

      {/* Chat Bubbles (leaves) - positioned using <use> */}
      <use href="#chat_bubble_element" x="256" y="70" /> {/* Top Center */}
      <use href="#chat_bubble_element" x="140" y="110" transform="rotate(-30 140 110)" /> {/* Top Left */}
      <use href="#chat_bubble_element" x="372" y="110" transform="rotate(30 372 110)" /> {/* Top Right */}

      {/* Network Nodes (squares) - positioned using <use> */}
      {/* Left side nodes */}
      <use href="#network_node" x="100" y="180" />
      <use href="#network_node" x="120" y="220" />
      <use href="#network_node" x="140" y="250" />
      <use href="#network_node" x="140" y="280" />
      <use href="#network_node" x="110" y="320" />
      <use href="#network_node" x="70" y="350" />
      <use href="#network_node" x="110" y="370" />

      {/* Central area nodes */}
      <use href="#network_node" x="220" y="120" />
      <use href="#network_node" x="292" y="100" />
      <use href="#network_node" x="230" y="150" />

      {/* Right side nodes */}
      <use href="#network_node" x="412" y="180" />
      <use href="#network_node" x="392" y="220" />
      <use href="#network_node" x="372" y="250" />
      <use href="#network_node" x="372" y="280" />
      <use href="#network_node" x="402" y="320" />
      <use href="#network_node" x="442" y="350" />
      <use href="#network_node" x="402" y="370" />
    </svg>
  );
};

export default TechNetworkIcon;