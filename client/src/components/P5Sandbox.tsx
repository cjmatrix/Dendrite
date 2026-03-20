import { useEffect, useRef, useContext, useState } from "react";
import { StreamingContext } from "../contexts/StreamingContext";
import { Maximize2, Minimize2 } from "lucide-react";

interface P5SandboxProps {
  p5CodeString: string;
}

export default function P5Sandbox({ p5CodeString }: P5SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isStreaming = useContext(StreamingContext);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!iframeRef.current || isStreaming) return;

   
    iframeRef.current.contentWindow?.postMessage(
      { code: p5CodeString },
      "*"
    );
  }, [p5CodeString, isStreaming]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // When expanding, we pull the element out of the markdown flow and cover the entire viewport
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-zinc-950/95 flex justify-center items-center p-4 sm:p-8 backdrop-blur-md"
    : "w-full flex justify-center my-6 relative group";

  // The inner wrapper holds the iframe and the absolute positioned expand buttons
  const iframeWrapperClasses = isFullscreen
    ? "relative w-full h-[90vh] max-w-7xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] flex bg-zinc-900/40 rounded-2xl overflow-hidden border border-zinc-700/80"
    : "relative w-full max-w-2xl h-[400px] border border-zinc-700/50 rounded-xl bg-zinc-900/40 shadow-xl overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={iframeWrapperClasses}>
      
        {/* Fullscreen Toggle Button - appears on hover in standard mode, always visible in fullscreen mode */}
        {!isStreaming && (
          <button 
            onClick={toggleFullscreen}
            className={`absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-black/40 text-gray-400 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-lg border border-white/10 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} strokeWidth={2.5} /> : <Maximize2 size={18} strokeWidth={2.5} />}
          </button>
        )}

        {isStreaming && (
          <div className="absolute inset-0 z-10 w-full h-full bg-zinc-900/80 backdrop-blur-sm flex flex-col justify-center items-center">
            <div className="w-8 h-8 rounded-full border-[3px] border-purple-500 border-t-transparent animate-spin mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <span className="text-sm font-semibold text-purple-200 tracking-wider uppercase drop-shadow-md">
               Generating P5 Simulation...
            </span>
          </div>
        )}
        
        {/* We mount the iframe immediately in the background so sandbox_p5.html completes downloading silently */}
        <iframe
          ref={iframeRef}
          src="/sandbox_p5.html"
          title="P5.js Message-based Sandbox"
          sandbox="allow-scripts"
          className="w-full h-full border-none"
          onLoad={() => {
             if (!isStreaming) {
                 iframeRef.current?.contentWindow?.postMessage({ code: p5CodeString }, "*");
             }
          }}
        />
      </div>
    </div>
  );
}
