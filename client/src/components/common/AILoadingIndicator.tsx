import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const loadingTexts = [
  "Analyzing context",
  "Searching web",
  "Mapping the details",
  "Gathering insights",
  "Structuring response",
  "Synthesizing",
  "Almost there",
];

export const AILoadingIndicator: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!textRef.current) return;
      gsap.to(textRef.current, {
        opacity: 0,
        y: -4,
        duration: 0.25,
        ease: "power1.in",
        onComplete: () => {
          setTextIndex((prev) => (prev + 1) % loadingTexts.length);
          gsap.fromTo(
            textRef.current,
            { opacity: 0, y: 4 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" }
          );
        },
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full max-w-full mt-6 items-center py-1">
      <span
        ref={textRef}
        className="shimmer-text text-[14px] font-medium tracking-tight"
      >
        {loadingTexts[textIndex]}
      </span>

      <style>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(161, 161, 170, 0.55) 0%,
            rgba(161, 161, 170, 0.55) 35%,
            rgba(245, 245, 245, 0.95) 50%,
            rgba(161, 161, 170, 0.55) 65%,
            rgba(161, 161, 170, 0.55) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer-sweep 1.8s linear infinite;
        }

        @keyframes shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};