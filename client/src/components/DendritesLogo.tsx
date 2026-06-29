import React, { useEffect, useRef } from "react";

interface NuronsLogoProps {
  size?: number | string;
  className?: string;
  isLoading?: boolean;
  color?: string;
}

/**
 * Nurons mark — an "N" built from neuron anatomy: two somas per side
 * (trunk ends), a single axon-like diagonal forming the spine of the
 * "N", and small dendrite branches feeding into each soma.
 *
 * Loading state: a dramatic pulsing glow ring around the mark,
 * bright white traveling dots along dendrites and axon,
 * and a breathing scale animation on the whole SVG.
 *
 * Respects prefers-reduced-motion by freezing on a static glow state.
 */
const DendritesLogo: React.FC<NuronsLogoProps> = ({
  size = 46,
  className = "",
  isLoading = false,
  color = "#3b82f6",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !isLoading) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dendritePaths = [
      svg.querySelector<SVGPathElement>("#nl-d1"),
      svg.querySelector<SVGPathElement>("#nl-d2"),
      svg.querySelector<SVGPathElement>("#nl-d3"),
      svg.querySelector<SVGPathElement>("#nl-d4"),
    ];
    const dendriteDots = [
      svg.querySelector<SVGCircleElement>("#nl-p1"),
      svg.querySelector<SVGCircleElement>("#nl-p2"),
      svg.querySelector<SVGCircleElement>("#nl-p3"),
      svg.querySelector<SVGCircleElement>("#nl-p4"),
    ];
    const axonPath = svg.querySelector<SVGPathElement>("#nl-axon");
    const axonDot = svg.querySelector<SVGCircleElement>("#nl-paxon");
    const arrivalGlow = svg.querySelector<SVGCircleElement>("#nl-glow");
    const pulseRing = svg.querySelector<SVGCircleElement>("#nl-pulse-ring");

    if (
      dendritePaths.some((p) => !p) ||
      dendriteDots.some((d) => !d) ||
      !axonPath ||
      !axonDot ||
      !arrivalGlow
    ) {
      return;
    }

    // Re-bind as non-null so TypeScript trusts them inside the frame() closure
    const _svg = svg;
    const _axonPath = axonPath;
    const _axonDot = axonDot;
    const _arrivalGlow = arrivalGlow;

    if (reduceMotion) {
      _arrivalGlow.setAttribute("opacity", "0.35");
      dendriteDots.forEach((d) => d!.setAttribute("opacity", "0"));
      _axonDot.setAttribute("opacity", "0");
      return;
    }

    const dLens = dendritePaths.map((p) => p!.getTotalLength());
    const axonLen = _axonPath.getTotalLength();

    // Faster, more visible timing
    const DENDRITE_DURATION = 500;
    const DENDRITE_GAPS = [600, 550, 500, 450];
    const DENDRITE_DELAYS = [0, 120, 240, 360];

    const AXON_CYCLE = 1400;
    const FIRE_START = 600;
    const FIRE_DUR = 450;
    const GLOW_DUR = 350;

    const start = performance.now();

    function frame(now: number) {
      const elapsed = now - start;

      // Breathing effect on the whole SVG
      const breathe = Math.sin(elapsed / 800) * 0.06 + 1;
      _svg.style.transform = `scale(${breathe})`;

      // Pulse ring
      if (pulseRing) {
        const ringPhase = (elapsed % 1800) / 1800;
        const ringR = 90 + ringPhase * 30;
        const ringOpacity = Math.max(0, 0.6 - ringPhase * 0.7);
        pulseRing.setAttribute("r", String(ringR));
        pulseRing.setAttribute("opacity", String(ringOpacity));
        pulseRing.setAttribute("stroke-width", String(3 - ringPhase * 2));
      }

      // Dendrite pulses — brighter, larger
      dendritePaths.forEach((path, i) => {
        const cycle = DENDRITE_DURATION + DENDRITE_GAPS[i];
        const local = elapsed - DENDRITE_DELAYS[i];
        if (local < 0) {
          dendriteDots[i]!.setAttribute("opacity", "0");
          return;
        }
        const t = local % cycle;
        if (t > DENDRITE_DURATION) {
          dendriteDots[i]!.setAttribute("opacity", "0");
        } else {
          const progress = t / DENDRITE_DURATION;
          const pt = path!.getPointAtLength(progress * dLens[i]);
          dendriteDots[i]!.setAttribute("cx", String(pt.x));
          dendriteDots[i]!.setAttribute("cy", String(pt.y));
          // Fade in then out for a comet trail feel
          const dotOpacity = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
          dendriteDots[i]!.setAttribute("opacity", String(dotOpacity));
        }
      });

      // Axon firing pulse
      const axonT = elapsed % AXON_CYCLE;
      if (axonT < FIRE_START || axonT > FIRE_START + FIRE_DUR) {
        _axonDot.setAttribute("opacity", "0");
      } else {
        const lt = (axonT - FIRE_START) / FIRE_DUR;
        const pt = _axonPath.getPointAtLength(lt * axonLen);
        _axonDot.setAttribute("cx", String(pt.x));
        _axonDot.setAttribute("cy", String(pt.y));
        _axonDot.setAttribute("opacity", "1");
      }

      // Arrival flash — larger, more intense
      const glowT = (axonT - (FIRE_START + FIRE_DUR)) / GLOW_DUR;
      if (glowT >= 0 && glowT < 1) {
        _arrivalGlow.setAttribute("opacity", String((1 - glowT) * 1));
      } else {
        _arrivalGlow.setAttribute("opacity", "0");
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      _svg.style.transform = "";
      dendriteDots.forEach((d) => d!.setAttribute("opacity", "0"));
      _axonDot.setAttribute("opacity", "0");
      _arrivalGlow.setAttribute("opacity", "0");
      if (pulseRing) pulseRing.setAttribute("opacity", "0");
    };
  }, [isLoading]);

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ transformOrigin: "center center" }}
        role="img"
        aria-label="Nurons"
        aria-busy={isLoading}
      >
        <defs>
          <radialGradient id="nl-somaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#93c5fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <filter id="nl-dotGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Expanding pulse ring — only visible during loading */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
          id="nl-pulse-ring"
          opacity="0"
        />

        {/* trunks + axon — the strokes that form the "N" */}
        <g stroke={color} strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M52 150 L52 50" />
          <path d="M148 50 L148 150" />
          <path d="M52 50 C 80 90, 120 110, 148 150" id="nl-axon" />
        </g>

        {/* dendrite branches off each trunk */}
        <g stroke={color} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M52 70 Q 34 64 24 52" id="nl-d1" />
          <path d="M52 130 Q 34 136 24 148" id="nl-d2" />
          <path d="M148 70 Q 166 64 176 52" id="nl-d3" />
          <path d="M148 130 Q 166 136 176 148" id="nl-d4" />
        </g>

        {/* Arrival flash glow — bigger radius */}
        <circle
          cx="148"
          cy="150"
          r="40"
          fill="url(#nl-somaGlow)"
          id="nl-glow"
          opacity="0"
        />

        {/* somas — trunk ends */}
        <g fill={color}>
          <circle cx="52" cy="50" r="13" />
          <circle cx="52" cy="150" r="13" />
          <circle cx="148" cy="50" r="13" />
          <circle cx="148" cy="150" r="13" />
        </g>

        {/* synapse tips */}
        <g fill={color}>
          <circle cx="24" cy="52" r="5" />
          <circle cx="24" cy="148" r="5" />
          <circle cx="176" cy="52" r="5" />
          <circle cx="176" cy="148" r="5" />
        </g>

        {/* traveling pulse dots — bigger, brighter, with glow filter */}
        <g fill="#ffffff" filter="url(#nl-dotGlow)">
          <circle r="7" id="nl-p1" opacity="0" />
          <circle r="7" id="nl-p2" opacity="0" />
          <circle r="7" id="nl-p3" opacity="0" />
          <circle r="7" id="nl-p4" opacity="0" />
        </g>
        <circle r="9" fill="#ffffff" filter="url(#nl-dotGlow)" id="nl-paxon" opacity="0" />
      </svg>
    </div>
  );
};

export default DendritesLogo;