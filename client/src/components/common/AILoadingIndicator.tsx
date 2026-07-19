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

const thinkingFlows = [
  [
    "Initiating vector search for relevant code snippets...",
    "Querying Qdrant collection 'code_collection' using dense vectors (dim: 768)...",
    "Querying Qdrant sparse index using BM25 query text...",
    "Retrieved 4 candidate code blocks (RRF fusion threshold > 0.40)...",
    "Running Voyage rerank-2.5-lite on candidate blocks...",
    "Selected 2 code blocks with highest semantic relevance (scores: 0.892, 0.741)...",
    "Injecting files to context: QdrantVectorRepository.ts, AIServiceAdapter.ts...",
    "Synthesizing context and preparing streaming completion..."
  ],
  [
    "Accessing active workspace hierarchy and folder settings...",
    "Found parent folder 'Algorithms' (ID: alg_982)...",
    "Retrieving custom folder behaviors and system constraints...",
    "Applying active user profile (Expertise: intermediate, Style: visual)...",
    "Scanning memory database for historical session facts...",
    "Found 3 relevant user preferences to personalize response...",
    "Formatting roadmap schema with custom learning milestones...",
    "LLM preparing structured roadmap payload..."
  ],
  [
    "Checking query for safety and prompt injection attempts...",
    "Analyzing query intent (Workspace request: true, Target folder: 'root')...",
    "Generating structural blueprint for workspace layout...",
    "Mapping folder hierarchy (Milestones and chat sub-topics)...",
    "Validating blueprint configuration against directory database...",
    "Preparing system behavior directives for workspace companion...",
    "Structuring agent reply in conversational format..."
  ]
];

export const AILoadingIndicator: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);
  const thinkingContainerRef = useRef<HTMLDivElement>(null);

  const [showThinking, setShowThinking] = useState(false);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState("");
  

  const [flowIndex] = useState(() => Math.floor(Math.random() * thinkingFlows.length));
  const activeFlow = thinkingFlows[flowIndex];


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


  useEffect(() => {
    const timer = setTimeout(() => {
      setShowThinking(true);
      if (thinkingContainerRef.current) {
        gsap.fromTo(
          thinkingContainerRef.current,
          { opacity: 0, height: 0 },
          { opacity: 1, height: "auto", duration: 0.5, ease: "power2.out" }
        );
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    if (!showThinking) return;

    let currentLineIdx = completedLines.length;
    if (currentLineIdx >= activeFlow.length) return;

    const fullText = activeFlow[currentLineIdx];
    let charIdx = 0;

    const typingInterval = setInterval(() => {
      setCurrentLineText((prev) => prev + fullText[charIdx]);
      charIdx++;

      if (charIdx >= fullText.length) {
        clearInterval(typingInterval);
        
      
        setTimeout(() => {
          setCompletedLines((prev) => [...prev, fullText]);
          setCurrentLineText("");
        }, 600);
      }
    }, 25);

    return () => clearInterval(typingInterval);
  }, [showThinking, completedLines, flowIndex]);

  return (
    <div className="flex flex-col w-full max-w-full mt-6 py-1">
      <div className="flex items-center gap-2">
        {/* Loading Spinner */}
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
        </div>
        <span
          ref={textRef}
          className="shimmer-text text-[14px] font-medium tracking-tight"
        >
          {loadingTexts[textIndex]}
        </span>
      </div>

      {/* Dynamic Agent Thinking Console */}
      {showThinking && (
        <div
          ref={thinkingContainerRef}
          className="mt-3 flex flex-col gap-1.5 p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-zinc-500 font-semibold tracking-wider uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Agent thinking logs
          </div>
          
          <div className="flex flex-col gap-1 font-mono text-[11px] leading-relaxed text-zinc-400">
            {completedLines.map((line, idx) => (
              <div key={idx} className="flex gap-1.5 items-start">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span>{line}</span>
              </div>
            ))}
            
            {completedLines.length < activeFlow.length && (
              <div className="flex gap-1.5 items-start">
                <span className="text-emerald-500 animate-pulse select-none">&gt;</span>
                <span className="text-zinc-300">
                  {currentLineText}
                  <span className="inline-block w-1.5 h-3 ml-0.5 bg-zinc-400 animate-pulse" />
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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