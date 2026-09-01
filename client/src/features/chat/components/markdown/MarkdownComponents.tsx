import React, { useEffect, useState, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import P5Sandbox from "../P5Sandbox";
import { MermaidBlock } from "react-markdown-mermaid";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { createPortal } from "react-dom";
// @ts-ignore
import plantumlEncoder from "plantuml-encoder";

const PlantUMLViewer = ({ src, alt }: { src: string; alt?: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activePointers = useRef<PointerEvent[]>([]);
  const lastDistance = useRef<number | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointers.current.push(e.nativeEvent);

    if (activePointers.current.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (activePointers.current.length === 2) {
      setIsDragging(false);
      const [p1, p2] = activePointers.current;
      lastDistance.current = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const idx = activePointers.current.findIndex(p => p.pointerId === e.pointerId);
    if (idx !== -1) {
      activePointers.current[idx] = e.nativeEvent;
    }

    if (activePointers.current.length === 1 && isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (activePointers.current.length === 2) {
      const [p1, p2] = activePointers.current;
      const currentDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      if (lastDistance.current !== null && lastDistance.current > 0) {
        const factor = currentDistance / lastDistance.current;
        setScale(prev => Math.max(0.5, Math.min(prev * factor, 10)));
      }
      lastDistance.current = currentDistance;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current = activePointers.current.filter(p => p.pointerId !== e.pointerId);

    if (activePointers.current.length < 2) {
      lastDistance.current = null;
    }
    if (activePointers.current.length === 0) {
      setIsDragging(false);
    } else if (activePointers.current.length === 1) {
      setIsDragging(true);
      const remainingPointer = activePointers.current[0];
      setDragStart({ x: remainingPointer.clientX - position.x, y: remainingPointer.clientY - position.y });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = scale;
    if (e.deltaY < 0) {
      newScale = Math.min(scale * zoomFactor, 10);
    } else {
      newScale = Math.max(scale / zoomFactor, 0.5);
    }
    setScale(newScale);
  };

  const zoomIn = () => setScale(prev => Math.min(prev * 1.25, 10));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative group/diagram my-6 flex flex-col items-center p-6 rounded-xl hover:scale-120 transition-all overflow-hidden w-full">
      <button
        onClick={() => {
          setIsModalOpen(true);
          resetZoom();
        }}
        className="absolute top-4 right-4 p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-zinc-300 hover:text-white border border-white/10 opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
        title="Expand Diagram"
      >
        <Maximize2 size={14} />
      </button>
      <img
        src={src}
        alt={alt || "Diagram"}
        onClick={() => {
          setIsModalOpen(true);
          resetZoom();
        }}
        style={{ filter: "invert(0.9) hue-rotate(180deg)" }}
        className="max-w-full h-auto select-none cursor-zoom-in"
        draggable={false}
      />

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100002] bg-black/85 backdrop-blur-md flex flex-col justify-between select-none pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/20 backdrop-blur-xs border-b border-white/5 z-10">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Diagram Viewer
            </span>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-zinc-800/80 hover:bg-zinc-700/85 text-zinc-300 hover:text-white rounded-full border border-white/10 transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Interactive Viewport */}
          <div
            className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            <img
              src={src}
              alt={alt || "Diagram"}
              draggable={false}
              style={{
                filter: "invert(0.9) hue-rotate(180deg)",
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                transformOrigin: "center center",
                maxHeight: "85vh",
                maxWidth: "90vw",
                objectFit: "contain"
              }}
            />
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1.5 p-1.5 bg-zinc-900/90 border border-white/10 shadow-2xl rounded-2xl">
            <button
              onClick={zoomIn}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-zinc-300 transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={zoomOut}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-zinc-300 transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-zinc-300 transition-colors cursor-pointer flex items-center justify-center font-bold text-sm min-w-9"
              title="Reset Zoom (=)"
            >
              =
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const PlantUMLBlock = ({ codeString }: { codeString: string }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setImageError(false);

    try {
      const encoded = plantumlEncoder.encode(codeString);
      const plantumlUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      setUrl(plantumlUrl);

      fetch(plantumlUrl)
        .then((res) => {
          if (!active) return;
          if (!res.ok) {
            throw new Error("Failed to load PlantUML");
          }
          setImageError(false);
          setIsLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setImageError(true);
          setIsLoading(false);
        });
    } catch (e) {
      if (active) {
        setImageError(true);
        setIsLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [codeString]);

  if (isLoading) {
    return (
      <div className="my-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/10 flex items-center justify-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
        <span className="text-sm text-zinc-500">Generating PlantUML diagram...</span>
      </div>
    );
  }

  if (imageError || !url) {
    return (
      <div className="my-6 p-4 rounded-xl border border-zinc-800">
        <p className="text-red-500/40">Failed to render PlantUML diagram.</p>
      </div>
    );
  }

  return <PlantUMLViewer src={url} alt="PlantUML Diagram" />;
};

export const markdownComponents = {
  p({ children, ...props }: React.ComponentPropsWithoutRef<"p">) {
    return (
      <div className="mb-4 last:mb-0" {...props}>
        {children}
      </div>
    );
  },
  img({ src, alt, ...props }: React.ComponentPropsWithoutRef<"img">) {
    const isPlantUML = src && (src.includes("plantuml.com") || src.includes("plantuml"));
    if (isPlantUML) {
      return <PlantUMLViewer src={src} alt={alt || "PlantUML Diagram"} />;
    }
    return (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto my-4 rounded-lg"
        {...props}
      />
    );
  },

  MermaidBlock: ({ children }: { children: string }) => {
    return (
      <div className="my-6 flex justify-center  p-4 rounded-xl bordershadow-lg">
        <MermaidBlock code={children} />
      </div>
    );
  },

  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = Array.isArray(children)
      ? children.join("")
      : String(children).replace(/\n$/, "");

    if (match && match[1] === "plantuml") {
   
      const sanitizedCode = codeString
        .replace(/^\s*direction\s+LR\s*$/gm, "left to right direction")
        .replace(/^\s*direction\s+TB\s*$/gm, "top to bottom direction")
        .replace(/^\s*direction\s+RL\s*$/gm, "right to left direction")
        .replace(/^\s*direction\s+BT\s*$/gm, "bottom to top direction");

      return <PlantUMLBlock codeString={sanitizedCode} />;
    }

    if (match && match[1] === "mermaid") {
      return (
        <div className="my-6 w-full overflow-x-auto flex justify-center  p-4 rounded-xl ">
          <div className="mermaid-container min-w-[600px] transition-all">
            <MermaidBlock code={codeString} />
          </div>
          <style>{`
        /* Target the mermaid SVG to ensure text remains legible */
        .mermaid-container svg {
          height: auto !important; /* Let the height grow based on content */
          max-height: 500px;       /* Limit height if it gets too long */
          width: 100% !important;
        }
        .mermaid-container .node text {
          font-size: 16px !important; /* Force a readable font size */
        }
      `}</style>
        </div>
      );
    }

    if (match && match[1] === "p5") {
      return <P5Sandbox p5CodeString={codeString} />;
    }

    // Plain text / ASCII diagrams — skip SyntaxHighlighter entirely to avoid
    // the green tint, row highlights, and "[Enter]" artifacts it adds.
    const isPlainText = match && ["text", "plain", "ascii", "txt"].includes(match[1]);
    if (isPlainText) {
      return (
        <div className="my-5 rounded-xl overflow-hidden border border-white/5 bg-zinc-900/60 shadow-lg">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/60 border-b border-white/5">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
              {match[1].toUpperCase()}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(codeString)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded hover:bg-white/5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "1.25rem",
              fontSize: "13.5px",
              lineHeight: "1.65",
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              color: "#d4d4d4",
              whiteSpace: "pre",
              overflowX: "auto",
              background: "transparent",
            }}
          >
            {codeString}
          </pre>
        </div>
      );
    }

    return match ? (
      <div className="my-5 rounded-xl overflow-hidden border border-white/5 bg-[var(--theme-bg-surface)] shadow-lg">
        {/* Language header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--theme-bg-elevated)] border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            <span>{match[1].toUpperCase()}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded hover:bg-white/5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        {/* Code block */}
        <SyntaxHighlighter
          style={vscDarkPlus as { [key: string]: React.CSSProperties }}
          language={match[1]}
          PreTag="pre"
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            background: "transparent",
            fontSize: "14.5px",
            lineHeight: "1.6",
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    ) : (
      <SyntaxHighlighter
        style={vscDarkPlus as { [key: string]: React.CSSProperties }}
        language="javascript"
        PreTag="span"
        codeTagProps={{
          style: {
            fontSize: "14px",
            lineHeight: "1",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          },
        }}
        customStyle={{
          display: "inline", 
          margin: "0 0.15rem",
          padding: "0.1rem 0.3rem",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "0.25rem",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  },
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
  table({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
      <div className="w-full overflow-x-auto my-6 rounded-xl border border-zinc-700/50 shadow-md">
        <table
          className="w-full text-left border-collapse text-[15px]"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
      <thead className="bg-zinc-800/40 border-b border-zinc-700/60" {...props}>
        {children}
      </thead>
    );
  },
  tbody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
      <tbody className="divide-y divide-zinc-700/40" {...props}>
        {children}
      </tbody>
    );
  },
  th({ children, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
    return (
      <th
        className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement>) {
    return (
      <td className="px-4 py-3 text-gray-300" {...props}>
        {children}
      </td>
    );
  },
  tr({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
      <tr
        className="hover:bg-zinc-800/50 transition-colors even:bg-zinc-800/30"
        {...props}
      >
        {children}
      </tr>
    );
  },
  blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
    // Extract the text content to detect callout patterns
    let isCallout = false;
    let calloutType = "note";
    let title = "";

    // A helper to recursively extract the first text string from React children
    const extractFirstText = (nodes: React.ReactNode): string => {
      let text = "";
      React.Children.forEach(nodes, (child) => {
        if (typeof child === "string") {
          text += child;
        } else if (React.isValidElement(child)) {
          text += extractFirstText((child as React.ReactElement<{ children?: React.ReactNode }>).props.children);
        }
      });
      return text;
    };

    const firstText = extractFirstText(children);

    // Detect GitHub-style callouts like [!NOTE], [!WARNING], etc.
    const calloutMatch = firstText.match(
      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
    );

    if (calloutMatch) {
      isCallout = true;
      calloutType = calloutMatch[1].toLowerCase();
      // Capitalize first letter for the title
      title = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
    }

    // A helper to clone the children and strip the [!TYPE] string from the start.
    const stripCalloutPrefix = (nodes: React.ReactNode, prefixToStrip: string): React.ReactNode => {
      let stripped = false; // Only strip once
      return React.Children.map(nodes, (child) => {
        if (
          typeof child === "string" &&
          !stripped &&
          child.trim().startsWith(prefixToStrip)
        ) {
          stripped = true;
          const newStr = child.replace(
            new RegExp(
              `^\\s*${prefixToStrip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`,
              "i",
            ),
            "",
          );
          return newStr || null; // If empty string after strip, return null so it doesn't render an empty line
        }
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child,
            (child as React.ReactElement<{ children?: React.ReactNode }>).props,
            stripCalloutPrefix(
              (child as React.ReactElement<{ children?: React.ReactNode }>).props.children,
              prefixToStrip,
            ),
          );
        }
        return child;
      });
    };

    let processedChildren = children;
    if (isCallout && calloutMatch) {
      processedChildren = stripCalloutPrefix(children, calloutMatch[0]);
    }

    if (isCallout) {
      // Premium colors based on callout type
      const styles: Record<
        string,
        {
          bg: string;
          border: string;
          text: string;
          iconColor: string;
          icon: React.ReactNode;
        }
      > = {
        note: {
          bg: "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-400",
          iconColor: "text-blue-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.5a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
            </svg>
          ),
        },
        tip: {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/50",
          text: "text-emerald-400",
          iconColor: "text-emerald-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
            </svg>
          ),
        },
        important: {
          bg: "bg-purple-500/10",
          border: "border-purple-500/50",
          text: "text-purple-400",
          iconColor: "text-purple-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
            </svg>
          ),
        },
        warning: {
          bg: "bg-amber-500/10",
          border: "border-amber-500/50",
          text: "text-amber-400",
          iconColor: "text-amber-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.399A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.554Zm4.415 4.303a.75.75 0 0 0-1.45-.385L8.25 9.5a.75.75 0 0 0 1.5 0Zm-1.859 6.4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"></path>
            </svg>
          ),
        },
        caution: {
          bg: "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-400",
          iconColor: "text-red-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
            </svg>
          ),
        },
      };

      const style = styles[calloutType] || styles.note;

      return (
        <div
          data-callout-type={calloutType}
          className={`my-5 p-4 rounded-xl border-l-[3px] ${style.bg} ${style.border} text-gray-300 text-[15.5px] shadow-sm`}
          {...(props as unknown as React.HTMLAttributes<HTMLDivElement>)}
        >
          <div
            className={`flex items-center gap-2 mb-2 font-semibold ${style.text}`}
          >
            <span className={`shrink-0 mt-px ${style.iconColor}`}>
              {style.icon}
            </span>
            <span>{title}</span>
          </div>
          <div className="opacity-90 leading-relaxed [&>p:last-child]:mb-0 [&>p:first-child]:mt-0">
            {processedChildren}
          </div>
        </div>
      );
    }

    // Default premium blockquote (if no callout string is found)
    return (
      <blockquote
        className="my-5 py-3 pr-4 pl-5 border-l-[3px] border-zinc-500/50 bg-zinc-800/30 rounded-r-xl text-gray-400 italic"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
};

// Compact variant used only in QuickChatModal
export const compactMarkdownComponents = {
  ...markdownComponents,
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = Array.isArray(children)
      ? children.join("")
      : String(children).replace(/\n$/, "");

    if (match && match[1] === "p5") {
      return <P5Sandbox p5CodeString={codeString} compact />;
    }

   
    return markdownComponents.code({ className, children });
  },
};
